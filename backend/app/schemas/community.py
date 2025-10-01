"""
Community Pydantic schemas.
Handles accomplishment sharing and social features from ideas.txt.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.community import AccomplishmentType, ReactionType, VisibilityLevel


class AccomplishmentBase(BaseModel):
    """Base accomplishment schema."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    accomplishment_type: AccomplishmentType
    visibility: VisibilityLevel = "friends"


class AccomplishmentCreate(AccomplishmentBase):
    """Schema for creating accomplishments."""
    goal_id: Optional[int] = None
    metrics: dict = Field(default_factory=dict)
    evidence: dict = Field(default_factory=dict)
    accomplished_at: datetime


class AccomplishmentUpdate(BaseModel):
    """Schema for updating accomplishments."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    visibility: Optional[VisibilityLevel] = None


class AccomplishmentResponse(AccomplishmentBase):
    """Schema for accomplishment responses."""
    id: int
    user_id: int
    goal_id: Optional[int] = None
    metrics: dict
    evidence: dict
    is_featured: bool
    view_count: int
    reaction_count: int
    comment_count: int
    share_count: int
    accomplished_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReactionCreate(BaseModel):
    """Schema for creating reactions."""
    reaction_type: ReactionType


class ReactionResponse(BaseModel):
    """Schema for reaction responses."""
    id: int
    accomplishment_id: int
    user_id: int
    reaction_type: ReactionType
    created_at: datetime

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    """Schema for creating comments."""
    content: str = Field(..., min_length=1, max_length=2000)
    parent_comment_id: Optional[int] = None


class CommentResponse(BaseModel):
    """Schema for comment responses."""
    id: int
    accomplishment_id: int
    user_id: int
    parent_comment_id: Optional[int] = None
    content: str
    reaction_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConnectionCreate(BaseModel):
    """Schema for creating user connections."""
    following_id: int
    connection_type: str = "follow"


class ConnectionResponse(BaseModel):
    """Schema for connection responses."""
    id: int
    follower_id: int
    following_id: int
    connection_type: str
    is_mutual: bool
    is_blocked: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ChallengeBase(BaseModel):
    """Base challenge schema."""
    title: str = Field(..., min_length=1, max_length=255)
    description: str
    category: str
    start_date: datetime
    end_date: datetime


class ChallengeCreate(ChallengeBase):
    """Schema for creating challenges."""
    rules: dict
    success_criteria: dict
    rewards: dict = Field(default_factory=dict)


class ChallengeResponse(ChallengeBase):
    """Schema for challenge responses."""
    id: int
    rules: dict
    success_criteria: dict
    rewards: dict
    participant_count: int
    completion_count: int
    is_active: bool
    is_featured: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChallengeParticipationCreate(BaseModel):
    """Schema for joining challenges."""
    pass  # No additional fields needed


class ChallengeParticipationUpdate(BaseModel):
    """Schema for updating challenge progress."""
    progress: dict
    completion_proof: Optional[dict] = None


class ChallengeParticipationResponse(BaseModel):
    """Schema for participation responses."""
    id: int
    challenge_id: int
    user_id: int
    progress: dict
    is_completed: bool
    completion_proof: Optional[dict] = None
    joined_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FeedItem(BaseModel):
    """Schema for feed items."""
    type: str  # accomplishment, challenge, milestone
    item: dict  # Flexible content
    created_at: datetime
