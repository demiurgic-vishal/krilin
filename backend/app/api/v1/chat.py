"""
AI Chat API endpoints.
Handles conversations with specialized AI agents.
"""
import json
import os
import uuid
from pathlib import Path
from typing import Any, AsyncGenerator

from fastapi import APIRouter, HTTPException, UploadFile, File, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUserDep, DatabaseDep
from app.models.conversation import Conversation, Message, AgentType
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationCreate,
    ConversationResponse,
    MessageResponse,
    FileUploadResponse
)
from app.services.claude_agent_service import get_agent_by_type  # Using Claude Agent SDK service
from app.services.conversation_compactor import get_conversation_compactor

router = APIRouter()

# Upload directory configuration
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Max file size: 50MB
MAX_FILE_SIZE = 50 * 1024 * 1024


def sanitize_text(text: str) -> str:
    """Remove null bytes and other problematic characters from text for PostgreSQL."""
    # Remove null bytes which PostgreSQL doesn't allow
    return text.replace('\x00', '')


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Create a new conversation with an AI agent.

    Args:
        conversation_data: Conversation creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        ConversationResponse: Created conversation
    """
    conversation = Conversation(
        user_id=current_user.id,
        title=conversation_data.title,
        agent_type=conversation_data.agent_type,
        context=conversation_data.context or {}
    )

    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    # Load messages relationship explicitly (even though it's empty for new conversation)
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation.id)
        .options(selectinload(Conversation.messages))
    )
    conversation = result.scalar_one()

    return ConversationResponse.from_orm(conversation)


@router.get("/conversations", response_model=list[ConversationResponse])
async def get_conversations(
    current_user: CurrentUserDep,
    db: DatabaseDep,
    agent_type: AgentType | None = None,
    limit: int = 20,
    offset: int = 0
) -> Any:
    """
    Get user's conversations.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        agent_type: Optional filter by agent type
        limit: Number of conversations to return
        offset: Number of conversations to skip
        
    Returns:
        list[ConversationResponse]: List of conversations
    """
    query = select(Conversation).where(
        Conversation.user_id == current_user.id
    ).options(
        selectinload(Conversation.messages)
    ).order_by(Conversation.updated_at.desc())
    
    if agent_type:
        query = query.where(Conversation.agent_type == agent_type)
    
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    conversations = result.scalars().all()
    
    return [ConversationResponse.from_orm(conv) for conv in conversations]


@router.post("/conversations/{conversation_id}/messages", response_model=ChatResponse)
async def send_message(
    conversation_id: int,
    chat_request: ChatRequest,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Send a message to an AI agent.
    
    Args:
        conversation_id: Conversation ID
        chat_request: Chat message request
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        ChatResponse: AI agent response
        
    Raises:
        HTTPException: If conversation not found or unauthorized
    """
    # Get conversation
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        ).options(selectinload(Conversation.messages))
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Save user message (sanitize to remove null bytes)
    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=sanitize_text(chat_request.message),
        message_metadata=chat_request.metadata or {}
    )
    db.add(user_message)

    try:
        # Get AI agent and generate response
        agent = get_agent_by_type(conversation.agent_type)

        # Build conversation context
        context = {
            "user_id": current_user.id,
            "conversation_context": conversation.context,
            "recent_messages": [
                {"role": msg.role, "content": msg.content}
                for msg in conversation.messages[-10:]  # Last 10 messages
            ],
            "user_preferences": current_user.preferences
        }

        # Generate AI response
        ai_response = await agent.process_message(
            message=chat_request.message,
            context=context
        )

        # Save AI response (sanitize to remove null bytes)
        ai_message = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=sanitize_text(ai_response.content),
            message_metadata=ai_response.metadata,
            prompt_tokens=ai_response.prompt_tokens,
            completion_tokens=ai_response.completion_tokens
        )
        db.add(ai_message)
        
        # Update conversation context if needed
        if ai_response.context_updates:
            conversation.context.update(ai_response.context_updates)
            conversation.goals_discussed.extend(ai_response.goals_mentioned or [])
        
        conversation.last_message_at = user_message.created_at
        
        await db.commit()
        await db.refresh(ai_message)
        
        return ChatResponse(
            message=ai_response.content,
            metadata=ai_response.metadata,
            suggestions=ai_response.suggestions or [],
            context_updates=ai_response.context_updates or {}
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )


