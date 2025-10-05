"""
App Platform API endpoints.

Manages app installation, execution, and agent interaction.
Apps are complete applications (not workflows) with UI, state, and embedded Claude agents.
"""
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select

from app.dependencies import CurrentUserDep, DatabaseDep
from app.models.app_platform import App, AppInstallation
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
import json
import asyncio

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
