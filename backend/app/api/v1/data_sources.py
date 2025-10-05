"""
Data source integration API endpoints.
Handles connections to external services like Google Calendar, Gmail, Whoop, etc.
Supports the extensive data connections from ideas.txt.
"""
from datetime import datetime
from typing import Any, Optional
import secrets

from fastapi import APIRouter, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUserDep, DatabaseDep
from app.models.data_source import DataSource, DataSourceType, SyncHistory
from app.schemas.data_source import (
    DataSourceCreate,
    DataSourceResponse,
    DataSourceStats,
    DataSourceUpdate,
    SyncHistoryResponse,
    SyncTrigger,
)
from app.services.google_calendar import GoogleCalendarService
from app.services.gmail import GmailService
from app.services.google_oauth import GoogleOAuthService
from app.services.whoop import WhoopService
from app.services.strava import StravaService
from app.config import settings

router = APIRouter()


# ========== OAuth Endpoints ==========

@router.get("/oauth/google/authorize")
async def google_authorize(
    current_user: CurrentUserDep,
    redirect_uri: str = Query(..., description="Frontend callback URL"),
    service_type: str = Query(..., description="Service type: gmail or google_calendar"),
) -> dict[str, str]:
    """Initiate Google OAuth flow (unified for Calendar and Gmail)."""
    google_oauth = GoogleOAuthService()
    state = secrets.token_urlsafe(32)
    state_with_user = f"{state}:{current_user.id}:{service_type}"

    auth_url = google_oauth.create_authorization_url(
        redirect_uri=redirect_uri,
        state=state_with_user
    )

    return {
        "authorization_url": auth_url,
        "state": state_with_user
    }


@router.get("/oauth/gmail/authorize")
async def gmail_authorize(
    current_user: CurrentUserDep,
    redirect_uri: str = Query(...),
) -> dict[str, str]:
    """Redirect to unified Google OAuth."""
    return await google_authorize(current_user, redirect_uri, "gmail")


@router.get("/oauth/google-calendar/authorize")
async def google_calendar_authorize(
    current_user: CurrentUserDep,
    redirect_uri: str = Query(...),
) -> dict[str, str]:
    """Redirect to unified Google OAuth."""
    return await google_authorize(current_user, redirect_uri, "google_calendar")


@router.get("/oauth/google/callback")
async def google_oauth_callback(
    db: DatabaseDep,
    code: str = Query(...),
    state: str = Query(...),
    redirect_uri: str = Query(...),
) -> DataSourceResponse:
    """Handle unified Google OAuth callback (no auth required, validates via state)."""
    # Parse state to get user_id and service_type
    try:
        parts = state.split(":")
        user_id = int(parts[1])
        service_type = parts[2]
    except (ValueError, IndexError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state format")

    # Get user from database using state
    from app.models.user import User
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    google_oauth = GoogleOAuthService()

    try:
        token_data = await google_oauth.exchange_code_for_tokens(code=code, redirect_uri=redirect_uri)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed: {str(e)}")

    # Check if source already exists
    result = await db.execute(
        select(DataSource).where(
            DataSource.user_id == user_id,
            DataSource.source_type == service_type
        )
    )
    existing = result.scalar_one_or_none()

    service_name = "Gmail" if service_type == "gmail" else "Google Calendar"

    if existing and existing.is_active:
        existing.credentials = {
            "access_token": token_data["access_token"],
            "refresh_token": token_data["refresh_token"],
            "token_expires_at": token_data["token_expires_at"],
            "scopes": token_data.get("scopes", [])
        }
        existing.status = "active"
        existing.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing)
        return _to_response(existing)
    else:
        source = DataSource(
            user_id=user_id,
            name=service_name,
            source_type=service_type,
            credentials={
                "access_token": token_data["access_token"],
                "refresh_token": token_data["refresh_token"],
                "token_expires_at": token_data["token_expires_at"],
                "scopes": token_data.get("scopes", [])
            },
            configuration={},
            status="active",
            is_active=True,
            sync_frequency=3600,
            auto_sync=True
        )
        db.add(source)
        await db.commit()
        await db.refresh(source)

        from app.workers.tasks import sync_user_data_source
        sync_user_data_source.delay(user_id, source.id)

        return _to_response(source)


@router.get("/oauth/gmail/callback")
async def gmail_callback(
    db: DatabaseDep,
    code: str = Query(...),
    state: str = Query(...),
    redirect_uri: str = Query(...),
) -> DataSourceResponse:
    """Redirect to unified Google OAuth callback."""
    return await google_oauth_callback(db, code, state, redirect_uri)


