"""
AI Chat API endpoints.
Handles conversations with specialized AI agents.
"""
from typing import Any

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUserDep, DatabaseDep
from app.models.conversation import Conversation, Message, AgentType
from app.schemas.chat import (
    ChatRequest, 
    ChatResponse, 
    ConversationCreate, 
    ConversationResponse,
    MessageResponse
)
from app.services.ai_agent import get_agent_by_type

router = APIRouter()


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
    
    # Save user message
    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=chat_request.message,
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
        
        # Save AI response
        ai_message = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=ai_response.content,
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
    
    # Default to research agent for general goals
    return "research"