"""
App Platform API endpoints.

Manages app installation, execution, and agent interaction.
Apps are complete applications (not workflows) with UI, state, and embedded Claude agents.
"""
import logging
from typing import Any, Dict, List, Optional
from pathlib import Path
import time
import hmac
import hashlib

from fastapi import APIRouter, HTTPException, status, Request, Header
from fastapi.responses import StreamingResponse, Response, RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select

from app.dependencies import CurrentUserDep, DatabaseDep
from app.config import settings
from app.models.app_platform import App, AppInstallation
from app.models.user import User
from app.core.app_installer import (
    install_app,
    uninstall_app,
    list_installed_apps,
    is_app_installed,
    AppInstallerError,
    DependencyResolutionError,
    PermissionDeniedError
)
from app.core.app_runtime import execute_app_action, execute_app_output, AppRuntimeError
from app.core.app_agent import process_app_agent_message, StreamEvent
from app.core.context_factory import create_app_context
from apps.torrent_streamer.stream_manager import get_stream_session_manager
from apps.torrent_streamer.hls_manager import get_hls_manager
from apps.torrent_streamer.memory_stream import MemoryStreamReader
from apps.torrent_streamer.ultra_fast_stream import UltraFastStreamer
from apps.torrent_streamer.remux_stream import RemuxStreamer
import json
import asyncio
import os

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response models

class AppInstallRequest(BaseModel):
    """Request to install an app."""
    config: Optional[Dict[str, Any]] = None  # Installation config


class AppActionRequest(BaseModel):
    """Request to execute an app action."""
    parameters: Dict[str, Any] = {}


class AgentChatRequest(BaseModel):
    """Request to chat with app agent."""
    message: str
    context: Optional[Dict[str, Any]] = None


class AppGenerateRequest(BaseModel):
    """Request to generate a new app."""
    app_id: str
    prompt: str
    app_name: Optional[str] = None
    category: str = "productivity"


class AppRefineRequest(BaseModel):
    """Request to refine an existing app."""
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None
    conversation_id: Optional[int] = None  # If provided, continue existing conversation


class AppInstallResponse(BaseModel):
    """Response from app installation."""
    success: bool
    app_id: str
    message: str
    installation_id: Optional[int] = None


class AppListResponse(BaseModel):
    """Response with list of apps."""
    apps: List[Dict[str, Any]]
    count: int


class AppActionResponse(BaseModel):
    """Response from app action execution."""
    success: bool
    result: Any
    error: Optional[str] = None


# Endpoints

@router.post("/generate")
async def generate_app_endpoint(
    request_data: AppGenerateRequest,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Dict[str, Any]:
    """
    Generate a new app using AI from a natural language prompt.

    Creates a draft app with frontend, backend, and manifest files.
    The app is stored in the user's directory and saved to database with status='draft'.

    Args:
        request_data: App generation parameters
        current_user: Current user
        db: Database session

    Returns:
        Generated app details

    Raises:
        HTTPException: If generation fails
    """
    try:
        from app.services.app_generator import get_app_generator
        from datetime import datetime

        logger.info(f"[API] Generating app '{request_data.app_id}' for user {current_user.id}")

        # Check if app_id already exists for this user
        result = await db.execute(
            select(App).where(
                App.id == request_data.app_id,
                App.owner_id == current_user.id
            )
        )
        existing_app = result.scalar_one_or_none()
        if existing_app:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"App '{request_data.app_id}' already exists"
            )

        # Generate app using Claude
        generator = get_app_generator()
        result = await generator.generate_app(
            user_id=current_user.id,
            app_id=request_data.app_id,
            prompt=request_data.prompt,
            app_name=request_data.app_name,
            category=request_data.category
        )

        # Create App record in database
        app = App(
            id=request_data.app_id,
            name=result["manifest"].get("name", request_data.app_name or request_data.app_id),
            description=result["manifest"].get("description", request_data.prompt[:200]),
            version=result["manifest"].get("version", "1.0.0"),
            author=current_user.email,
            manifest=result["manifest"],
            status="draft",
            app_directory=result["app_directory"],
            is_ai_generated=True,
            generation_prompt=request_data.prompt,
            owner_id=current_user.id,
            category=request_data.category,
            is_official=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(app)
        await db.commit()
        await db.refresh(app)

        logger.info(f"[API] App '{request_data.app_id}' generated successfully")

        return {
            "success": True,
            "app_id": app.id,
            "app": {
                "id": app.id,
                "name": app.name,
                "description": app.description,
                "version": app.version,
                "status": app.status,
                "app_directory": app.app_directory,
                "manifest": app.manifest
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] App generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"App generation failed: {str(e)}"
        )


@router.post("/{app_id}/publish")
async def publish_app_endpoint(
    app_id: str,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Dict[str, Any]:
    """
    Publish a draft app to the user's library.

    Changes app status from 'draft' to 'published', making it available
    for installation in the user's workspace.

    Args:
        app_id: App identifier
        current_user: Current user
        db: Database session

    Returns:
        Publication result

    Raises:
        HTTPException: If publication fails
    """
    try:
        from datetime import datetime

        logger.info(f"[API] Publishing app '{app_id}' for user {current_user.id}")

        # Get app
        result = await db.execute(
            select(App).where(
                App.id == app_id,
                App.owner_id == current_user.id
            )
        )
        app = result.scalar_one_or_none()

        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"App '{app_id}' not found or you don't own it"
            )

        if app.status != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"App must be in draft status to publish (current: {app.status})"
            )

        # Update app status
        app.status = "published"
        app.published_at = datetime.utcnow()
        app.publish_count += 1
        app.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(app)

        logger.info(f"[API] App '{app_id}' published successfully")

        return {
            "success": True,
            "app_id": app.id,
            "message": f"App '{app.name}' published successfully",
            "app": {
                "id": app.id,
                "name": app.name,
                "status": app.status,
                "published_at": app.published_at.isoformat() if app.published_at else None
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] App publication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"App publication failed: {str(e)}"
        )


