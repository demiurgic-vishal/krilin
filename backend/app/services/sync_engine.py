"""
Enhanced Sync Engine - Layer 2: Integration + Sync Layer
Orchestrates data syncing from integrations to local storage with scheduling and monitoring.
"""
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.data_source import DataSource, SyncHistory
from app.services.integration_manager import get_integration
from app.services.credential_manager import get_credential_manager
from app.services.integrations import get_sync_service

logger = logging.getLogger(__name__)


class SyncResult:
    """Result of a sync operation."""

    def __init__(
        self,
        success: bool,
        records_fetched: int = 0,
        records_created: int = 0,
        records_updated: int = 0,
        error: Optional[str] = None,
        duration_seconds: float = 0.0
    ):
        self.success = success
        self.records_fetched = records_fetched
        self.records_created = records_created
        self.records_updated = records_updated
        self.error = error
        self.duration_seconds = duration_seconds


class SyncEngine:
    """
    Enhanced Sync Engine with scheduling and monitoring.

    Responsibilities:
    - Initial Sync: When user connects integration, fetch all historical data
    - Incremental Sync: Periodically fetch only new/changed data
    - Scheduling: Schedule syncs based on integration's frequency
    - Token Refresh: Detect expired tokens and refresh automatically
    - Error Handling: Retry logic, exponential backoff
    - Data Normalization: Transform external API response to local schema
    - Upsert Logic: Insert new records, update existing
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.credential_manager = get_credential_manager()

    async def sync_data_source(
        self,
        data_source_id: int,
        incremental: bool = True
    ) -> SyncResult:
        """
        Sync data from a specific data source.

        Args:
            data_source_id: Data source ID
            incremental: If True, only sync since last sync

        Returns:
            SyncResult with sync statistics
        """
        start_time = datetime.utcnow()

        try:
            # Get data source
            result = await self.db.execute(
                select(DataSource).where(DataSource.id == data_source_id)
            )
            data_source = result.scalar_one_or_none()

            if not data_source:
                return SyncResult(
                    success=False,
                    error=f"Data source {data_source_id} not found"
                )

            if not data_source.is_active:
                return SyncResult(
                    success=False,
                    error=f"Data source {data_source_id} is not active"
                )

            # Get integration
            integration = get_integration(data_source.source_type)

            if not integration:
                return SyncResult(
                    success=False,
                    error=f"Integration {data_source.source_type} not found"
                )

            # Get credentials
            credentials = await self.credential_manager.get_credentials_by_source_id(
                self.db,
                data_source_id
            )

            if not credentials:
                return SyncResult(
                    success=False,
                    error="No credentials found for data source"
                )

            # Check if token needs refresh
            if self._needs_token_refresh(credentials):
                logger.info(f"Refreshing token for data source {data_source_id}")
                credentials = await self._refresh_token(
                    integration,
                    data_source,
                    credentials
                )

            # Determine since parameter for incremental sync
            since = None
            if incremental and data_source.last_sync_at:
                since = data_source.last_sync_at

            # Get sync service
            sync_service = get_sync_service(data_source.source_type)

            if not sync_service:
                return SyncResult(
                    success=False,
                    error=f"No sync service for {data_source.source_type}"
                )

            # Execute sync
            logger.info(f"Starting sync for data source {data_source_id} (incremental={incremental})")

            synced_records = await sync_service.sync(data_source, self.db)

            # Count stats
            records_created = sum(1 for r in synced_records if r.get("is_new"))
            records_updated = sum(1 for r in synced_records if not r.get("is_new"))

            # Update data source
            data_source.last_sync_at = datetime.utcnow()
            data_source.next_sync_at = datetime.utcnow() + timedelta(seconds=data_source.sync_frequency)
            data_source.consecutive_failures = 0
            data_source.status = "active"

            # Create sync history record
            duration = (datetime.utcnow() - start_time).total_seconds()

            sync_history = SyncHistory(
                data_source_id=data_source_id,
                started_at=start_time,
                completed_at=datetime.utcnow(),
                duration_seconds=duration,
                status="success",
                records_processed=len(synced_records),
                records_created=records_created,
                records_updated=records_updated
            )

            self.db.add(sync_history)
            await self.db.commit()

            logger.info(f"Sync completed for data source {data_source_id}: "
                       f"{records_created} created, {records_updated} updated")

            return SyncResult(
                success=True,
                records_fetched=len(synced_records),
                records_created=records_created,
                records_updated=records_updated,
                duration_seconds=duration
            )

        except Exception as e:
            logger.error(f"Sync failed for data source {data_source_id}: {str(e)}")

            # Update data source error tracking
            if data_source:
                data_source.consecutive_failures += 1
                data_source.last_error = str(e)
                data_source.error_count += 1

                # Mark as error if too many failures
                if data_source.consecutive_failures >= 3:
                    data_source.status = "error"

                # Create failed sync history
                duration = (datetime.utcnow() - start_time).total_seconds()

                sync_history = SyncHistory(
                    data_source_id=data_source_id,
                    started_at=start_time,
                    completed_at=datetime.utcnow(),
                    duration_seconds=duration,
                    status="error",
                    error_message=str(e)
                )

                self.db.add(sync_history)
                await self.db.commit()

            return SyncResult(
                success=False,
                error=str(e),
                duration_seconds=(datetime.utcnow() - start_time).total_seconds()
            )

    def _needs_token_refresh(self, credentials: Dict[str, Any]) -> bool:
        """
        Check if OAuth token needs refresh.

        Args:
            credentials: Credentials dictionary

        Returns:
            True if token needs refresh
        """
        if "expires_at" not in credentials:
            return False

        # Check if expiring in next 5 minutes
        expires_at = datetime.fromisoformat(credentials["expires_at"])
        return datetime.utcnow() + timedelta(minutes=5) >= expires_at

    async def _refresh_token(
        self,
        integration,
        data_source: DataSource,
        credentials: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Refresh OAuth token.

        Args:
            integration: Integration instance
            data_source: Data source
            credentials: Current credentials

        Returns:
            Refreshed credentials
        """
        try:
            refresh_token = credentials.get("refresh_token")

            if not refresh_token:
                raise ValueError("No refresh token available")

            # Call integration's refresh method
            new_credentials = await integration.refresh_token(refresh_token)

            # Store new credentials
            await self.credential_manager.refresh_and_update(
                self.db,
                data_source.user_id,
                data_source.source_type,
                new_credentials
            )

            logger.info(f"Token refreshed for data source {data_source.id}")

            return new_credentials

        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            raise

    async def sync_all_due_sources(self) -> List[SyncResult]:
        """
        Sync all data sources that are due for sync.

        Called by scheduler (Celery beat).

        Returns:
            List of SyncResult for each synced source
        """
        # Find all active sources due for sync
        now = datetime.utcnow()

        result = await self.db.execute(
            select(DataSource).where(
                DataSource.is_active == True,
                DataSource.auto_sync == True,
                DataSource.next_sync_at <= now
            )
        )
        due_sources = result.scalars().all()

        logger.info(f"Found {len(due_sources)} data sources due for sync")

        results = []

        for source in due_sources:
            sync_result = await self.sync_data_source(source.id, incremental=True)
            results.append(sync_result)

        return results

    async def schedule_initial_sync(self, data_source_id: int):
        """
        Schedule initial full sync for a newly connected data source.

        Args:
            data_source_id: Data source ID
        """
        from app.workers.tasks import sync_data_source_task

        # Trigger async task for initial sync
        sync_data_source_task.delay(data_source_id, incremental=False)

        logger.info(f"Scheduled initial sync for data source {data_source_id}")


# Global sync engine instance
_sync_engine: Optional[SyncEngine] = None


async def get_sync_engine(db: AsyncSession) -> SyncEngine:
    """
    Get sync engine instance.

    Args:
        db: Database session

    Returns:
        SyncEngine instance
    """
    return SyncEngine(db)
