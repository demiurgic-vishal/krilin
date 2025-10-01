"""
Goal tracking Pydantic schemas.
Supports the adaptive AI system where users set goals like "I want to be more social".
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.goal import GoalCategory, GoalStatus


class GoalBase(BaseModel):
    """Base goal schema."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: GoalCategory
    priority: int = Field(default=3, ge=1, le=5)
    target_date: Optional[datetime] = None


class GoalCreate(GoalBase):
    """Schema for creating goals."""
    pass


class GoalUpdate(BaseModel):
    """Schema for updating goals."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[GoalCategory] = None
    status: Optional[GoalStatus] = None
    priority: Optional[int] = Field(None, ge=1, le=5)
    target_date: Optional[datetime] = None
    current_progress: Optional[float] = Field(None, ge=0.0, le=100.0)


class GoalResponse(GoalBase):
    """Schema for goal responses."""
    id: int
    user_id: int
    ai_plan: dict
    resources: list
    exercises: list
    progress_metrics: dict
    current_progress: float
    status: GoalStatus
    created_by_agent: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProgressEntryCreate(BaseModel):
    """Schema for creating progress entries."""
    value: float = Field(..., description="Numeric progress value")
    notes: Optional[str] = None
    entry_type: str = Field(default="manual")
    data_source: Optional[str] = None
    date: datetime


class ProgressEntryResponse(BaseModel):
    """Schema for progress entry responses."""
    id: int
    goal_id: int
    value: float
    notes: Optional[str] = None
    entry_type: str
    data_source: Optional[str] = None
    date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class GoalWithProgress(GoalResponse):
    """Schema for goal with progress entries."""
    progress_entries: list[ProgressEntryResponse] = Field(default_factory=list)


class ReminderCreate(BaseModel):
    """Schema for creating reminders."""
    goal_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=255)
    message: str
    scheduled_for: datetime
    time_of_day: str = Field(default="morning")


class ReminderResponse(BaseModel):
    """Schema for reminder responses."""
    id: int
    user_id: int
    goal_id: Optional[int] = None
    title: str
    message: str
    scheduled_for: datetime
    time_of_day: str
    is_sent: bool
    is_acknowledged: bool
    generated_by: str
    context: dict
    created_at: datetime
    sent_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GoalGenerationRequest(BaseModel):
    """Schema for AI-driven goal generation."""
    goal_statement: str = Field(..., description="User's goal like 'I want to be more social'")
    context: Optional[dict] = Field(default_factory=dict)
    preferences: Optional[dict] = Field(default_factory=dict)


class GoalGenerationResponse(BaseModel):
    """Schema for AI-generated goal with plan."""
    goal: GoalResponse
    plan: dict = Field(..., description="AI-generated action plan")
    resources: list[dict] = Field(default_factory=list, description="Books, articles, tools")
    exercises: list[dict] = Field(default_factory=list, description="Practice exercises")
    timeline: dict = Field(default_factory=dict, description="Suggested timeline")
    tracking_metrics: list[str] = Field(default_factory=list, description="Metrics to track")