@router.post("/{app_id}/refine")
async def refine_app_endpoint(
    app_id: str,
    request_data: AppRefineRequest,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> StreamingResponse:
    """
    Refine an app using AI based on user's natural language request (streaming).

    Streams real-time updates as Claude modifies the app files.

    Args:
        app_id: App identifier
        request_data: Refinement request with message and conversation history
        current_user: Current user
        db: Database session

    Returns:
        StreamingResponse with SSE events

    Raises:
        HTTPException: If refinement fails
    """
    from app.services.app_refinement import get_app_refinement
    from datetime import datetime
    import json

    logger.info(f"[API] Refining app '{app_id}' for user {current_user.id}")

    # Verify app exists and user owns it
    result = await db.execute(
        select(App).where(
            App.id == app_id,
            App.owner_id == current_user.id
        )
    )
    app = result.scalar_one_or_none()

    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"App '{app_id}' not found or you don't own it"
        )

    if app.status not in ["draft", "published"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot refine app with status '{app.status}'"
        )

    async def event_generator():
        """Generate SSE events as Claude refines the app."""
        try:
            from app.models.app_platform import AppAgentConversation
            from datetime import timezone

            refinement_service = get_app_refinement()

            # ===== CONVERSATION MANAGEMENT =====
            # Get or create conversation
            conversation = None
            if request_data.conversation_id:
                # Load existing conversation
                result = await db.execute(
                    select(AppAgentConversation).where(
                        AppAgentConversation.id == request_data.conversation_id,
                        AppAgentConversation.app_id == app_id,
                        AppAgentConversation.user_id == current_user.id
                    )
                )
                conversation = result.scalar_one_or_none()

            if not conversation:
                # Create new conversation
                # Generate title from first message
                title = request_data.message[:50] + "..." if len(request_data.message) > 50 else request_data.message

                conversation = AppAgentConversation(
                    user_id=current_user.id,
                    app_id=app_id,
                    title=title,
                    conversation_history=[],
                    context={},
                    last_message_at=datetime.now(timezone.utc)
                )
                db.add(conversation)
                await db.flush()  # Get the ID
                await db.commit()
                await db.refresh(conversation)

            # Add user message to conversation
            conversation.conversation_history.append({
                "role": "user",
                "content": request_data.message,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            conversation.last_message_at = datetime.now(timezone.utc)
            await db.commit()

            # Send conversation_id to frontend
            yield f"data: {json.dumps({'type': 'conversation_id', 'conversation_id': conversation.id})}\n\n"

            # Collect assistant response
            assistant_response = ""

            # Stream refinement process
            async for event in refinement_service.refine_app_stream(
                user_id=current_user.id,
                app_id=app_id,
                user_message=request_data.message,
                conversation_history=request_data.conversation_history,
                db=db
            ):
                # Collect assistant text
                if event.get("type") == "token":
                    assistant_response += event.get("content", "")

                yield f"data: {json.dumps(event)}\n\n"

            # Add assistant response to conversation
            if assistant_response:
                conversation.conversation_history.append({
                    "role": "assistant",
                    "content": assistant_response,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                conversation.last_message_at = datetime.now(timezone.utc)

            # Update app timestamp
            app.updated_at = datetime.now(timezone.utc)
            await db.commit()

            logger.info(f"[API] App '{app_id}' refined successfully, conversation {conversation.id} updated")

        except Exception as e:
            logger.error(f"[API] App refinement failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.post("/{app_id}/install")
async def install_app_endpoint(
    app_id: str,
    request_data: AppInstallRequest,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> AppInstallResponse:
    """
    Install an app for the current user.

    Args:
        app_id: App identifier
        request_data: Installation configuration
        current_user: Current user
        db: Database session

    Returns:
        Installation result

    Raises:
        HTTPException: If installation fails
    """
    try:
        logger.info(f"[API] Installing app {app_id} for user {current_user.id}")

        installation = await install_app(
            user_id=current_user.id,
            app_id=app_id,
            db=db,
            config=request_data.config
        )

        return AppInstallResponse(
            success=True,
            app_id=app_id,
            message=f"Successfully installed {app_id}",
            installation_id=installation.id
        )

    except DependencyResolutionError as e:
        logger.error(f"[API] Dependency resolution failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dependency resolution failed: {str(e)}"
        )
    except PermissionDeniedError as e:
        logger.error(f"[API] Permission denied: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: {str(e)}"
        )
    except AppInstallerError as e:
        logger.error(f"[API] Installation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Installation failed: {str(e)}"
        )


@router.delete("/{app_id}/uninstall")
async def uninstall_app_endpoint(
    app_id: str,
    current_user: CurrentUserDep,
    db: DatabaseDep,
    delete_data: bool = False
) -> Dict[str, Any]:
    """
    Uninstall an app for the current user.

    Args:
        app_id: App identifier
        current_user: Current user
        db: Database session
        delete_data: Whether to delete app data

    Returns:
        Uninstallation result

    Raises:
        HTTPException: If uninstallation fails
    """
    try:
        logger.info(f"[API] Uninstalling app {app_id} for user {current_user.id}")

        await uninstall_app(
            user_id=current_user.id,
            app_id=app_id,
            db=db,
            delete_data=delete_data
        )

        return {
            "success": True,
            "message": f"Successfully uninstalled {app_id}"
        }

    except AppInstallerError as e:
        logger.error(f"[API] Uninstallation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Uninstallation failed: {str(e)}"
        )


@router.get("")
async def get_installed_apps(
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> AppListResponse:
    """
    List all apps installed for the current user.

    Args:
        current_user: Current user
        db: Database session

    Returns:
        List of installed apps with metadata
    """
    try:
        installations = await list_installed_apps(current_user.id, db)

        apps = []
        for installation in installations:
            # Get app metadata
            result = await db.execute(
                select(App).where(App.id == installation.app_id)
            )
            app = result.scalar_one_or_none()

            if app:
                apps.append({
                    "id": app.id,
                    "name": app.name,
                    "description": app.description,
                    "version": app.version,
                    "author": app.author,
                    "icon": app.icon,
                    "category": app.category,
                    "tags": app.tags,
                    "installed_at": installation.installed_at.isoformat() if installation.installed_at else None,
                    "status": installation.status
                })

        return AppListResponse(
            apps=apps,
            count=len(apps)
        )

    except Exception as e:
        logger.error(f"[API] Failed to list apps: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list apps: {str(e)}"
        )


@router.get("/drafts")
async def get_draft_apps(
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> AppListResponse:
    """
    List all draft apps for the current user.

    Draft apps are apps the user is still editing/building.

    Args:
        current_user: Current user
        db: Database session

    Returns:
        List of draft apps
    """
    try:
        result = await db.execute(
            select(App).where(
                App.owner_id == current_user.id,
                App.status == "draft"
            ).order_by(App.updated_at.desc())
        )
        apps_records = result.scalars().all()

        apps = [
            {
                "id": app.id,
                "name": app.name,
                "description": app.description,
                "version": app.version,
                "author": app.author,
                "icon": app.icon,
                "category": app.category,
                "status": app.status,
                "is_ai_generated": app.is_ai_generated,
                "created_at": app.created_at.isoformat() if app.created_at else None,
                "updated_at": app.updated_at.isoformat() if app.updated_at else None
            }
            for app in apps_records
        ]

        return AppListResponse(
            apps=apps,
            count=len(apps)
        )

    except Exception as e:
        logger.error(f"[API] Failed to list draft apps: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list draft apps: {str(e)}"
        )


@router.get("/library")
async def get_library_apps(
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> AppListResponse:
    """
    List all published apps in the user's library.

    Library apps are published and ready to be installed to workspace.

    Args:
        current_user: Current user
        db: Database session

    Returns:
        List of library apps with installation status
    """
    try:
        result = await db.execute(
            select(App).where(
                App.owner_id == current_user.id,
                App.status == "published"
            ).order_by(App.published_at.desc())
        )
        apps_records = result.scalars().all()

        # Get installed app IDs
        installed_result = await db.execute(
            select(AppInstallation.app_id).where(
                AppInstallation.user_id == current_user.id,
                AppInstallation.status == "installed"
            )
        )
        installed_app_ids = set(row[0] for row in installed_result.all())

        apps = [
            {
                "id": app.id,
                "name": app.name,
                "description": app.description,
                "version": app.version,
                "author": app.author,
                "icon": app.icon,
                "category": app.category,
                "status": app.status,
                "is_ai_generated": app.is_ai_generated,
                "published_at": app.published_at.isoformat() if app.published_at else None,
                "publish_count": app.publish_count,
                "is_installed": app.id in installed_app_ids
            }
            for app in apps_records
        ]

        return AppListResponse(
            apps=apps,
            count=len(apps)
        )

    except Exception as e:
        logger.error(f"[API] Failed to list library apps: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list library apps: {str(e)}"
        )


@router.get("/available")
async def get_available_apps(db: DatabaseDep) -> AppListResponse:
    """
    List all available apps in the platform.

    Args:
        db: Database session

    Returns:
        List of available apps
    """
    try:
        result = await db.execute(
            select(App).where(App.status == "active")
        )
        apps_records = result.scalars().all()

        apps = [
            {
                "id": app.id,
                "name": app.name,
                "description": app.description,
                "version": app.version,
                "author": app.author,
                "icon": app.icon,
                "category": app.category,
                "tags": app.tags,
                "is_official": app.is_official
            }
            for app in apps_records
        ]

        return AppListResponse(
            apps=apps,
            count=len(apps)
        )

    except Exception as e:
        logger.error(f"[API] Failed to list available apps: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list available apps: {str(e)}"
        )


@router.post("/{app_id}/actions/{action_name}")
async def execute_action(
    app_id: str,
    action_name: str,
    request_data: AppActionRequest,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> AppActionResponse:
    """
    Execute an app action.

    Args:
        app_id: App identifier
        action_name: Action to execute
        request_data: Action parameters
        current_user: Current user
        db: Database session

    Returns:
        Action execution result

    Raises:
        HTTPException: If action fails
    """
    try:
        # Check if app is installed OR if user owns the app (for draft previews)
        installed = await is_app_installed(current_user.id, app_id, db)

        if not installed:
            # Check if user owns this app (draft app)
            result = await db.execute(
                select(App).where(
                    App.id == app_id,
                    App.owner_id == current_user.id
                )
            )
            app = result.scalar_one_or_none()

            if not app:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"App {app_id} is not installed or you don't have access"
                )

        # Create context
        ctx = await create_app_context(
            user_id=current_user.id,
            app_id=app_id,
            db=db,
            skip_installation_check=not installed  # Skip check for draft apps
        )

        # Debug logging
        logger.info(f"[API] Executing {app_id}.{action_name} with params: {request_data.parameters}")

        # Execute action
        result = await execute_app_action(
            ctx,
            action_name,
            request_data.parameters
        )

        return AppActionResponse(
            success=True,
            result=result
        )

    except AppRuntimeError as e:
        logger.error(f"[API] Action execution failed: {e}")
        return AppActionResponse(
            success=False,
            result=None,
            error=str(e)
        )
    except Exception as e:
        logger.error(f"[API] Action execution failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Action execution failed: {str(e)}"
        )


@router.get("/{app_id}/outputs/{output_id}")
async def get_output(
    app_id: str,
    output_id: str,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Dict[str, Any]:
    """
    Get an app's output data.

    Outputs are data/functions that apps expose for composition.

    Args:
        app_id: App identifier
        output_id: Output identifier
        current_user: Current user
        db: Database session

    Returns:
        Output data

    Raises:
        HTTPException: If output retrieval fails
    """
    try:
        # Check if app is installed
        installed = await is_app_installed(current_user.id, app_id, db)
        if not installed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"App {app_id} is not installed"
            )

        # Create context
        ctx = await create_app_context(
            user_id=current_user.id,
            app_id=app_id,
            db=db
        )

        # Get output
        data = await execute_app_output(ctx, output_id)

        return {
            "success": True,
            "output_id": output_id,
            "data": data
        }

    except AppRuntimeError as e:
        logger.error(f"[API] Output retrieval failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Output not found: {str(e)}"
        )
    except Exception as e:
        logger.error(f"[API] Output retrieval failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Output retrieval failed: {str(e)}"
        )


@router.post("/{app_id}/agent/chat")
async def chat_with_agent(
    app_id: str,
    request_data: AgentChatRequest,
    current_user: CurrentUserDep,
    db: DatabaseDep
):
    """
    Chat with an app's embedded Claude agent (streaming).

    Each app has its own Claude agent with custom tools and system prompt.

    Args:
        app_id: App identifier
        request_data: Chat message and context
        current_user: Current user
        db: Database session

    Returns:
        Streaming response with agent messages

    Raises:
        HTTPException: If chat fails
    """
    try:
        # Check if app is installed
        installed = await is_app_installed(current_user.id, app_id, db)
        if not installed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"App {app_id} is not installed"
            )

        # Create context
        ctx = await create_app_context(
            user_id=current_user.id,
            app_id=app_id,
            db=db
        )

        async def event_generator():
            """Generate SSE events from agent stream."""
            try:
                async for event in process_app_agent_message(
                    app_id,
                    ctx,
                    request_data.message,
                    request_data.context,
                    streaming=True
                ):
                    # Format as SSE
                    event_data = {
                        "type": event.event_type,
                        "content": event.content,
                        "metadata": event.metadata
                    }

                    yield f"data: {json.dumps(event_data)}\n\n"

                    # Small delay to prevent overwhelming client
                    await asyncio.sleep(0.01)

            except Exception as e:
                logger.error(f"[API] Agent streaming error: {e}")
                error_event = {
                    "type": "error",
                    "content": str(e),
                    "metadata": {}
                }
                yield f"data: {json.dumps(error_event)}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream"
        )

    except Exception as e:
        logger.error(f"[API] Agent chat failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent chat failed: {str(e)}"
        )


@router.get("/{app_id}/agent/history")
async def get_agent_history(
    app_id: str,
    current_user: CurrentUserDep,
    db: DatabaseDep,
    limit: int = 50
) -> Dict[str, Any]:
    """
    Get conversation history with app's agent.

    Args:
        app_id: App identifier
        current_user: Current user
        db: Database session
        limit: Maximum number of messages

    Returns:
        Conversation history

    Note: For MVP, we return empty history.
    Year 2 will implement proper conversation storage per app.
    """
    try:
        # Check if app is installed
        installed = await is_app_installed(current_user.id, app_id, db)
        if not installed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"App {app_id} is not installed"
            )

        # For MVP, return empty history
        # Year 2: Implement conversation storage in AppAgentConversation model
        return {
            "app_id": app_id,
            "messages": [],
            "count": 0
        }

    except Exception as e:
        logger.error(f"[API] Failed to get agent history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get agent history: {str(e)}"
        )


async def get_user_from_token_or_header(
    db: DatabaseDep,
    token: Optional[str] = None,
    authorization: Optional[str] = Header(None)
) -> User:
    """
    Get user from either query parameter token or Authorization header.
    This is used for preview endpoints where token might come from iframe URL.
    """
    from jose import JWTError, jwt
    from app.utils.security import get_user_by_id

    # Try query parameter first
    if token:
        try:
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=[settings.algorithm]
            )
            user_id_str: str = payload.get("sub")
            if user_id_str:
                user_id = int(user_id_str)
                user = await get_user_by_id(db, user_id)
                if user and user.is_active:
                    return user
        except (JWTError, ValueError) as e:
            logger.warning(f"Token from query param invalid: {e}")

    # Try Authorization header
    if authorization and authorization.startswith("Bearer "):
        try:
            token_from_header = authorization.replace("Bearer ", "")
            payload = jwt.decode(
                token_from_header,
                settings.secret_key,
                algorithms=[settings.algorithm]
            )
            user_id_str: str = payload.get("sub")
            if user_id_str:
                user_id = int(user_id_str)
                user = await get_user_by_id(db, user_id)
                if user and user.is_active:
                    return user
        except (JWTError, ValueError) as e:
            logger.warning(f"Token from header invalid: {e}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated"
    )


@router.get("/{app_id}/preview")
async def serve_app_preview(
    app_id: str,
    db: DatabaseDep,
    token: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """
    Serve the preview.html file for an app.

    This is used to preview user-generated apps in an iframe.

    Args:
        app_id: App identifier
        current_user: Current user
        db: Database session
        token: Optional auth token to inject into preview

    Returns:
        HTML content for preview

    Raises:
        HTTPException: If app not found or not accessible
    """
    try:
        from fastapi.responses import HTMLResponse

        # Authenticate user from token or header
        current_user = await get_user_from_token_or_header(db, token, authorization)

        # Get app
        result = await db.execute(
            select(App).where(
                App.id == app_id,
                App.owner_id == current_user.id
            )
        )
        app = result.scalar_one_or_none()

        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"App '{app_id}' not found or you don't have access"
            )

        if not app.app_directory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"App '{app_id}' does not have a preview (not a user-generated app)"
            )

        # Read files
        from app.services.user_app_manager import get_user_app_manager
        manager = get_user_app_manager()

        try:
            frontend_code = manager.read_frontend(current_user.id, app_id)
            manifest = manager.read_manifest(current_user.id, app_id)
        except FileNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"App files not found for '{app_id}'"
            )

        # Extract token
        auth_token = token or ""

        # Prepare frontend code for inline use
        # Remove imports and exports
        import re
        frontend_code_clean = re.sub(r'import\s+.*?from\s+[\'"].*?[\'"]\s*;?\n?', '', frontend_code)
        frontend_code_clean = re.sub(r'export\s+default\s+', '', frontend_code_clean)

        # Extract function name for rendering
        function_match = re.search(r'function\s+(\w+)\s*\(', frontend_code_clean)
        component_name = function_match.group(1) if function_match else 'App'

        # Ensure component name starts with capital letter for JSX
        if component_name and component_name[0].islower():
            # Create capitalized alias
            component_name_capitalized = component_name[0].upper() + component_name[1:]
            frontend_code_clean += f'\nconst {component_name_capitalized} = {component_name};'
            component_name = component_name_capitalized

        app_name = manifest.get('name', app_id)

        # Generate complete preview HTML with embedded component
        preview_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{app_name} Preview</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root {{
            --background: #fff;
            --foreground: #000;
            --card: #fff;
            --card-foreground: #000;
            --primary: #ffd700;
            --primary-foreground: #000;
            --secondary: #2d2d2d;
            --secondary-foreground: #fff;
            --muted: #e0e0e0;
            --muted-foreground: #666;
            --accent: #ffb380;
            --success: #00e5cc;
            --destructive: #ff4757;
            --info: #a29bfe;
            --warning: #f1f333;
            --border: #000;
        }}
        body {{
            margin: 0;
            font-family: 'Space Grotesk', system-ui, sans-serif;
        }}
    </style>
</head>
<body>
    <div id="root"></div>

    <script>
        // Auth token
        const __KRILIN_AUTH_TOKEN__ = '{auth_token}';

        // Krilin SDK
        window.krilin = {{
            actions: {{
                call: async (name, params) => {{
                    const response = await fetch(`/api/v1/apps/{app_id}/actions/${{name}}`, {{
                        method: 'POST',
                        headers: {{
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${{__KRILIN_AUTH_TOKEN__}}`
                        }},
                        body: JSON.stringify(params)
                    }});
                    return response.json();
                }}
            }},
            storage: {{
                query: async (table, filters) => {{
                    const response = await fetch(`/api/v1/apps/{app_id}/storage/${{table}}/query`, {{
                        method: 'POST',
                        headers: {{
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${{__KRILIN_AUTH_TOKEN__}}`
                        }},
                        body: JSON.stringify(filters || {{}})
                    }});
                    return response.json();
                }},
                insert: async (table, data) => {{
                    const response = await fetch(`/api/v1/apps/{app_id}/storage/${{table}}`, {{
                        method: 'POST',
                        headers: {{
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${{__KRILIN_AUTH_TOKEN__}}`
                        }},
                        body: JSON.stringify(data)
                    }});
                    return response.json();
                }}
            }}
        }};
    </script>

    <!-- RetroUI Components (inline definitions) -->
    <script type="text/babel" data-type="module">
        const {{ useState, useEffect, useRef, useMemo, useCallback }} = React;

        // Simple className merger
        const cn = (...classes) => classes.filter(Boolean).join(' ');

        // Card Component
        const Card = ({{ className, title, children, ...props }}) => (
            <div className={{cn("border-2 border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-[4px_4px_0_0_var(--border)]", className)}} {{...props}}>
                {{title && <div className="border-b-2 border-[var(--border)] p-4 bg-[var(--primary)] text-[var(--primary-foreground)]"><h3 className="font-bold text-lg uppercase">{{title}}</h3></div>}}
                {{children && !title && children}}
                {{children && title && <div className="p-4">{{children}}</div>}}
            </div>
        );
        Card.Header = ({{ className, ...props }}) => <div className={{cn("p-4 border-b-2 border-[var(--border)] bg-[var(--primary)] text-[var(--primary-foreground)]", className)}} {{...props}} />;
        Card.Title = ({{ className, ...props }}) => <h3 className={{cn("font-bold text-lg uppercase", className)}} {{...props}} />;
        Card.Description = ({{ className, ...props }}) => <p className={{cn("text-sm mt-1 opacity-80", className)}} {{...props}} />;
        Card.Content = ({{ className, ...props }}) => <div className={{cn("p-4", className)}} {{...props}} />;
        Card.Footer = ({{ className, ...props }}) => <div className={{cn("p-4 border-t-2 border-[var(--border)] bg-[var(--muted)]", className)}} {{...props}} />;

        // Button Component
        const Button = ({{ children, className, variant = "default", size = "md", ...props }}) => {{
            const variantClasses = {{
                default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
                destructive: "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90",
                outline: "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]",
                secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-90",
                ghost: "bg-transparent hover:bg-[var(--muted)]",
            }};
            const sizeClasses = {{ sm: "px-3 py-1.5 text-sm", md: "px-4 py-2", lg: "px-6 py-3 text-lg" }};
            return (
                <button
                    className={{cn(
                        "border-2 border-[var(--border)] font-medium uppercase shadow-[4px_4px_0_0_var(--border)] hover:shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all",
                        variantClasses[variant],
                        sizeClasses[size],
                        className
                    )}}
                    {{...props}}
                >
                    {{children}}
                </button>
            );
        }};

        // Badge Component
        const Badge = ({{ children, className, variant = "default", ...props }}) => {{
            const variants = {{
                default: "bg-[var(--primary)] text-[var(--primary-foreground)]",
                secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
                outline: "bg-transparent border-[var(--border)]",
                success: "bg-[var(--success)] text-[var(--success-foreground)]",
                destructive: "bg-[var(--destructive)] text-[var(--destructive-foreground)]",
            }};
            return (
                <span className={{cn("inline-flex items-center px-2 py-1 text-xs font-bold uppercase border-2 border-[var(--border)]", variants[variant], className)}} {{...props}}>
                    {{children}}
                </span>
            );
        }};

        // Input Component
        const Input = ({{ className, ...props }}) => (
            <input
                className={{cn("border-2 border-[var(--border)] px-3 py-2 bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]", className)}}
                {{...props}}
            />
        );

        // Textarea Component
        const Textarea = ({{ className, ...props }}) => (
            <textarea
                className={{cn("border-2 border-[var(--border)] px-3 py-2 bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]", className)}}
                {{...props}}
            />
        );

        {frontend_code_clean}

        // Wait for DOM and render
        if (document.readyState === 'loading') {{
            document.addEventListener('DOMContentLoaded', renderApp);
        }} else {{
            renderApp();
        }}

        function renderApp() {{
            try {{
                console.log('Rendering component: {component_name}');
                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(<{component_name} />);
                console.log('Component rendered successfully');
            }} catch (error) {{
                console.error('Error rendering component:', error);
                document.getElementById('root').innerHTML = '<div style="padding: 20px; color: red;">Error: ' + error.message + '</div>';
            }}
        }}
    </script>
</body>
</html>"""

        return HTMLResponse(content=preview_html)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Failed to serve preview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to serve preview: {str(e)}"
        )


class FileUpdateRequest(BaseModel):
    """Request to update an app file."""
    content: str


@router.put("/{app_id}/files/{file_name}")
async def update_app_file(
    app_id: str,
    file_name: str,
    request_data: FileUpdateRequest,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Dict[str, Any]:
    """
    Update an app file (frontend.tsx, backend.py, or manifest.json).

    Used by the code editor to save file changes.

    Args:
        app_id: App identifier
        file_name: Name of file to update
        content: New file content
        current_user: Current user
        db: Database session

    Returns:
        Update result

    Raises:
        HTTPException: If update fails
    """
    try:
        # Validate file_name for security
        allowed_files = ["frontend.tsx", "backend.py", "manifest.json"]
        if file_name not in allowed_files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file_name}' cannot be updated (allowed: {allowed_files})"
            )

        # Get app and verify ownership
        result = await db.execute(
            select(App).where(
                App.id == app_id,
                App.owner_id == current_user.id
            )
        )
        app = result.scalar_one_or_none()

        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"App '{app_id}' not found or you don't have access"
            )

        if not app.app_directory:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"App '{app_id}' does not support file editing (not a user-generated app)"
            )

        # Update file using UserAppManager
        from app.services.user_app_manager import get_user_app_manager
        from datetime import datetime, timezone

        manager = get_user_app_manager()

        try:
            manager.update_file(current_user.id, app_id, file_name, request_data.content)

            # If manifest was updated, parse and update app record
            if file_name == "manifest.json":
                manifest = json.loads(request_data.content)
                app.manifest = manifest
                # Update app metadata from manifest
                app.name = manifest.get("name", app.name)
                app.description = manifest.get("description", app.description)
                app.version = manifest.get("version", app.version)

            # Update app's updated_at timestamp
            app.updated_at = datetime.now(timezone.utc)
            await db.commit()

            logger.info(f"[API] Updated {file_name} for app '{app_id}'")

            return {
                "success": True,
                "filename": file_name,
                "message": f"Successfully updated {file_name}"
            }

        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid JSON in manifest.json: {str(e)}"
            )
        except Exception as e:
            logger.error(f"[API] Failed to update file: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update file: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] File update failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File update failed: {str(e)}"
        )


@router.get("/{app_id}/files/{file_name}")
async def serve_app_file(
    app_id: str,
    file_name: str,
    db: DatabaseDep,
    token: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """
    Serve app files (e.g., frontend.tsx, backend.py, manifest.json).

    Used by the code editor and preview system.

    Args:
        app_id: App identifier
        file_name: Name of file to serve
        db: Database session
        token: Optional auth token from query param
        authorization: Optional auth token from header

    Returns:
        File content

    Raises:
        HTTPException: If file not found or not accessible
    """
    try:
        from fastapi.responses import PlainTextResponse, JSONResponse

        # Authenticate user from token or header
        current_user = await get_user_from_token_or_header(db, token, authorization)

        # Validate file_name for security
        allowed_files = ["frontend.tsx", "backend.py", "manifest.json", "preview.html", "app.bundle.js"]
        if file_name not in allowed_files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file_name}' not allowed"
            )

        # Get app
        result = await db.execute(
            select(App).where(
                App.id == app_id,
                App.owner_id == current_user.id
            )
        )
        app = result.scalar_one_or_none()

        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"App '{app_id}' not found or you don't have access"
            )

        if not app.app_directory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"App '{app_id}' does not have files (not a user-generated app)"
            )

        # Read file
        from app.services.user_app_manager import get_user_app_manager
        manager = get_user_app_manager()

        try:
            if file_name == "manifest.json":
                manifest = manager.read_manifest(current_user.id, app_id)
                return JSONResponse(content=manifest)
            elif file_name == "frontend.tsx":
                content = manager.read_frontend(current_user.id, app_id)
                return PlainTextResponse(content=content, media_type="text/plain")
            elif file_name == "backend.py":
                content = manager.read_backend(current_user.id, app_id)
                return PlainTextResponse(content=content, media_type="text/plain")
            elif file_name == "preview.html":
                content = manager.read_preview_html(current_user.id, app_id)
                return PlainTextResponse(content=content, media_type="text/html")
            elif file_name == "app.bundle.js":
                content = manager.read_bundle(current_user.id, app_id)
                if content:
                    return PlainTextResponse(content=content, media_type="application/javascript")
                else:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Bundle file not found"
                    )
        except FileNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File '{file_name}' not found for app '{app_id}'"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Failed to serve file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to serve file: {str(e)}"
        )


def generate_stream_token(user_id: int, info_hash: str, file_index: int) -> str:
    """Generate a signed token for streaming access."""
    expires = int(time.time()) + 3600  # 1 hour expiry
    message = f"{user_id}:{info_hash}:{file_index}:{expires}"
    signature = hmac.new(
        settings.secret_key.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    return f"{expires}.{signature}"


def verify_stream_token(token: str, user_id: int, info_hash: str, file_index: int) -> bool:
    """Verify a streaming access token."""
    try:
        expires_str, signature = token.split(".")
        expires = int(expires_str)

        # Check if expired
        if time.time() > expires:
            return False

        # Verify signature
        message = f"{user_id}:{info_hash}:{file_index}:{expires}"
        expected_signature = hmac.new(
            settings.secret_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(signature, expected_signature)
    except:
        return False


@router.api_route("/torrent-streamer/fast-stream/{user_id}/{info_hash}/{file_index}", methods=["GET", "HEAD"])
async def fast_stream_torrent_file(
    user_id: int,
    info_hash: str,
    file_index: int,
    request: Request,
    token: Optional[str] = None
):
    """
    Ultra-fast streaming with ZERO startup delay.

    Starts streaming immediately without any buffering checks.
    Works even if pieces aren't downloaded yet.
    """
    try:
        # Verify token
        if not token or not verify_stream_token(token, user_id, info_hash, file_index):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid or expired token"
            )

        from apps.torrent_streamer.backend import _active_torrents

        if info_hash not in _active_torrents:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Torrent not found"
            )

        handle = _active_torrents[info_hash]

        # Create ultra-fast streamer
        streamer = UltraFastStreamer(handle, file_index, user_id, info_hash)
        file_size = streamer.file_size

        # Determine content type
        suffix = Path(streamer.file_entry.path).suffix.lower()
        content_types = {
            '.mp4': 'video/mp4',
            '.mkv': 'video/x-matroska',
            '.avi': 'video/x-msvideo',
            '.webm': 'video/webm',
            '.mov': 'video/quicktime',
        }
        content_type = content_types.get(suffix, 'video/mp4')

        # Handle HEAD request - ensure critical pieces are ready
        if request.method == "HEAD":
            # For MP4/MKV files, we MUST have header and tail pieces
            first_piece = streamer.first_piece
            last_piece = streamer.last_piece

            # Check first few pieces (header) and last few pieces (moov atom)
            header_pieces = min(5, last_piece - first_piece + 1)  # First 5 pieces (~10MB typically)
            tail_pieces = min(5, last_piece - first_piece + 1)   # Last 5 pieces

            missing_critical = []

            # Check header pieces
            for p in range(first_piece, min(first_piece + header_pieces, last_piece + 1)):
                if not handle.have_piece(p):
                    missing_critical.append(p)

            # Check tail pieces (for MP4 moov atom)
            if file_size > 20 * 1024 * 1024:  # Only for files > 20MB
                for p in range(max(first_piece, last_piece - tail_pieces + 1), last_piece + 1):
                    if not handle.have_piece(p):
                        missing_critical.append(p)

            if missing_critical:
                logger.info(f"[ULTRA] HEAD: Missing critical pieces: {missing_critical}")

                # Wait briefly for critical pieces
                wait_start = time.time()
                while time.time() - wait_start < 10.0 and missing_critical:  # Wait up to 10 seconds
                    # Re-check missing pieces
                    still_missing = []
                    for p in missing_critical:
                        if not handle.have_piece(p):
                            still_missing.append(p)
                            # Re-prioritize
                            handle.piece_priority(p, 7)
                            try:
                                handle.set_piece_deadline(p, 0, 1)
                            except:
                                pass

                    missing_critical = still_missing
                    if missing_critical:
                        await asyncio.sleep(0.2)

                if missing_critical:
                    logger.warning(f"[ULTRA] Critical pieces still missing after wait: {missing_critical}")
                    # Return 202 to make frontend wait
                    raise HTTPException(
                        status_code=status.HTTP_202_ACCEPTED,
                        detail=f"Buffering critical pieces: {missing_critical}"
                    )

            # Critical pieces ready
            headers = {
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
                "Content-Type": content_type,
                "Cache-Control": "no-cache",
            }
            return Response(headers=headers, status_code=200)

        # Handle range requests
        range_header = request.headers.get("range")

        if range_header:
            # Parse range
            range_match = range_header.replace("bytes=", "").split("-")
            start = int(range_match[0]) if range_match[0] else 0
            end = int(range_match[1]) if len(range_match) > 1 and range_match[1] else file_size - 1
            end = min(end, file_size - 1)

            logger.info(f"[ULTRA] Range: {start}-{end} ({(end-start+1)/1024/1024:.1f}MB)")

            # Start streaming immediately
            headers = {
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(end - start + 1),
                "Content-Type": content_type,
                "Cache-Control": "no-cache",
            }

            return StreamingResponse(
                streamer.stream_range(start, end),
                status_code=status.HTTP_206_PARTIAL_CONTENT,
                headers=headers
            )

        else:
            # Full file stream
            headers = {
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
                "Content-Type": content_type,
                "Cache-Control": "no-cache",
            }

            return StreamingResponse(
                streamer.stream_range(0, file_size - 1),
                status_code=200,
                headers=headers
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[FAST_STREAM] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.api_route("/torrent-streamer/remux-stream/{user_id}/{info_hash}/{file_index}", methods=["GET", "HEAD"])
async def remux_stream_torrent_file(
    user_id: int,
    info_hash: str,
    file_index: int,
    request: Request,
    token: Optional[str] = None
):
    """
    Stream MKV/AVI files remuxed to MP4 format for browser playback.

    Uses FFmpeg to remux (not transcode) - just changes container format.
    This is fast and uses minimal CPU.
    """
    try:
        # Verify token
        if not token or not verify_stream_token(token, user_id, info_hash, file_index):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid or expired token"
            )

        from apps.torrent_streamer.backend import _active_torrents

        if info_hash not in _active_torrents:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Torrent not found"
            )

        handle = _active_torrents[info_hash]

        # Create remux streamer
        remuxer = RemuxStreamer(handle, file_index, user_id, info_hash)

        # Check file extension to ensure it's a format that needs remuxing
        file_name = remuxer.file_entry.path
        ext = Path(file_name).suffix.lower()

        if ext not in ['.mkv', '.avi', '.flv', '.wmv']:
            # File doesn't need remuxing - redirect to regular stream
            if request.method == "HEAD":
                # For HEAD requests, don't redirect, just return appropriate headers
                headers = {
                    "Content-Type": "video/mp4",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(remuxer.file_size),
                    "Cache-Control": "no-cache",
                }
                return Response(headers=headers, status_code=200)
            else:
                return RedirectResponse(
                    url=f"/api/v1/apps/torrent-streamer/fast-stream/{user_id}/{info_hash}/{file_index}?token={token}",
                    status_code=302
                )

        # Handle HEAD requests for remuxable files
        if request.method == "HEAD":
            # For MKV remuxing, first check if all pieces are available in the swarm
            all_available_in_swarm, percentage_downloaded, percentage_available = remuxer.check_piece_availability_in_swarm()

            if not all_available_in_swarm:
                # Not all pieces available in swarm - file might be incomplete
                logger.warning(f"[REMUX] Not all pieces available in swarm: {percentage_available:.1f}% available, {percentage_downloaded:.1f}% downloaded")

                # Return a specific error indicating the file might be incomplete
                detail_msg = f"File may be incomplete: {percentage_available:.0f}% available from peers. "
                if percentage_available < 100:
                    detail_msg += "Some pieces are missing from all peers. This file cannot be played reliably."

                raise HTTPException(
                    status_code=status.HTTP_412_PRECONDITION_FAILED,
                    detail=detail_msg
                )

            # If file is 100% downloaded, skip buffer check
            if percentage_downloaded >= 100.0:
                logger.info(f"[REMUX] File is 100% downloaded, ready to stream immediately")
            else:
                # Calculate adaptive buffer based on download speed and file size
                min_required_mb = remuxer.calculate_adaptive_buffer_mb()

                # All pieces are available in swarm, now check if we have enough downloaded
                contiguous_mb = remuxer.get_contiguous_bytes_available() / (1024 * 1024)

                if contiguous_mb < min_required_mb:
                    # Not enough contiguous data downloaded yet, but it's available
                    logger.info(f"[REMUX] HEAD request - only {contiguous_mb:.1f}MB contiguous downloaded, need {min_required_mb}MB")

                    # Wait and check periodically
                    for i in range(30):  # Wait up to 30 seconds
                        await asyncio.sleep(1)
                        contiguous_mb = remuxer.get_contiguous_bytes_available() / (1024 * 1024)
                        if contiguous_mb >= min_required_mb:
                            logger.info(f"[REMUX] HEAD request buffer ready after {i+1}s - {contiguous_mb:.1f}MB contiguous")
                            break

                        if i % 5 == 4:
                            logger.info(f"[REMUX] Still waiting... {contiguous_mb:.1f}MB/{min_required_mb}MB")

                    # Final check
                    contiguous_mb = remuxer.get_contiguous_bytes_available() / (1024 * 1024)
                    if contiguous_mb < min_required_mb:
                        logger.info(f"[REMUX] Still buffering: {contiguous_mb:.1f}MB < {min_required_mb}MB")
                        raise HTTPException(
                            status_code=status.HTTP_202_ACCEPTED,
                            detail=f"Buffering... {int(contiguous_mb)}MB ready, need {min_required_mb}MB"
                        )

            # Return success headers for HEAD
            # We need to provide an estimated Content-Length for the browser to work properly
            estimated_size = remuxer.get_remuxed_size_estimate()
            headers = {
                "Content-Type": "video/mp4",
                "Accept-Ranges": "none",  # Remuxing doesn't support range requests
                "Cache-Control": "no-cache",
                "Content-Length": str(estimated_size),  # Estimated size
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
            logger.info(f"[REMUX] HEAD request returning estimated size: {estimated_size}")
            return Response(headers=headers, status_code=200)

        # Handle GET request - stream the remuxed content
        logger.info(f"[REMUX] Starting remux stream for {file_name}")

        # First check piece availability in swarm
        all_available_in_swarm, percentage_downloaded, percentage_available = remuxer.check_piece_availability_in_swarm()

        if not all_available_in_swarm:
            logger.error(f"[REMUX] GET request but not all pieces available: {percentage_available:.1f}% available")
            raise HTTPException(
                status_code=status.HTTP_412_PRECONDITION_FAILED,
                detail=f"File incomplete: {percentage_available:.0f}% available. Some pieces are missing from all peers."
            )

        # If file is 100% downloaded, skip buffer check
        if percentage_downloaded >= 100.0:
            logger.info(f"[REMUX] File is 100% downloaded, streaming entire file")
        else:
            # Calculate adaptive buffer and check we have enough contiguous data
            min_required_mb = remuxer.calculate_adaptive_buffer_mb()
            contiguous_mb = remuxer.get_contiguous_bytes_available() / (1024 * 1024)

            if contiguous_mb < min_required_mb:
                logger.error(f"[REMUX] GET request but only {contiguous_mb:.1f}MB contiguous, aborting")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Not enough contiguous data for streaming ({int(contiguous_mb)}MB < {min_required_mb}MB)"
                )

            logger.info(f"[REMUX] Streaming with {contiguous_mb:.1f}MB contiguous data available")

        headers = {
            "Content-Type": "video/mp4",
            "Accept-Ranges": "none",  # Remuxing doesn't support range requests yet
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            # Don't set Content-Length as we're streaming
        }

        return StreamingResponse(
            remuxer.stream_remuxed(),
            media_type="video/mp4",
            headers=headers
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[REMUX] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.api_route("/torrent-streamer/stream/{user_id}/{info_hash}/{file_index}", methods=["GET", "HEAD"])
async def stream_torrent_file(
    user_id: int,
    info_hash: str,
    file_index: int,
    request: Request,
    token: Optional[str] = None
):
    """
    Stream a torrent file downloaded via backend proxy.

    Supports HTTP range requests for video seeking.
    Supports HEAD requests for video player preflight checks.

    Args:
        user_id: User ID who owns the torrent
        info_hash: Torrent info hash
        file_index: File index in torrent
        request: HTTP request (for range header and method)
        token: Signed token for authentication (query parameter)

    Returns:
        Streaming file response with range support

    Raises:
        HTTPException: If file not found or unauthorized
    """
    try:
        # Verify token
        if not token or not verify_stream_token(token, user_id, info_hash, file_index):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid or expired token"
            )

        # Get torrent file path
        from apps.torrent_streamer.backend import _active_torrents

        if info_hash not in _active_torrents:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Torrent not found in active downloads"
            )

        handle = _active_torrents[info_hash]
        torrent_info = handle.torrent_file()

        if file_index >= torrent_info.num_files():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file index"
            )

        file_entry = torrent_info.files().at(file_index)
        download_dir = Path(f"./backend/uploads/torrents/{user_id}/{info_hash}")
        file_path = download_dir / file_entry.path

        # Get file offset and piece info
        file_offset = file_entry.offset
        piece_length = torrent_info.piece_length()
        first_piece = file_offset // piece_length

        # Log overall progress
        file_progress = handle.file_progress()
        downloaded_bytes = file_progress[file_index] if file_index < len(file_progress) else 0
        total_bytes = file_entry.size
        progress_pct = (downloaded_bytes / total_bytes * 100) if total_bytes > 0 else 0

        logger.info(f"[STREAM] ==== Stream Request ====")
        logger.info(f"[STREAM] File: {file_entry.path}")
        logger.info(f"[STREAM] Method: {request.method}")
        logger.info(f"[STREAM] Progress: {downloaded_bytes}/{total_bytes} ({progress_pct:.1f}%)")
        logger.info(f"[STREAM] Piece length: {piece_length}, First piece: {first_piece}")

        # Ensure first 1MB (or entire file if smaller) is available for demuxer
        header_bytes = min(file_entry.size, 1024 * 1024)
        header_last_abs = file_offset + header_bytes - 1 if header_bytes > 0 else file_offset
        header_end_piece = header_last_abs // piece_length

        # Enable sequential download if not already enabled
        if not handle.status().sequential_download:
            logger.info(f"[STREAM] Enabling sequential download for existing torrent")
            handle.set_sequential_download(True)

        incomplete_pieces = []
        for piece_idx in range(first_piece, min(header_end_piece + 1, torrent_info.num_pieces())):
            has_piece = handle.have_piece(piece_idx)
            if not has_piece:
                incomplete_pieces.append(piece_idx)
                handle.piece_priority(piece_idx, 7)
                try:
                    handle.set_piece_deadline(piece_idx, 0, 0)
                except Exception as e:
                    logger.warning(f"[STREAM] Could not set deadline for piece {piece_idx}: {e}")

        total_header_pieces = max(0, min(header_end_piece + 1, torrent_info.num_pieces()) - first_piece)
        logger.info(f"[STREAM] Header check: {total_header_pieces - len(incomplete_pieces)}/{total_header_pieces} pieces ready for first 1MB")

        if incomplete_pieces:
            logger.warning(f"[STREAM] Header not ready. Missing pieces: {incomplete_pieces} (set to max priority)")
            if request.method == "HEAD":
                deadline = time.time() + 60
                while time.time() < deadline:
                    ready = True
                    for piece_idx in range(first_piece, min(header_end_piece + 1, torrent_info.num_pieces())):
                        if not handle.have_piece(piece_idx):
                            ready = False
                            break
                    if ready:
                        logger.info("[STREAM] Header became ready during HEAD wait (1MB window)")
                        break
                    await asyncio.sleep(0.2)
                else:
                    raise HTTPException(
                        status_code=status.HTTP_202_ACCEPTED,
                        detail=f"Buffering video header (first 1MB). Remaining pieces: {len(incomplete_pieces)}"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_202_ACCEPTED,
                    detail=f"Buffering video header (first 1MB). Remaining pieces: {len(incomplete_pieces)}"
                )

        # Now check if file exists on disk
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not on disk yet ({progress_pct:.1f}% downloaded). libtorrent may not have written it yet."
            )

        # Get file size from torrent metadata
        file_size = file_entry.size
        actual_file_size_on_disk = file_path.stat().st_size

        logger.info(f"[STREAM] File size - Expected: {file_size}, On disk: {actual_file_size_on_disk}")

        # Determine content type from file extension
        content_type = "application/octet-stream"
        suffix = file_path.suffix.lower()

        content_types = {
            '.mp4': 'video/mp4',
            '.mkv': 'video/x-matroska',
            '.avi': 'video/x-msvideo',
            '.webm': 'video/webm',
            '.mov': 'video/quicktime',
            '.flv': 'video/x-flv',
            '.wmv': 'video/x-ms-wmv',
            '.m4v': 'video/x-m4v',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
        }

        if suffix in content_types:
            content_type = content_types[suffix]

        # Helper: compute highest contiguous available byte offset within this file
        def get_available_file_end() -> int:
            """Return highest contiguous available byte index within the file (relative to file start).

            We walk pieces starting from the file's first piece until the first missing piece.
            If the very first piece is missing, returns -1.
            """
            last_available_piece = first_piece - 1
            for piece_idx in range(first_piece, torrent_info.num_pieces()):
                if handle.have_piece(piece_idx):
                    last_available_piece = piece_idx
                else:
                    break
            if last_available_piece < first_piece:
                return -1
            available_absolute_end = min(
                file_offset + file_entry.size - 1,
                (last_available_piece + 1) * piece_length - 1
            )
            return max(-1, available_absolute_end - file_offset)

        # Helper: compute highest contiguous available byte end starting from a relative start
        def get_available_end_from_relative_start(relative_start: int) -> int:
            absolute_start = file_offset + max(0, relative_start)
            start_piece = absolute_start // piece_length
            if start_piece >= torrent_info.num_pieces() or not handle.have_piece(start_piece):
                return -1
            last_available_piece = start_piece
            for piece_idx in range(start_piece + 1, torrent_info.num_pieces()):
                if handle.have_piece(piece_idx):
                    last_available_piece = piece_idx
                else:
                    break
            available_absolute_end = min(file_offset + file_entry.size - 1, (last_available_piece + 1) * piece_length - 1)
            return max(-1, available_absolute_end - file_offset)

        # Pre-read range header (used for both HEAD/GET)
        range_header = request.headers.get("range")

        # Handle HEAD requests - return headers only, no body
        if request.method == "HEAD":
            if range_header:
                # Parse and validate requested range (supports open-ended and suffix ranges)
                range_match = range_header.replace("bytes=", "").split("-")
                start_str = range_match[0] if len(range_match) > 0 else ""
                end_str = range_match[1] if len(range_match) > 1 else ""

                if start_str:
                    start = int(start_str)
                else:
                    # Suffix byte range 'bytes=-N': last N bytes
                    suffix_len = int(end_str) if end_str else 0
                    start = max(0, file_size - suffix_len)

                # Determine end; for open-ended range, cap to available contiguous bytes from start
                available_end = get_available_end_from_relative_start(start)
                if end_str:
                    end = int(end_str)
                else:
                    end = available_end if available_end >= 0 else start - 1

                if start >= file_size:
                    raise HTTPException(
                        status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
                        detail="Range not satisfiable"
                    )

                end = min(end, file_size - 1)
                if end < start:
                    # Nothing available yet
                    raise HTTPException(
                        status_code=status.HTTP_202_ACCEPTED,
                        detail="Buffering"
                    )

                # For explicit end ranges, briefly wait for missing pieces; for open-ended, we already capped
                start_piece = (file_offset + start) // piece_length
                end_piece = (file_offset + end) // piece_length

                if end_str:
                    missing_pieces_in_range = []
                    for piece_idx in range(start_piece, min(end_piece + 1, torrent_info.num_pieces())):
                        if not handle.have_piece(piece_idx):
                            missing_pieces_in_range.append(piece_idx)
                            handle.piece_priority(piece_idx, 7)
                            try:
                                handle.set_piece_deadline(piece_idx, 0, 0)
                            except Exception as e:
                                logger.warning("[STREAM] Could not set deadline for piece %s: %s", piece_idx, e)

                    if missing_pieces_in_range:
                        logger.info("[STREAM] HEAD explicit range requested but pieces missing; waiting briefly")
                        deadline = time.time() + 10
                        while time.time() < deadline:
                            if all(handle.have_piece(p) for p in range(start_piece, min(end_piece + 1, torrent_info.num_pieces()))):
                                break
                            await asyncio.sleep(0.1)

                        # Re-check; if still missing, cap end to available from requested start
                        if any(not handle.have_piece(p) for p in range(start_piece, min(end_piece + 1, torrent_info.num_pieces()))):
                            available_end = get_available_end_from_relative_start(start)
                            if available_end >= start:
                                end = min(end, available_end)
                                end_piece = (file_offset + end) // piece_length
                            else:
                                raise HTTPException(
                                    status_code=status.HTTP_202_ACCEPTED,
                                    detail="Buffering"
                                )

                chunk_size = end - start + 1
                headers = {
                    "Content-Range": f"bytes {start}-{end}/{file_size}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(chunk_size),
                    "Content-Type": content_type,
                    "Content-Encoding": "identity",
                    "Cache-Control": "no-store",
                    "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length, Content-Type",
                }
                logger.info("[STREAM] HEAD range request ready: bytes %s-%s", start, end)
                return Response(headers=headers, status_code=status.HTTP_206_PARTIAL_CONTENT)

            # No range header: basic readiness HEAD
            logger.info(f"[STREAM] HEAD request successful - returning headers only")
            headers = {
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
                "Content-Type": content_type,
                "Content-Encoding": "identity",
                "Cache-Control": "no-store",
                "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length, Content-Type",
            }
            return Response(headers=headers, status_code=200)

        logger.info(f"[STREAM] GET request - preparing to stream file")

        # Handle range requests for video seeking
        if range_header:
            # Parse range header (supports open-ended and suffix ranges)
            range_match = range_header.replace("bytes=", "").split("-")
            start_str = range_match[0] if len(range_match) > 0 else ""
            end_str = range_match[1] if len(range_match) > 1 else ""
            is_suffix = (not start_str) and bool(end_str)

            if start_str:
                start = int(start_str)
            else:
                # Suffix byte range: last N bytes
                suffix_len = int(end_str) if end_str else 0
                start = max(0, file_size - suffix_len)

            available_end = get_available_end_from_relative_start(start)
            if is_suffix:
                end = file_size - 1
            elif end_str:
                end = int(end_str)
            else:
                end = available_end if available_end >= 0 else start - 1

            logger.info(f"[STREAM] Range request: bytes {start}-{end} ({(end - start + 1) / 1024 / 1024:.2f} MB)")

            # Verify the requested range pieces are downloaded
            start_piece = (file_offset + start) // piece_length
            end_piece = (file_offset + end) // piece_length

            logger.info(f"[STREAM] Range spans pieces {start_piece} to {end_piece}")

            missing_pieces_in_range = []
            for piece_idx in range(start_piece, min(end_piece + 1, torrent_info.num_pieces())):
                if not handle.have_piece(piece_idx):
                    missing_pieces_in_range.append(piece_idx)
                    # Prioritize this piece and set an immediate deadline
                    handle.piece_priority(piece_idx, 7)
                    try:
                        handle.set_piece_deadline(piece_idx, 0, 0)
                    except Exception as e:
                        logger.warning(f"[STREAM] Could not set deadline for piece {piece_idx}: {e}")

            if missing_pieces_in_range:
                if end_str and not is_suffix:
                    logger.warning("[STREAM] Range includes %d undownloaded pieces; waiting up to 30s", len(missing_pieces_in_range))
                    # Wait up to 30s for explicit range
                    deadline = time.time() + 30
                    while time.time() < deadline:
                        if all(handle.have_piece(p) for p in range(start_piece, min(end_piece + 1, torrent_info.num_pieces()))):
                            break
                        await asyncio.sleep(0.1)

                    missing_pieces_in_range = [
                        p for p in range(start_piece, min(end_piece + 1, torrent_info.num_pieces()))
                        if not handle.have_piece(p)
                    ]
                    if missing_pieces_in_range:
                        raise HTTPException(
                            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Requested range not yet available; please retry"
                        )
                else:
                    # Open-ended range: cap to what's available now from requested start, otherwise buffer
                    new_available_end = get_available_end_from_relative_start(start)
                    if new_available_end >= start:
                        end = min(end, new_available_end)
                        end_piece = (file_offset + end) // piece_length
                        missing_pieces_in_range = [
                            p for p in range(start_piece, min(end_piece + 1, torrent_info.num_pieces()))
                            if not handle.have_piece(p)
                        ]
                    if missing_pieces_in_range:
                        raise HTTPException(
                            status_code=status.HTTP_202_ACCEPTED,
                            detail="Buffering"
                        )

            logger.info(f"[STREAM] All pieces in range are downloaded - streaming...")

            # Schedule a prefetch window ahead of the requested range to sustain throughput
            try:
                prefetch_pieces = 64
                prefetch_start_piece = max(0, start_piece)
                prefetch_end_piece = min(torrent_info.num_pieces() - 1, prefetch_start_piece + prefetch_pieces)
                for p in range(prefetch_start_piece, prefetch_end_piece + 1):
                    handle.piece_priority(p, 6)
                    try:
                        handle.set_piece_deadline(p, 0, 0)
                    except Exception:
                        pass
            except Exception as e:
                logger.warning("[STREAM] Prefetch scheduling failed: %s", e)

            # Intelligently prioritize pieces for this seek position
            # This downloads the pieces needed for the current playback position
            if start > 0:  # Only if actually seeking (not initial request)
                logger.info(f"[STREAM] User seeked to byte {start}, prioritizing pieces...")
                try:
                    # Calculate piece priorities based on seek position
                    file_offset = file_entry.offset
                    piece_length = torrent_info.piece_length()
                    absolute_offset = file_offset + start
                    piece_index = absolute_offset // piece_length

                    # Prioritize 20 pieces ahead (buffer ~20-40MB)
                    buffer_pieces = 20
                    for i in range(max(0, piece_index - 2), min(torrent_info.num_pieces(), piece_index + buffer_pieces)):
                        handle.piece_priority(i, 7)

                    # Immediate priority for the exact piece
                    if piece_index < torrent_info.num_pieces():
                        handle.piece_priority(piece_index, 7)

                    logger.info(f"[STREAM] Prioritized pieces {piece_index} to {piece_index + buffer_pieces}")
                except Exception as e:
                    logger.warning(f"[STREAM] Failed to prioritize pieces: {e}")

            # Ensure valid range
            if start >= file_size:
                raise HTTPException(
                    status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
                    detail="Range not satisfiable"
                )

            end = min(end, file_size - 1)
            chunk_size = end - start + 1

            async def file_chunk_generator():
                """Stream file chunk for range request with piece-aware waiting."""
                try:
                    pos = start
                    with open(file_path, "rb") as f:
                        while pos <= end:
                            absolute_pos = file_offset + pos
                            piece_idx = absolute_pos // piece_length

                            # Continuously prefetch a window ahead of the current piece
                            try:
                                ahead = 32
                                for p in range(piece_idx, min(torrent_info.num_pieces(), piece_idx + ahead)):
                                    handle.piece_priority(p, 6)
                                    try:
                                        handle.set_piece_deadline(p, 0, 0)
                                    except Exception:
                                        pass
                            except Exception:
                                pass

                            # If piece not ready, prioritize and wait briefly until available
                            if not handle.have_piece(piece_idx):
                                handle.piece_priority(piece_idx, 7)
                                try:
                                    handle.set_piece_deadline(piece_idx, 0, 0)
                                except Exception as e:
                                    logger.warning("[STREAM] Could not set deadline for piece %s: %s", piece_idx, e)

                                piece_wait_deadline = time.time() + 30
                                while time.time() < piece_wait_deadline and not handle.have_piece(piece_idx):
                                    await asyncio.sleep(0.05)
                                if not handle.have_piece(piece_idx):
                                    # Still not available; end stream gracefully
                                    break

                            # Compute end of current piece relative to file
                            piece_end_absolute = min(
                                (piece_idx + 1) * piece_length - 1,
                                file_offset + file_size - 1
                            )
                            piece_end_relative = piece_end_absolute - file_offset

                            read_until = min(end, piece_end_relative)
                            to_read = read_until - pos + 1

                            f.seek(pos)
                            while to_read > 0:
                                read_size = min(8192, to_read)
                                data = f.read(read_size)
                                if not data:
                                    to_read = 0
                                    break
                                to_read -= len(data)
                                pos += len(data)
                                yield data
                except Exception as e:
                    logger.error("[STREAM] Error reading file: %s", e)
                    raise

            headers = {
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(chunk_size),
                "Content-Type": content_type,
                "Content-Encoding": "identity",
                "Cache-Control": "no-store",
                "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length, Content-Type",
            }

            return StreamingResponse(
                file_chunk_generator(),
                status_code=status.HTTP_206_PARTIAL_CONTENT,
                headers=headers
            )

        else:
            # No range: progressive streaming with piece-aware backpressure to avoid sparse zeros
            async def file_generator():
                try:
                    pos = 0
                    with open(file_path, "rb") as f:
                        while pos < file_size:
                            absolute_pos = file_offset + pos
                            piece_idx = absolute_pos // piece_length
                            if not handle.have_piece(piece_idx):
                                # Prioritize and wait for the needed piece
                                handle.piece_priority(piece_idx, 7)
                                try:
                                    handle.set_piece_deadline(piece_idx, 0, 0)
                                except Exception:
                                    pass
                                wait_deadline = time.time() + 30
                                while time.time() < wait_deadline and not handle.have_piece(piece_idx):
                                    await asyncio.sleep(0.05)
                                if not handle.have_piece(piece_idx):
                                    # Still not available; yield nothing and retry loop
                                    continue

                            # Read up to the end of current piece or EOF
                            piece_end_absolute = min((piece_idx + 1) * piece_length - 1, file_offset + file_size - 1)
                            piece_end_relative = piece_end_absolute - file_offset
                            to_read = min(8192, piece_end_relative - pos + 1)
                            if to_read <= 0:
                                pos += 1
                                continue
                            f.seek(pos)
                            data = f.read(to_read)
                            if not data:
                                await asyncio.sleep(0.01)
                                continue
                            pos += len(data)
                            yield data
                except Exception as e:
                    logger.error("[STREAM] Error reading file (progressive): %s", e)
                    raise

            headers = {
                "Accept-Ranges": "bytes",
                "Content-Type": content_type,
                "Content-Encoding": "identity",
                "Cache-Control": "no-store",
                "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length, Content-Type",
            }

            return StreamingResponse(
                file_generator(),
                headers=headers
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Stream torrent file error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stream file: {str(e)}"
        )


@router.get("/torrent-streamer/sse/{user_id}/{info_hash}/{file_index}")
async def stream_status_events(
    user_id: int,
    info_hash: str,
    file_index: int,
    request: Request,
    token: Optional[str] = None
):
    """Server-Sent Events with live stream status for smoother UX."""
    try:
        if not token or not verify_stream_token(token, user_id, info_hash, file_index):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired token")

        from apps.torrent_streamer.backend import _active_torrents
        if info_hash not in _active_torrents:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Torrent not found")
        handle = _active_torrents[info_hash]
        manager = get_stream_session_manager()

        async def event_gen():
            try:
                while True:
                    if await request.is_disconnected():
                        break
                    status = handle.status()
                    progress_pct = status.progress * 100
                    num_peers = status.num_peers
                    download_rate = status.download_rate
                    upload_rate = status.upload_rate

                    contiguous_bytes = manager.compute_contiguous_available_bytes(handle, file_index)

                    payload = {
                        "progress": progress_pct,
                        "num_peers": num_peers,
                        "download_rate": download_rate,
                        "upload_rate": upload_rate,
                        "contiguous_bytes": contiguous_bytes,
                    }
                    yield f"data: {json.dumps(payload)}\n\n"
                    await asyncio.sleep(1.0)
            except Exception as e:
                logger.error("[SSE] stream error: %s", e)

        return StreamingResponse(event_gen(), media_type="text/event-stream")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] SSE error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SSE failed")


@router.get("/torrent-streamer/hls/{user_id}/{info_hash}/{file_index}/master.m3u8")
async def hls_master(
    user_id: int,
    info_hash: str,
    file_index: int,
    token: Optional[str] = None
):
    if not token or not verify_stream_token(token, user_id, info_hash, file_index):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired token")
    from apps.torrent_streamer.backend import _active_torrents
    if info_hash not in _active_torrents:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Torrent not found")
    handle = _active_torrents[info_hash]
    ti = handle.torrent_file()
    fe = ti.files().at(file_index)
    download_dir = Path(f"./backend/uploads/torrents/{user_id}/{info_hash}")
    input_file = download_dir / fe.path
    manager = get_hls_manager()
    out_dir = manager.ensure_hls(user_id, info_hash, file_index, input_file)
    master_path = out_dir / "master.m3u8"
    if not master_path.exists():
        # ffmpeg will produce master shortly; wait briefly
        for _ in range(20):
            if master_path.exists():
                break
            await asyncio.sleep(0.1)
    if not master_path.exists():
        raise HTTPException(status_code=503, detail="HLS not ready")
    return Response(content=master_path.read_text(), media_type="application/vnd.apple.mpegurl")


@router.get("/torrent-streamer/hls/{user_id}/{info_hash}/{file_index}/media.m3u8")
async def hls_media(
    user_id: int,
    info_hash: str,
    file_index: int,
    token: Optional[str] = None
):
    if not token or not verify_stream_token(token, user_id, info_hash, file_index):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired token")
    manager = get_hls_manager()
    out_dir = manager.get_output_dir(user_id, info_hash, file_index)
    if not out_dir:
        raise HTTPException(status_code=404, detail="HLS not initialized")
    media_path = out_dir / "media.m3u8"
    if not media_path.exists():
        raise HTTPException(status_code=503, detail="HLS media not ready")
    return Response(content=media_path.read_text(), media_type="application/vnd.apple.mpegurl")


@router.get("/torrent-streamer/hls/{user_id}/{info_hash}/{file_index}/{segment}")
async def hls_segment(
    user_id: int,
    info_hash: str,
    file_index: int,
    segment: str,
    token: Optional[str] = None
):
    if not token or not verify_stream_token(token, user_id, info_hash, file_index):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired token")
    manager = get_hls_manager()
    out_dir = manager.get_output_dir(user_id, info_hash, file_index)
    if not out_dir:
        raise HTTPException(status_code=404, detail="HLS not initialized")
    seg_path = out_dir / segment
    if not seg_path.exists():
        raise HTTPException(status_code=404, detail="Segment not found")
    # Set correct content type
    media_type = "video/mp4" if segment.endswith(".mp4") else "video/iso.segment"
    return Response(content=seg_path.read_bytes(), media_type=media_type, headers={
        "Cache-Control": "no-store"
    })


# ===== Conversation History Endpoints =====

class ConversationResponse(BaseModel):
    """Response model for a single conversation."""
    id: int
    title: str
    message_count: int
    created_at: str
    updated_at: str
    last_message_at: Optional[str]
    preview: str  # First user message preview


class ConversationDetail(BaseModel):
    """Detailed conversation with full history."""
    id: int
    title: str
    conversation_history: List[Dict[str, Any]]
    created_at: str
    updated_at: str
    last_message_at: Optional[str]


@router.get("/{app_id}/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    app_id: str,
    current_user: CurrentUserDep,
    db: DatabaseDep
):
    """
    Get all refinement conversations for an app.
    
    Returns conversations ordered by last_message_at desc (most recent first).
    """
    from app.models.app_platform import AppAgentConversation
    from datetime import timezone
    
    logger.info(f"[API] Listing conversations for app '{app_id}', user {current_user.id}")
    
    # Verify app exists and user owns it
    result = await db.execute(
        select(App).where(
            App.id == app_id,
            App.owner_id == current_user.id
        )
    )
    app = result.scalar_one_or_none()
    
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"App '{app_id}' not found or you don't own it"
        )
    
    # Get all conversations for this app
    result = await db.execute(
        select(AppAgentConversation)
        .where(
            AppAgentConversation.app_id == app_id,
            AppAgentConversation.user_id == current_user.id
        )
        .order_by(AppAgentConversation.last_message_at.desc().nullsfirst())
    )
    conversations = result.scalars().all()
    
    # Format response
    response = []
    for conv in conversations:
        # Get first user message for preview
        preview = "New conversation"
        for msg in conv.conversation_history:
            if msg.get("role") == "user":
                content = msg.get("content", "")
                preview = content[:100] + "..." if len(content) > 100 else content
                break
        
        response.append(ConversationResponse(
            id=conv.id,
            title=conv.title,
            message_count=len(conv.conversation_history),
            created_at=conv.created_at.isoformat() if conv.created_at else "",
            updated_at=conv.updated_at.isoformat() if conv.updated_at else "",
            last_message_at=conv.last_message_at.isoformat() if conv.last_message_at else None,
            preview=preview
        ))
    
    return response


@router.get("/{app_id}/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    app_id: str,
    conversation_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
):
    """Get a specific conversation with full message history."""
    from app.models.app_platform import AppAgentConversation
    
    logger.info(f"[API] Getting conversation {conversation_id} for app '{app_id}'")
    
    # Get conversation
    result = await db.execute(
        select(AppAgentConversation).where(
            AppAgentConversation.id == conversation_id,
            AppAgentConversation.app_id == app_id,
            AppAgentConversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return ConversationDetail(
        id=conversation.id,
        title=conversation.title,
        conversation_history=conversation.conversation_history,
        created_at=conversation.created_at.isoformat() if conversation.created_at else "",
        updated_at=conversation.updated_at.isoformat() if conversation.updated_at else "",
        last_message_at=conversation.last_message_at.isoformat() if conversation.last_message_at else None
    )


@router.patch("/{app_id}/conversations/{conversation_id}")
async def update_conversation(
    app_id: str,
    conversation_id: int,
    title: str,
    current_user: CurrentUserDep,
    db: DatabaseDep
):
    """Update conversation (e.g., rename)."""
    from app.models.app_platform import AppAgentConversation
    
    logger.info(f"[API] Updating conversation {conversation_id}")
    
    # Get conversation
    result = await db.execute(
        select(AppAgentConversation).where(
            AppAgentConversation.id == conversation_id,
            AppAgentConversation.app_id == app_id,
            AppAgentConversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    conversation.title = title
    await db.commit()
    
    return {"message": "Conversation updated successfully"}


@router.delete("/{app_id}/conversations/{conversation_id}")
async def delete_conversation(
    app_id: str,
    conversation_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
):
    """Delete a conversation."""
    from app.models.app_platform import AppAgentConversation
    
    logger.info(f"[API] Deleting conversation {conversation_id}")
    
    # Get conversation
    result = await db.execute(
        select(AppAgentConversation).where(
            AppAgentConversation.id == conversation_id,
            AppAgentConversation.app_id == app_id,
            AppAgentConversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    await db.delete(conversation)
    await db.commit()
    
    return {"message": "Conversation deleted successfully"}