@router.post("/conversations/{conversation_id}/messages/stream")
async def send_message_stream(
    conversation_id: int,
    chat_request: ChatRequest,
    current_user: CurrentUserDep,
    db: DatabaseDep
):
    """
    Send a message and get streaming response from AI agent.

    Returns Server-Sent Events (SSE) stream with real-time tokens.

    Args:
        conversation_id: Conversation ID
        chat_request: Chat message request
        current_user: Current authenticated user
        db: Database session

    Returns:
        StreamingResponse: SSE stream of AI response tokens
    """
    # Get conversation
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        ).options(selectinload(Conversation.messages))
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Save user message (sanitize to remove null bytes)
    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=sanitize_text(chat_request.message),
        message_metadata=chat_request.metadata or {}
    )
    db.add(user_message)
    await db.commit()

    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate SSE events for streaming response."""
        full_response = ""
        metadata = {}

        try:
            # Get AI agent and compactor
            agent = get_agent_by_type(conversation.agent_type)
            compactor = get_conversation_compactor()

            # Build message history
            all_messages = [
                {"role": msg.role, "content": msg.content}
                for msg in conversation.messages
            ]

            # Get compacted history (uses cached summary if available)
            compacted_summary, recent_messages, needs_warning, compaction_metadata = await compactor.get_compacted_history(
                messages=all_messages,
                conversation_id=conversation_id,
                cached_summary=conversation.compacted_summary,
                summary_valid_until_message=conversation.compaction_point
            )

            # Update cache if new compaction happened
            if compaction_metadata.get("compaction_point") and not compaction_metadata.get("used_cached_summary"):
                conversation.compacted_summary = compacted_summary
                conversation.compaction_point = compaction_metadata["compaction_point"]
                await db.commit()

            # Build context with compacted history
            context = {
                "user_id": current_user.id,
                "conversation_context": conversation.context,
                "conversation_history": recent_messages,
                "compacted_summary": compacted_summary,  # Include summary for prompt building
                "user_preferences": current_user.preferences,
                "compaction_metadata": compaction_metadata,  # Pass to frontend
                "file_paths": chat_request.file_paths  # Pass uploaded file paths to agent
            }

            # Send compaction warning if needed (before streaming starts)
            if compaction_metadata.get("is_compacted"):
                compaction_warning = {
                    "type": "compaction_warning",
                    "total_tokens": compaction_metadata.get("total_tokens"),
                    "messages_compacted": compaction_metadata.get("messages_compacted"),
                    "is_slow": not compaction_metadata.get("used_cached_summary")  # First time compaction is slow
                }
                yield f"data: {json.dumps(compaction_warning)}\n\n"

            # Stream response - will include history in the prompt
            async for event in agent.process_message_streaming(chat_request.message, context):
                if event.event_type == "text":
                    # Send text chunks
                    event_data = {
                        "type": "token",
                        "content": event.content
                    }
                    full_response += event.content
                    yield f"data: {json.dumps(event_data)}\n\n"

                elif event.event_type == "thinking":
                    # Send thinking tokens
                    thinking_data = {
                        "type": "thinking",
                        "content": event.content
                    }
                    yield f"data: {json.dumps(thinking_data)}\n\n"

                elif event.event_type == "tool_use":
                    # Send tool usage notification
                    tool_data = {
                        "type": "tool_use",
                        "tool": event.content.get("tool"),
                        "input": event.content.get("input")
                    }
                    yield f"data: {json.dumps(tool_data)}\n\n"

                elif event.event_type == "tool_result":
                    # Send tool result notification
                    tool_result_data = {
                        "type": "tool_result",
                        "tool_use_id": event.content.get("tool_use_id"),
                        "result": event.content.get("result")
                    }
                    yield f"data: {json.dumps(tool_result_data)}\n\n"

                elif event.event_type == "result":
                    # Update metadata from result
                    metadata.update(event.metadata)

            # Save AI response to database (sanitize to remove null bytes)
            ai_message = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=sanitize_text(full_response),
                message_metadata=metadata,
            )
            db.add(ai_message)

            # Update conversation
            conversation.last_message_at = user_message.created_at
            await db.commit()

            # Send completion event
            completion_data = {
                "type": "done",
                "content": full_response,
                "metadata": metadata
            }
            yield f"data: {json.dumps(completion_data)}\n\n"

        except Exception as e:
            # Send error event
            error_data = {
                "type": "error",
                "error": str(e)
            }
            yield f"data: {json.dumps(error_data)}\n\n"
            await db.rollback()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Get a specific conversation.

    Args:
        conversation_id: Conversation ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        ConversationResponse: Conversation with messages

    Raises:
        HTTPException: If conversation not found or unauthorized
    """
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        ).options(selectinload(Conversation.messages))
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    return ConversationResponse.from_orm(conversation)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> None:
    """
    Delete a conversation and all its messages.

    Args:
        conversation_id: Conversation ID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If conversation not found or unauthorized
    """
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
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


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: CurrentUserDep = None
) -> Any:
    """
    Upload a file to be used in chat conversations.

    The file will be saved to the uploads directory and a path will be returned.
    This path can be referenced in chat messages for Claude to read.

    Args:
        file: The uploaded file
        current_user: Current authenticated user

    Returns:
        FileUploadResponse: File metadata and path

    Raises:
        HTTPException: If file is too large or upload fails
    """
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024)}MB"
        )

    try:
        # Generate unique filename
        file_extension = Path(file.filename).suffix if file.filename else ""
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # Save file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        return FileUploadResponse(
            filename=file.filename or unique_filename,
            file_path=str(file_path),
            file_size=file_size,
            content_type=file.content_type or "application/octet-stream"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep,
    limit: int = 50,
    offset: int = 0
) -> Any:
    """
    Get messages from a conversation.

    Args:
        conversation_id: Conversation ID
        current_user: Current authenticated user
        db: Database session
        limit: Number of messages to return
        offset: Number of messages to skip

    Returns:
        list[MessageResponse]: List of messages

    Raises:
        HTTPException: If conversation not found or unauthorized
    """
    # Verify conversation ownership
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Get messages
    result = await db.execute(
        select(Message).where(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.desc())
        .limit(limit).offset(offset)
    )
    messages = result.scalars().all()

    return [MessageResponse.from_orm(msg) for msg in reversed(messages)]


