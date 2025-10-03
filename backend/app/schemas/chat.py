"""
Chat and conversation Pydantic schemas.
LLM-friendly with clear validation and type hints.
"""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.models.conversation import AgentType, MessageRole


class ConversationBase(BaseModel):
    """Base conversation schema."""
    title: str
    agent_type: AgentType
    context: Optional[dict] = Field(default_factory=dict)


class ConversationCreate(ConversationBase):
    """Schema for creating conversations."""
    pass


class ConversationUpdate(BaseModel):
    """Schema for updating conversations."""
    title: Optional[str] = None
    context: Optional[dict] = None
    is_active: Optional[bool] = None


class MessageBase(BaseModel):
    """Base message schema."""
    role: MessageRole
    content: str
    metadata: Optional[dict] = Field(default_factory=dict)


class MessageResponse(MessageBase):
    """Schema for message responses."""
    id: int
    conversation_id: int
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        """Custom from_orm to handle SQLAlchemy message_metadata field."""
        data = {
            'id': obj.id,
            'conversation_id': obj.conversation_id,
            'role': obj.role,
            'content': obj.content,
            'metadata': obj.message_metadata if obj.message_metadata is not None else {},
            'prompt_tokens': obj.prompt_tokens,
            'completion_tokens': obj.completion_tokens,
            'created_at': obj.created_at
        }
        return cls(**data)


class ConversationResponse(ConversationBase):
    """Schema for conversation responses."""
    id: int
    user_id: int
    goals_discussed: list[str] = Field(default_factory=list)
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_message_at: Optional[datetime] = None
    messages: list[MessageResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        """Custom from_orm to handle nested messages with metadata."""
        # Manually serialize messages to avoid Pydantic validation issues
        messages = [MessageResponse.from_orm(msg) for msg in obj.messages]

        data = {
            'id': obj.id,
            'user_id': obj.user_id,
            'title': obj.title,
            'agent_type': obj.agent_type,
            'context': obj.context,
            'goals_discussed': obj.goals_discussed,
            'is_active': obj.is_active,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at,
            'last_message_at': obj.last_message_at,
            'messages': messages
        }
        return cls(**data)


class ChatRequest(BaseModel):
    """Schema for chat message requests."""
    message: str = Field(..., min_length=1, max_length=1000000)  # 1M characters (~200k tokens)
    metadata: Optional[dict] = Field(default_factory=dict)
    context: Optional[dict] = Field(default_factory=dict)
    file_paths: Optional[list[str]] = Field(default_factory=list, description="Paths to uploaded files")


class ChatResponse(BaseModel):
    """Schema for AI chat responses."""
    message: str
    metadata: Optional[dict] = Field(default_factory=dict)
    suggestions: list[str] = Field(default_factory=list)
    context_updates: Optional[dict] = Field(default_factory=dict)
    goals_created: Optional[list[dict]] = Field(default_factory=list)
    resources_found: Optional[list[dict]] = Field(default_factory=list)
    actions_suggested: Optional[list[dict]] = Field(default_factory=list)


class AgentMemoryCreate(BaseModel):
    """Schema for creating agent memory."""
    agent_type: AgentType
    memory_key: str
    memory_value: dict
    importance_score: float = Field(default=1.0, ge=0.0, le=10.0)


class AgentMemoryResponse(BaseModel):
    """Schema for agent memory responses."""
    id: int
    user_id: int
    agent_type: AgentType
    memory_key: str
    memory_value: dict
    importance_score: float
    access_count: int
    created_at: datetime
    updated_at: datetime
    last_accessed: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class GoalChatRequest(BaseModel):
    """Schema for goal-driven chat requests."""
    goal_statement: str = Field(..., description="User's goal statement like 'I want to be more social'")
    context: Optional[dict] = Field(default_factory=dict)
    preferences: Optional[dict] = Field(default_factory=dict)


class GoalChatResponse(ChatResponse):
    """Schema for goal-driven chat responses."""
    plan: Optional[dict] = Field(default_factory=dict)
    resources: list[dict] = Field(default_factory=list)
    exercises: list[dict] = Field(default_factory=list)
    timeline: Optional[dict] = Field(default_factory=dict)
    tracking_metrics: list[str] = Field(default_factory=list)


class FileUploadResponse(BaseModel):
    """Schema for file upload responses."""
    filename: str
    file_path: str
    file_size: int
    content_type: str