@router.get("/oauth/google-calendar/callback")
async def google_calendar_callback(
    db: DatabaseDep,
    code: str = Query(...),
    state: str = Query(...),
    redirect_uri: str = Query(...),
) -> DataSourceResponse:
    """Redirect to unified Google OAuth callback."""
    return await google_oauth_callback(db, code, state, redirect_uri)


@router.get("/oauth/whoop/authorize")
async def whoop_authorize(
    current_user: CurrentUserDep,
    redirect_uri: str = Query(..., description="Frontend callback URL"),
) -> dict[str, str]:
    """Initiate Whoop OAuth flow."""
    whoop_service = WhoopService()
    state = secrets.token_urlsafe(32)
    state_with_user = f"{state}:{current_user.id}:whoop"

    auth_url = whoop_service.create_authorization_url(
        redirect_uri=redirect_uri,
        state=state_with_user
    )

    return {
        "authorization_url": auth_url,
        "state": state_with_user
    }


@router.get("/oauth/whoop/callback")
async def whoop_oauth_callback(
    db: DatabaseDep,
    code: str = Query(...),
    state: str = Query(...),
    redirect_uri: str = Query(...),
) -> DataSourceResponse:
    """Handle Whoop OAuth callback (no auth required, validates via state)."""
    # Parse state to get user_id
    try:
        parts = state.split(":")
        user_id = int(parts[1])
        service_type = "whoop"
    except (ValueError, IndexError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state format")

    # Get user from database using state
    from app.models.user import User
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    whoop_service = WhoopService()

    try:
        token_data = await whoop_service.exchange_code_for_tokens(code=code, redirect_uri=redirect_uri)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed: {str(e)}")

    # Check if source already exists
    result = await db.execute(
        select(DataSource).where(
            DataSource.user_id == user_id,
            DataSource.source_type == service_type
        )
    )
    existing = result.scalar_one_or_none()

    if existing and existing.is_active:
        existing.credentials = {
            "access_token": token_data["access_token"],
            "refresh_token": token_data["refresh_token"],
            "expires_in": token_data.get("expires_in"),
            "token_type": token_data.get("token_type", "Bearer")
        }
        existing.status = "active"
        existing.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing)
        return _to_response(existing)
    else:
        source = DataSource(
            user_id=user_id,
            name="Whoop",
            source_type=service_type,
            credentials={
                "access_token": token_data["access_token"],
                "refresh_token": token_data["refresh_token"],
                "expires_in": token_data.get("expires_in"),
                "token_type": token_data.get("token_type", "Bearer")
            },
            configuration={},
            status="active",
            is_active=True,
            sync_frequency=3600,
            auto_sync=True
        )
        db.add(source)
        await db.commit()
        await db.refresh(source)

        from app.workers.tasks import sync_user_data_source
        sync_user_data_source.delay(user_id, source.id)

        return _to_response(source)


@router.get("/oauth/strava/authorize")
async def strava_authorize(
    current_user: CurrentUserDep,
    redirect_uri: str = Query(..., description="Frontend callback URL"),
) -> dict[str, str]:
    """Initiate Strava OAuth flow."""
    strava_service = StravaService()
    state = secrets.token_urlsafe(32)
    state_with_user = f"{state}:{current_user.id}:strava"

    auth_url = strava_service.create_authorization_url(
        redirect_uri=redirect_uri,
        state=state_with_user
    )

    return {
        "authorization_url": auth_url,
        "state": state_with_user
    }


