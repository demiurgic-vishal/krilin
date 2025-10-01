"""
Data source integration models.
Supports the extensive data connections from ideas.txt:
Google Calendar, Gmail, Whoop, Apple Health, Strava, etc.
"""
from datetime import datetime
from typing import Literal, Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


DataSourceType = Literal[
    "google_calendar", "gmail", "google_fit", "apple_health", 
    "whoop", "strava", "credit_card", "bank_account", "document_upload",
    "news_api", "libgen", "custom_api"
]

SyncStatus = Literal["active", "paused", "error", "disconnected"]


class DataSource(Base):
    """Connected data sources for each user."""
    
    __tablename__ = "data_sources"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Data source information
    name: Mapped[str] = mapped_column(String(255))  # User-friendly name
    source_type: Mapped[DataSourceType] = mapped_column(String(50), index=True)
    
    # Connection details
    credentials: Mapped[dict] = mapped_column(JSON, default=dict)  # Encrypted tokens
    configuration: Mapped[dict] = mapped_column(JSON, default=dict)  # Source-specific config
    
    # Sync settings
    sync_frequency: Mapped[int] = mapped_column(default=3600)  # Seconds between syncs
    auto_sync: Mapped[bool] = mapped_column(default=True)
    
    # Status
    status: Mapped[SyncStatus] = mapped_column(String(20), default="active")
    is_active: Mapped[bool] = mapped_column(default=True)
    
    # Sync tracking
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    next_sync_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    consecutive_failures: Mapped[int] = mapped_column(default=0)
    
    # Error tracking
    last_error: Mapped[Optional[str]] = mapped_column(Text)
    error_count: Mapped[int] = mapped_column(default=0)
    
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
    user: Mapped["User"] = relationship(back_populates="data_sources")
    sync_history: Mapped[list["SyncHistory"]] = relationship(
        back_populates="data_source",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<DataSource(id={self.id}, type='{self.source_type}', status='{self.status}')>"


class SyncHistory(Base):
    """History of data synchronization attempts."""
    
    __tablename__ = "sync_history"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    data_source_id: Mapped[int] = mapped_column(ForeignKey("data_sources.id"), index=True)
    
    # Sync details
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    duration_seconds: Mapped[Optional[float]] = mapped_column()
    
    # Sync results
    status: Mapped[str] = mapped_column(String(20))  # success, error, partial
    records_processed: Mapped[int] = mapped_column(default=0)
    records_created: Mapped[int] = mapped_column(default=0)
    records_updated: Mapped[int] = mapped_column(default=0)
    
    # Error information
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    error_details: Mapped[Optional[dict]] = mapped_column(JSON)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    # Relationships
    data_source: Mapped[DataSource] = relationship(back_populates="sync_history")
    
    def __repr__(self) -> str:
        return f"<SyncHistory(id={self.id}, status='{self.status}')>"


class DataRecord(Base):
    """Unified storage for all types of synced data."""
    
    __tablename__ = "data_records"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    data_source_id: Mapped[int] = mapped_column(ForeignKey("data_sources.id"), index=True)
    
    # Record identification
    external_id: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    record_type: Mapped[str] = mapped_column(String(100), index=True)  # email, event, workout, etc.
    
    # Data content
    data: Mapped[dict] = mapped_column(JSON)
    processed_data: Mapped[Optional[dict]] = mapped_column(JSON)  # AI-processed insights
    
    # Metadata
    importance_score: Mapped[Optional[float]] = mapped_column()  # AI-assigned importance
    categories: Mapped[list[str]] = mapped_column(JSON, default=list)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    
    # Dates
    record_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    
    # Processing status
    is_processed: Mapped[bool] = mapped_column(default=False, index=True)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
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
        return f"<DataRecord(id={self.id}, type='{self.record_type}')>"