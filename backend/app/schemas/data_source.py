"""
Data Source Pydantic schemas.
Handles external service integrations like Google Calendar, Gmail, etc.
"""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.models.data_source import DataSourceType, SyncStatus

# Sync history status values
SyncHistoryStatus = Literal["pending", "running", "success", "error", "partial"]


class DataSourceBase(BaseModel):
    """Base data source schema."""
    source_type: DataSourceType
    display_name: Optional[str] = None


class DataSourceCreate(DataSourceBase):
    """Schema for creating data source connections."""
    access_token: str = Field(..., description="OAuth access token")
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    config: dict = Field(default_factory=dict)


class DataSourceUpdate(BaseModel):
    """Schema for updating data sources."""
    display_name: Optional[str] = None
    is_active: Optional[bool] = None
    sync_enabled: Optional[bool] = None
    sync_frequency_minutes: Optional[int] = Field(None, ge=5, le=1440)
    config: Optional[dict] = None


class DataSourceResponse(DataSourceBase):
    """Schema for data source responses."""
    id: int
    user_id: int
    display_name: Optional[str] = None
    is_active: bool
    is_connected: bool
    sync_enabled: bool
    sync_frequency_minutes: int
    config: dict
    last_sync_at: Optional[datetime] = None
    last_sync_status: SyncStatus
    sync_error_message: Optional[str] = None
    total_syncs: int
    successful_syncs: int
    failed_syncs: int
    record_count: int = Field(default=0, description="Total number of records synced")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DataSourceConnect(BaseModel):
    """Schema for OAuth connection initiation."""
    source_type: DataSourceType
    redirect_uri: str = Field(..., description="OAuth redirect URI")


class DataSourceCallback(BaseModel):
    """Schema for OAuth callback handling."""
    code: str = Field(..., description="OAuth authorization code")
    state: Optional[str] = None


class SyncTrigger(BaseModel):
    """Schema for manual sync trigger."""
    force: bool = Field(default=False, description="Force sync even if recent")


class SyncHistoryResponse(BaseModel):
    """Schema for sync history responses."""
    id: int
    data_source_id: int
    source_type: DataSourceType
    status: SyncHistoryStatus
    records_processed: int
    records_created: int
    records_updated: int
    records_failed: int
    error_message: Optional[str] = None
    error_details: Optional[dict] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None

    class Config:
        from_attributes = True


class DataSourceStats(BaseModel):
    """Schema for data source statistics."""
    total_sources: int
    active_sources: int
    connected_sources: int
    sources_by_type: dict[DataSourceType, int]
    total_syncs: int
    successful_syncs: int
    failed_syncs: int
    last_sync_at: Optional[datetime] = None
