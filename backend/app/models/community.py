"""
Community models for sharing accomplishments and progress.
Addresses the requirement from ideas.txt: "make people feel they accomplished 
something share it with their community"
"""
from datetime import datetime
from typing import Literal, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


AccomplishmentType = Literal[
    "goal_completed", "milestone_reached", "streak_achieved", 
    "workout_finished", "book_read", "skill_learned", "habit_formed"
]

VisibilityLevel = Literal["public", "friends", "private"]
ReactionType = Literal["like", "celebrate", "support", "inspire"]


class Accomplishment(Base):
    """User accomplishments that can be shared with community."""
    
    __tablename__ = "accomplishments"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    goal_id: Mapped[Optional[int]] = mapped_column(ForeignKey("goals.id"), index=True)
    
    # Accomplishment details
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    accomplishment_type: Mapped[AccomplishmentType] = mapped_column(String(50), index=True)
    
    # Achievement data
    metrics: Mapped[dict] = mapped_column(JSON, default=dict)  # Progress numbers, streaks, etc.
    evidence: Mapped[dict] = mapped_column(JSON, default=dict)  # Screenshots, data, etc.
    
    # Sharing settings
    visibility: Mapped[VisibilityLevel] = mapped_column(String(20), default="friends")
    is_featured: Mapped[bool] = mapped_column(default=False)
    
    # Engagement metrics
    view_count: Mapped[int] = mapped_column(default=0)
    reaction_count: Mapped[int] = mapped_column(default=0)
    comment_count: Mapped[int] = mapped_column(default=0)
    share_count: Mapped[int] = mapped_column(default=0)
    
    # Timestamps
    accomplished_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
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
    reactions: Mapped[list["AccomplishmentReaction"]] = relationship(
        back_populates="accomplishment",
        cascade="all, delete-orphan"
    )
    comments: Mapped[list["AccomplishmentComment"]] = relationship(
        back_populates="accomplishment",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Accomplishment(id={self.id}, title='{self.title}')>"


class AccomplishmentReaction(Base):
    """Reactions to accomplishments (likes, celebrates, etc.)."""
    
    __tablename__ = "accomplishment_reactions"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    accomplishment_id: Mapped[int] = mapped_column(ForeignKey("accomplishments.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Reaction details
    reaction_type: Mapped[ReactionType] = mapped_column(String(20))
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    # Relationships
    accomplishment: Mapped[Accomplishment] = relationship(back_populates="reactions")
    
    def __repr__(self) -> str:
        return f"<AccomplishmentReaction(type='{self.reaction_type}')>"


class AccomplishmentComment(Base):
    """Comments on accomplishments."""
    
    __tablename__ = "accomplishment_comments"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    accomplishment_id: Mapped[int] = mapped_column(ForeignKey("accomplishments.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    parent_comment_id: Mapped[Optional[int]] = mapped_column(ForeignKey("accomplishment_comments.id"))
    
    # Comment content
    content: Mapped[str] = mapped_column(Text)
    
    # Engagement
    reaction_count: Mapped[int] = mapped_column(default=0)
    
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
    accomplishment: Mapped[Accomplishment] = relationship(back_populates="comments")
    parent_comment: Mapped[Optional["AccomplishmentComment"]] = relationship(
        remote_side="AccomplishmentComment.id"
    )
    
    def __repr__(self) -> str:
        return f"<AccomplishmentComment(id={self.id})>"


class UserConnection(Base):
    """Friend/follower connections between users."""
    
    __tablename__ = "user_connections"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    follower_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    following_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Connection type
    connection_type: Mapped[str] = mapped_column(String(20), default="follow")  # follow, friend
    
    # Status
    is_mutual: Mapped[bool] = mapped_column(default=False)
    is_blocked: Mapped[bool] = mapped_column(default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    def __repr__(self) -> str:
        return f"<UserConnection(follower={self.follower_id}, following={self.following_id})>"


class CommunityChallenge(Base):
    """Community-wide challenges to motivate users."""
    
    __tablename__ = "community_challenges"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Challenge details
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100), index=True)
    
    # Challenge rules
    rules: Mapped[dict] = mapped_column(JSON)
    success_criteria: Mapped[dict] = mapped_column(JSON)
    rewards: Mapped[dict] = mapped_column(JSON, default=dict)
    
    # Participation tracking
    participant_count: Mapped[int] = mapped_column(default=0)
    completion_count: Mapped[int] = mapped_column(default=0)
    
    # Challenge period
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    
    # Status
    is_active: Mapped[bool] = mapped_column(default=True)
    is_featured: Mapped[bool] = mapped_column(default=False)
    
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
    
    def __repr__(self) -> str:
        return f"<CommunityChallenge(id={self.id}, title='{self.title}')>"


class ChallengeParticipation(Base):
    """User participation in community challenges."""
    
    __tablename__ = "challenge_participation"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("community_challenges.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Participation data
    progress: Mapped[dict] = mapped_column(JSON, default=dict)
    is_completed: Mapped[bool] = mapped_column(default=False)
    completion_proof: Mapped[Optional[dict]] = mapped_column(JSON)
    
    # Timestamps
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    def __repr__(self) -> str:
        return f"<ChallengeParticipation(challenge={self.challenge_id}, user={self.user_id})>"