@router.get("/oauth/strava/callback")
async def strava_oauth_callback(
    db: DatabaseDep,
    code: str = Query(...),
    state: str = Query(...),
    redirect_uri: str = Query(...),
) -> DataSourceResponse:
    """Handle Strava OAuth callback (no auth required, validates via state)."""
    # Parse state to get user_id
    try:
        parts = state.split(":")
        user_id = int(parts[1])
        service_type = "strava"
    except (ValueError, IndexError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state format")

    # Get user from database using state
    from app.models.user import User
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    strava_service = StravaService()

    try:
        token_data = await strava_service.exchange_code_for_tokens(code=code, redirect_uri=redirect_uri)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed: {str(e)}")

    # Check if source already exists
    result = await db.execute(
        select(DataSource).where(
            DataSource.user_id == user_id,
            DataSource.source_type == service_type
        )
    )
    existing = result.scalar_one_or_none()

    athlete = token_data.get("athlete", {})
    athlete_name = f"{athlete.get('firstname', '')} {athlete.get('lastname', '')}".strip() or "Strava"

    if existing and existing.is_active:
        existing.credentials = {
            "access_token": token_data["access_token"],
            "refresh_token": token_data["refresh_token"],
            "expires_at": token_data["expires_at"],
            "athlete": athlete,
        }
        existing.status = "active"
        existing.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing)
        return _to_response(existing)
    else:
        source = DataSource(
            user_id=user_id,
            name=athlete_name,
            source_type=service_type,
            credentials={
                "access_token": token_data["access_token"],
                "refresh_token": token_data["refresh_token"],
                "expires_at": token_data["expires_at"],
                "athlete": athlete,
            },
            configuration={},
            status="active",
            is_active=True,
            sync_frequency=3600,
            auto_sync=True
        )
        db.add(source)
        await db.commit()
        await db.refresh(source)

        from app.workers.tasks import sync_user_data_source
        sync_user_data_source.delay(user_id, source.id)

        return _to_response(source)


# ========== Data Source CRUD Endpoints ==========

@router.get("/sources", response_model=list[DataSourceResponse])
async def list_data_sources(
    current_user: CurrentUserDep,
    db: DatabaseDep,
    source_type: Optional[DataSourceType] = None,
    is_active: Optional[bool] = None
) -> Any:
    """
    List user's connected data sources.

    Args:
        current_user: Current authenticated user
        db: Database session
        source_type: Optional filter by source type
        is_active: Optional filter by active status

    Returns:
        list[DataSourceResponse]: List of user's data sources
    """
    from app.models.data_source import DataRecord

    query = select(DataSource).where(
        DataSource.user_id == current_user.id
    ).order_by(DataSource.created_at.desc())

    if source_type:
        query = query.where(DataSource.source_type == source_type)

    if is_active is not None:
        query = query.where(DataSource.is_active == is_active)

    result = await db.execute(query)
    sources = result.scalars().all()

    # Get record counts for all sources
    record_counts = {}
    for source in sources:
        count_result = await db.execute(
            select(func.count()).select_from(DataRecord).where(
                DataRecord.data_source_id == source.id
            )
        )
        record_counts[source.id] = count_result.scalar_one()

    # Convert model to response (hiding credentials)
    return [_to_response(source, record_counts.get(source.id, 0)) for source in sources]