@router.post("/goal-chat", response_model=ChatResponse)
async def goal_driven_chat(
    chat_request: ChatRequest,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Goal-driven chat endpoint for requests like "I want to be more social".
    Creates plans, finds resources, and sets up tracking.
    
    Args:
        chat_request: Chat message request
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        ChatResponse: Comprehensive AI response with plan and resources
    """
    # Determine which agent to use based on message content
    agent_type = determine_agent_from_message(chat_request.message)
    
    # Get specialized agent
    agent = get_agent_by_type(agent_type)
    
    # Build context with user's goals and preferences
    context = {
        "user_id": current_user.id,
        "user_preferences": current_user.preferences,
        "is_goal_setting": True,
        "message_intent": "goal_creation"
    }
    
    try:
        # Process goal-oriented message
        response = await agent.process_goal_message(
            message=chat_request.message,
            context=context
        )
        
        return ChatResponse(
            message=response.content,
            metadata=response.metadata,
            suggestions=response.suggestions or [],
            context_updates=response.context_updates or {},
            goals_created=response.goals_created or [],
            resources_found=response.resources_found or []
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing goal message: {str(e)}"
        )


@router.post("/execute-task", response_model=ChatResponse)
async def execute_coding_task(
    chat_request: ChatRequest,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Execute a coding/automation task using Claude Agent SDK.

    This endpoint is for tasks that require real execution:
    - Creating automation scripts
    - Setting up workflows
    - Running terminal commands
    - File operations
    - System configuration

    Args:
        chat_request: Task description and metadata
        current_user: Current authenticated user
        db: Database session

    Returns:
        ChatResponse: Execution results with files created, commands run, etc.
    """
    try:
        # Get coding agent from registry
        coding_agent = get_agent_by_type("coding")

        # Get user's data sources for context
        from app.models.data_source import DataSource
        result = await db.execute(
            select(DataSource).where(DataSource.user_id == current_user.id)
        )
        data_sources = [ds.source_type for ds in result.scalars().all()]

        # Build execution context
        context = {
            "user_id": current_user.id,
            "data_sources": data_sources,
            "user_preferences": current_user.preferences,
            "instructions": chat_request.metadata.get("instructions") if chat_request.metadata else None
        }

        # Execute the task using Claude Agent SDK
        response = await coding_agent.process_message(
            message=chat_request.message,
            context=context
        )

        return ChatResponse(
            message=response.content,
            metadata=response.metadata,
            suggestions=response.suggestions or [],
            context_updates=response.context_updates or {}
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing task: {str(e)}"
        )


def needs_execution(message: str) -> bool:
    """
    Determine if a message requires actual code execution.

    Args:
        message: User message

    Returns:
        bool: True if requires Claude Agent SDK execution
    """
    execution_keywords = [
        "create script",
        "set up",
        "automate",
        "write code",
        "schedule",
        "cron",
        "run",
        "execute",
        "build",
        "configure",
        "install"
    ]

    message_lower = message.lower()
    return any(keyword in message_lower for keyword in execution_keywords)


def determine_agent_from_message(message: str) -> AgentType:
    """
    Determine which AI agent to use based on message content.

    Args:
        message: User message

    Returns:
        AgentType: Appropriate agent type
    """
    message_lower = message.lower()

    # Social, relationships, communication
    if any(word in message_lower for word in ["social", "friend", "relationship", "communicate", "network"]):
        return "research"  # Research agent handles social learning

    # Organization, productivity, time management
    if any(word in message_lower for word in ["organized", "productive", "schedule", "time", "efficient"]):
        return "coding"  # Coding agent handles workflow creation

    # Learning, skills, education
    if any(word in message_lower for word in ["learn", "skill", "study", "course", "education", "tech"]):
        return "research"  # Research agent handles learning plans

    # Health, fitness, wellness
    if any(word in message_lower for word in ["healthy", "fit", "exercise", "workout", "wellness"]):
        return "health"

    # Finance, money, investment
    if any(word in message_lower for word in ["money", "finance", "invest", "save", "budget"]):
        return "finance"

    # Default to general assistant for casual questions
    return "general_assistant"