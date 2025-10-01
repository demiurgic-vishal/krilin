"""
Goal and progress tracking models.
Core to the adaptive AI system from ideas.txt where users say
"I want to be more social" and AI creates plans.
"""
from datetime import datetime
from typing import Literal, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


GoalStatus = Literal["active", "completed", "paused", "archived"]
GoalCategory = Literal[
    "social", "organized", "learning", "health", "finance", 
    "career", "productivity", "wellness", "relationships", "skills"
]


class Goal(Base):
    """User goals that trigger AI-generated plans and resources."""
    
    __tablename__ = "goals"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Goal definition
    title: Mapped[str] = mapped_column(String(255))  # "Be more social"
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[GoalCategory] = mapped_column(String(50), index=True)
    
    # AI-generated content
    ai_plan: Mapped[dict] = mapped_column(JSON, default=dict)  # Generated plan
    resources: Mapped[list] = mapped_column(JSON, default=list)  # Books, articles
    exercises: Mapped[list] = mapped_column(JSON, default=list)  # Practice exercises
    
    # Progress tracking
    progress_metrics: Mapped[dict] = mapped_column(JSON, default=dict)
    current_progress: Mapped[float] = mapped_column(default=0.0)  # 0-100%
    
    # Goal metadata
    status: Mapped[GoalStatus] = mapped_column(String(20), default="active")
    priority: Mapped[int] = mapped_column(default=3)  # 1-5 scale
    created_by_agent: Mapped[str] = mapped_column(String(50))  # Which agent created it
    
    # Dates
    target_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
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
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="goals")
    progress_entries: Mapped[list["ProgressEntry"]] = relationship(
        back_populates="goal",
        cascade="all, delete-orphan",
        order_by="ProgressEntry.date.desc()"
    )
    reminders: Mapped[list["Reminder"]] = relationship(
        back_populates="goal",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Goal(id={self.id}, title='{self.title}', category='{self.category}')>"


class ProgressEntry(Base):
    """Daily/periodic progress entries for goals."""
    
    __tablename__ = "progress_entries"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id"), index=True)
    
    # Progress data
    value: Mapped[float] = mapped_column()  # Numeric progress
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    # Entry metadata
    entry_type: Mapped[str] = mapped_column(String(50), default="manual")  # manual, auto, ai_generated
    data_source: Mapped[Optional[str]] = mapped_column(String(100))  # email, calendar, etc.
    
    # Date
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    # Relationships
    goal: Mapped[Goal] = relationship(back_populates="progress_entries")
    
    def __repr__(self) -> str:
        return f"<ProgressEntry(goal_id={self.goal_id}, value={self.value})>"


class Reminder(Base):
    """AI-generated reminders based on user goals and data."""
    
    __tablename__ = "reminders"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    goal_id: Mapped[Optional[int]] = mapped_column(ForeignKey("goals.id"), index=True)
    
    # Reminder content
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    
    # Scheduling
    scheduled_for: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    time_of_day: Mapped[str] = mapped_column(String(20))  # morning, afternoon, evening
    
    # Status
    is_sent: Mapped[bool] = mapped_column(default=False)
    is_acknowledged: Mapped[bool] = mapped_column(default=False)
    
    # AI context
    generated_by: Mapped[str] = mapped_column(String(50))  # Which agent created it
    context: Mapped[dict] = mapped_column(JSON, default=dict)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    goal: Mapped[Optional[Goal]] = relationship(back_populates="reminders")
    
    def __repr__(self) -> str:
        return f"<Reminder(id={self.id}, title='{self.title}')>"