@router.get("/sources/{source_id}/records")
async def get_data_source_records(
    source_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
) -> Any:
    """
    Get data records for a specific data source.

    Args:
        source_id: Data source ID
        current_user: Current authenticated user
        db: Database session
        limit: Number of records to return
        offset: Number of records to skip

    Returns:
        list: Data records

    Raises:
        HTTPException: If data source not found or unauthorized
    """
    from app.models.data_source import DataRecord

    # Verify data source belongs to user
    result = await db.execute(
        select(DataSource).where(
            DataSource.id == source_id,
            DataSource.user_id == current_user.id
        )
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )

    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(DataRecord).where(
            DataRecord.data_source_id == source_id
        )
    )
    total = count_result.scalar_one()

    # Get data records
    records_result = await db.execute(
        select(DataRecord).where(
            DataRecord.data_source_id == source_id
        ).order_by(DataRecord.record_date.desc()).limit(limit).offset(offset)
    )
    records = records_result.scalars().all()

    return {
        "records": [
            {
                "id": r.id,
                "external_id": r.external_id,
                "record_type": r.record_type,
                "data": r.data,
                "record_date": r.record_date.isoformat(),
                "created_at": r.created_at.isoformat(),
                "updated_at": r.updated_at.isoformat()
            }
            for r in records
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/sources/{source_id}", response_model=DataSourceResponse)
async def get_data_source(
    source_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Get a specific data source.

    Args:
        source_id: Data source ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        DataSourceResponse: Data source details

    Raises:
        HTTPException: If data source not found or unauthorized
    """
    from app.models.data_source import DataRecord

    result = await db.execute(
        select(DataSource).where(
            DataSource.id == source_id,
            DataSource.user_id == current_user.id
        )
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )

    # Get record count
    count_result = await db.execute(
        select(func.count()).select_from(DataRecord).where(
            DataRecord.data_source_id == source_id
        )
    )
    record_count = count_result.scalar_one()

    return _to_response(source, record_count)


@router.post("/sources", response_model=DataSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_data_source(
    source_data: DataSourceCreate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Connect a new data source.
    In production, this would handle OAuth flow completion.

    Args:
        source_data: Data source connection data
        current_user: Current authenticated user
        db: Database session

    Returns:
        DataSourceResponse: Created data source
    """
    # Check if source already exists
    result = await db.execute(
        select(DataSource).where(
            DataSource.user_id == current_user.id,
            DataSource.source_type == source_data.source_type
        )
    )
    existing = result.scalar_one_or_none()

    if existing and existing.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Data source {source_data.source_type} already connected"
        )

    # Create new data source
    source = DataSource(
        user_id=current_user.id,
        name=source_data.display_name or source_data.source_type,
        source_type=source_data.source_type,
        credentials={
            "access_token": source_data.access_token,
            "refresh_token": source_data.refresh_token,
            "token_expires_at": source_data.token_expires_at.isoformat() if source_data.token_expires_at else None
        },
        configuration=source_data.config,
        status="active",
        is_active=True,
        sync_frequency=3600,  # Default 1 hour
        auto_sync=True
    )

    db.add(source)
    await db.commit()
    await db.refresh(source)

    # TODO: Trigger initial sync
    # from app.workers.tasks import sync_data_source_task
    # sync_data_source_task.delay(source.id)

    return _to_response(source)


@router.patch("/sources/{source_id}", response_model=DataSourceResponse)
async def update_data_source(
    source_id: int,
    source_update: DataSourceUpdate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Update a data source.

    Args:
        source_id: Data source ID
        source_update: Fields to update
        current_user: Current authenticated user
        db: Database session

    Returns:
        DataSourceResponse: Updated data source

    Raises:
        HTTPException: If data source not found or unauthorized
    """
    result = await db.execute(
        select(DataSource).where(
            DataSource.id == source_id,
            DataSource.user_id == current_user.id
        )
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )

    # Update fields
    update_data = source_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "sync_frequency_minutes" and value is not None:
            source.sync_frequency = value * 60  # Convert to seconds
        elif field == "config":
            source.configuration.update(value)
        elif field == "display_name":
            source.name = value
        elif field == "sync_enabled":
            source.auto_sync = value
        else:
            setattr(source, field, value)

    await db.commit()
    await db.refresh(source)

    return _to_response(source)


@router.delete("/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_data_source(
    source_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> None:
    """
    Disconnect a data source.

    Args:
        source_id: Data source ID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If data source not found or unauthorized
    """
    result = await db.execute(
        select(DataSource).where(
            DataSource.id == source_id,
            DataSource.user_id == current_user.id
        )
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )

    # Soft delete - mark as inactive
    source.is_active = False
    source.status = "disconnected"
    source.auto_sync = False

    await db.commit()


@router.post("/sources/{source_id}/sync", response_model=SyncHistoryResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_sync(
    source_id: int,
    sync_trigger: SyncTrigger,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Trigger manual sync of a data source.

    Args:
        source_id: Data source ID
        sync_trigger: Sync trigger options
        current_user: Current authenticated user
        db: Database session

    Returns:
        SyncHistoryResponse: Sync job details

    Raises:
        HTTPException: If data source not found or unauthorized
    """
    result = await db.execute(
        select(DataSource).where(
            DataSource.id == source_id,
            DataSource.user_id == current_user.id
        )
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )

    if not source.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data source is not active"
        )

    # Check if recent sync exists (within last 5 minutes) unless force=True
    if not sync_trigger.force and source.last_sync_at:
        from datetime import timezone
        now = datetime.now(timezone.utc)
        # Make last_sync_at timezone-aware if it isn't
        last_sync = source.last_sync_at
        if last_sync.tzinfo is None:
            last_sync = last_sync.replace(tzinfo=timezone.utc)
        time_since_sync = (now - last_sync).total_seconds()
        if time_since_sync < 300:  # 5 minutes
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {int(300 - time_since_sync)} seconds before syncing again"
            )

    # Create sync history record
    sync_record = SyncHistory(
        data_source_id=source_id,
        started_at=datetime.utcnow(),
        status="pending"
    )

    db.add(sync_record)
    await db.commit()
    await db.refresh(sync_record)

    # Trigger Celery task for actual sync
    from app.workers.tasks import sync_user_data_source
    sync_user_data_source.delay(current_user.id, source_id)

    return SyncHistoryResponse(
        id=sync_record.id,
        data_source_id=source_id,
        source_type=source.source_type,
        status="pending",
        records_processed=0,
        records_created=0,
        records_updated=0,
        records_failed=0,
        started_at=sync_record.started_at
    )


@router.get("/sync/history", response_model=list[SyncHistoryResponse])
async def get_sync_history(
    current_user: CurrentUserDep,
    db: DatabaseDep,
    source_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0
) -> Any:
    """
    Get sync history for user's data sources.

    Args:
        current_user: Current authenticated user
        db: Database session
        source_id: Optional filter by specific data source
        limit: Number of records to return
        offset: Number of records to skip

    Returns:
        list[SyncHistoryResponse]: Sync history records
    """
    # Build query to get sync history for user's data sources
    query = select(SyncHistory).join(DataSource).where(
        DataSource.user_id == current_user.id
    ).order_by(SyncHistory.started_at.desc())

    if source_id:
        query = query.where(SyncHistory.data_source_id == source_id)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query.options(selectinload(SyncHistory.data_source)))
    history = result.scalars().all()

    return [
        SyncHistoryResponse(
            id=h.id,
            data_source_id=h.data_source_id,
            source_type=h.data_source.source_type,
            status=h.status,
            records_processed=h.records_processed,
            records_created=h.records_created,
            records_updated=h.records_updated,
            records_failed=0,  # Not in model yet
            error_message=h.error_message,
            error_details=h.error_details,
            started_at=h.started_at,
            completed_at=h.completed_at,
            duration_seconds=h.duration_seconds
        )
        for h in history
    ]


