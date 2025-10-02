"""
Conversation and message models for AI chat history.
Supports the adaptive AI agent conversations from ideas.txt.
"""
from datetime import datetime
from typing import Literal, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


MessageRole = Literal["user", "assistant", "system"]
AgentType = Literal["general_assistant", "coding", "finance", "health", "research", "shopping"]


class Conversation(Base):
    """Conversation threads with AI agents."""
    
    __tablename__ = "conversations"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Conversation metadata
    title: Mapped[str] = mapped_column(String(255))
    agent_type: Mapped[AgentType] = mapped_column(String(50), index=True)
    
    # Context and memory for AI agents
    context: Mapped[dict] = mapped_column(JSON, default=dict)
    goals_discussed: Mapped[list[str]] = mapped_column(JSON, default=list)
    
    # Status
    is_active: Mapped[bool] = mapped_column(default=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now()
    )
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at"
    )
    
    def __repr__(self) -> str:
        return f"<Conversation(id={self.id}, agent_type='{self.agent_type}')>"


class Message(Base):
    """Individual messages within conversations."""
    
    __tablename__ = "messages"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"), index=True)
    
    # Message content
    role: Mapped[MessageRole] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)

    # Metadata (renamed from metadata to avoid SQLAlchemy conflict)
    message_metadata: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    
    # Token usage tracking
    prompt_tokens: Mapped[Optional[int]] = mapped_column()
    completion_tokens: Mapped[Optional[int]] = mapped_column()
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    # Relationships
    conversation: Mapped[Conversation] = relationship(back_populates="messages")
    
    def __repr__(self) -> str:
        return f"<Message(id={self.id}, role='{self.role}')>"


class AgentMemory(Base):
    """Persistent memory for AI agents across conversations."""
    
    __tablename__ = "agent_memory"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    agent_type: Mapped[AgentType] = mapped_column(String(50), index=True)
    
    # Memory content
    memory_key: Mapped[str] = mapped_column(String(255), index=True)
    memory_value: Mapped[dict] = mapped_column(JSON)
    
    # Memory metadata
    importance_score: Mapped[float] = mapped_column(default=1.0)
    access_count: Mapped[int] = mapped_column(default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now()
    )
    last_accessed: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    def __repr__(self) -> str:
        return f"<AgentMemory(agent_type='{self.agent_type}', key='{self.memory_key}')>"