@router.get("/stats", response_model=DataSourceStats)
async def get_data_source_stats(
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Get statistics for user's data sources.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        DataSourceStats: Aggregated statistics
    """
    # Get all user's data sources
    result = await db.execute(
        select(DataSource).where(
            DataSource.user_id == current_user.id
        ).options(selectinload(DataSource.sync_history))
    )
    sources = result.scalars().all()

    # Calculate stats
    total_sources = len(sources)
    active_sources = sum(1 for s in sources if s.is_active)
    connected_sources = sum(1 for s in sources if s.status == "active")

    sources_by_type = {}
    for source in sources:
        sources_by_type[source.source_type] = sources_by_type.get(source.source_type, 0) + 1

    # Get sync stats
    all_syncs = [sync for source in sources for sync in source.sync_history]
    total_syncs = len(all_syncs)
    successful_syncs = sum(1 for sync in all_syncs if sync.status == "success")
    failed_syncs = sum(1 for sync in all_syncs if sync.status == "error")

    last_sync = max([s.last_sync_at for s in sources if s.last_sync_at], default=None)

    return DataSourceStats(
        total_sources=total_sources,
        active_sources=active_sources,
        connected_sources=connected_sources,
        sources_by_type=sources_by_type,
        total_syncs=total_syncs,
        successful_syncs=successful_syncs,
        failed_syncs=failed_syncs,
        last_sync_at=last_sync
    )


def _to_response(source: DataSource, record_count: Optional[int] = None) -> DataSourceResponse:
    """
    Convert DataSource model to response schema (hiding credentials).

    Args:
        source: DataSource model
        record_count: Optional pre-calculated record count

    Returns:
        DataSourceResponse: Safe response schema
    """
    # Safely access sync_history without triggering lazy load
    try:
        # Check if sync_history is already loaded
        from sqlalchemy import inspect
        insp = inspect(source)
        sync_history_loaded = 'sync_history' in insp.dict
        total_syncs = len(source.sync_history) if sync_history_loaded else 0
    except:
        total_syncs = 0

    # Use provided record_count or try to safely access records without triggering lazy load
    if record_count is None:
        try:
            from sqlalchemy import inspect
            insp = inspect(source)
            records_loaded = 'records' in insp.dict
            record_count = len(source.records) if records_loaded else 0
        except:
            record_count = 0

    return DataSourceResponse(
        id=source.id,
        user_id=source.user_id,
        source_type=source.source_type,
        display_name=source.name,
        is_active=source.is_active,
        is_connected=(source.status == "active"),
        sync_enabled=source.auto_sync,
        sync_frequency_minutes=source.sync_frequency // 60,
        config=source.configuration,
        last_sync_at=source.last_sync_at,
        last_sync_status=source.status,
        sync_error_message=source.last_error,
        total_syncs=total_syncs,
        successful_syncs=0,  # Would need to calculate from sync_history
        failed_syncs=source.error_count,
        record_count=record_count,
        created_at=source.created_at,
        updated_at=source.updated_at
    )
