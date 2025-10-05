"""
Celery background tasks for Krilin AI.
Handles data synchronization, reminders, and AI analysis.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

from celery import current_task
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.data_source import DataSource, DataRecord, SyncHistory
from app.models.goal import Goal, Reminder
from app.models.user import User
# TODO: Update to use App models when app execution is implemented
# from app.models.marketplace import App, AppInstallation
from app.workers.celery_app import celery_app

# Import all models to ensure relationships are properly configured
from app.models import user, conversation, goal, data_source, community, marketplace


def utcnow():
    """Get current UTC time with timezone info."""
    return datetime.now(timezone.utc)


# ========== Data Source Synchronization ==========

@celery_app.task(bind=True)
def sync_all_data_sources(self):
    """
    Sync all active data sources.
    Runs hourly via Celery Beat.
    """
    import asyncio
    return asyncio.run(_sync_all_data_sources_async())


async def _sync_all_data_sources_async() -> dict[str, Any]:
    """Async implementation of syncing all data sources."""
    async with AsyncSessionLocal() as db:
        now = utcnow()

        # Find sources due for sync
        result = await db.execute(
            select(DataSource).where(
                DataSource.is_active == True,
                DataSource.auto_sync == True,
                DataSource.status == "active"
            )
        )
        sources = result.scalars().all()

        synced_count = 0

        for source in sources:
            # Check if sync is due
            if source.last_sync_at:
                next_sync = source.last_sync_at + timedelta(seconds=source.sync_frequency)
                if now < next_sync:
                    continue

            # Trigger individual sync
            sync_user_data_source.delay(source.user_id, source.id)
            synced_count += 1

        return {"status": "success", "sources_triggered": synced_count}


@celery_app.task(bind=True)
def sync_user_data_source(self, user_id: int, data_source_id: int):
    """
    Sync a specific user's data source.

    Args:
        user_id: User ID
        data_source_id: Data source ID
    """
    import asyncio
    return asyncio.run(_sync_user_data_source_async(data_source_id))


async def _sync_user_data_source_async(data_source_id: int) -> dict[str, Any]:
    """Async implementation of individual data source sync."""
    # Import here to get fresh session in each task
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        # Get data source
        result = await db.execute(
            select(DataSource).where(DataSource.id == data_source_id)
        )
        source = result.scalar_one_or_none()

        if not source:
            return {"error": "Data source not found"}

        # Create sync history record
        sync_record = SyncHistory(
            data_source_id=data_source_id,
            started_at=utcnow(),
            status="running"
        )
        db.add(sync_record)
        await db.commit()
        await db.refresh(sync_record)

        try:
            # Import appropriate sync service
            from app.services.integrations import get_sync_service

            sync_service = get_sync_service(source.source_type)

            if not sync_service:
                raise Exception(f"No sync service for {source.source_type}")

            # Perform sync
            records = await sync_service.sync(source, db)

            # Update sync record
            sync_record.status = "success"
            sync_record.completed_at = utcnow()
            sync_record.duration_seconds = (
                sync_record.completed_at - sync_record.started_at
            ).total_seconds()
            sync_record.records_processed = len(records)
            sync_record.records_created = sum(1 for r in records if r.get("is_new"))
            sync_record.records_updated = sum(1 for r in records if not r.get("is_new"))

            # Update data source
            source.last_sync_at = utcnow()
            source.consecutive_failures = 0

            await db.commit()

            return {
                "status": "success",
                "records_processed": len(records),
                "source_type": source.source_type
            }

        except Exception as e:
            # Update sync record with error
            sync_record.status = "error"
            sync_record.error_message = str(e)
            sync_record.completed_at = utcnow()
            sync_record.duration_seconds = (
                sync_record.completed_at - sync_record.started_at
            ).total_seconds()

            # Update data source error tracking
            source.consecutive_failures += 1
            source.last_error = str(e)
            source.error_count += 1

            if source.consecutive_failures >= 3:
                source.status = "error"

            await db.commit()

            return {"status": "error", "error": str(e)}


# ========== Reminder Processing ==========

@celery_app.task(bind=True)
def process_morning_reminders(self):
    """
    Process morning reminders for all users.
    Runs daily at 7 AM via Celery Beat.
    """
    import asyncio
    return asyncio.run(_process_morning_reminders_async())


async def _process_morning_reminders_async() -> dict[str, Any]:
    """Generate and send morning reminders."""
    async with AsyncSessionLocal() as db:
        now = utcnow()

        # Find reminders scheduled for morning
        result = await db.execute(
            select(Reminder).where(
                Reminder.is_sent == False,
                Reminder.scheduled_for <= now,
                Reminder.time_of_day == "morning"
            )
        )
        reminders = result.scalars().all()

        sent_count = 0

        for reminder in reminders:
            try:
                # TODO: Implement actual notification sending
                # - Email via SendGrid/AWS SES
                # - Push notification via FCM
                # - SMS via Twilio

                reminder.is_sent = True
                reminder.sent_at = now
                sent_count += 1

            except Exception as e:
                print(f"Failed to send reminder {reminder.id}: {e}")

        await db.commit()

        return {"status": "success", "reminders_sent": sent_count}


# ========== Goal Analysis ==========

@celery_app.task(bind=True)
def analyze_goal_progress(self):
    """
    Analyze goal progress for all active goals.
    Runs daily via Celery Beat.
    """
    import asyncio
    return asyncio.run(_analyze_goal_progress_async())


async def _analyze_goal_progress_async() -> dict[str, Any]:
    """Use AI agents to analyze goal progress."""
    async with AsyncSessionLocal() as db:
        # Find active goals
        result = await db.execute(
            select(Goal).where(Goal.status == "active")
        )
        goals = result.scalars().all()

        analyzed_count = 0

        for goal in goals:
            try:
                # TODO: Use AI agent to analyze
                # - Progress patterns
                # - Suggest adjustments
                # - Identify obstacles
                # - Generate insights

                analyzed_count += 1

            except Exception as e:
                print(f"Failed to analyze goal {goal.id}: {e}")

        return {"status": "success", "goals_analyzed": analyzed_count}


@celery_app.task(bind=True)
def update_goal_progress_from_data(self, user_id: int, goal_id: int):
    """
    Update goal progress based on connected data sources.

    Args:
        user_id: User ID
        goal_id: Goal ID
    """
    import asyncio
    return asyncio.run(_update_goal_progress_from_data_async(user_id, goal_id))


async def _update_goal_progress_from_data_async(user_id: int, goal_id: int) -> dict[str, Any]:
    """Analyze data for progress indicators."""
    async with AsyncSessionLocal() as db:
        # Get goal
        result = await db.execute(
            select(Goal).where(
                Goal.id == goal_id,
                Goal.user_id == user_id
            )
        )
        goal = result.scalar_one_or_none()

        if not goal:
            return {"error": "Goal not found"}

        # Get recent data records
        seven_days_ago = utcnow() - timedelta(days=7)

        data_result = await db.execute(
            select(DataRecord).where(
                DataRecord.user_id == user_id,
                DataRecord.record_date >= seven_days_ago
            )
        )
        records = data_result.scalars().all()

        try:
            # TODO: Analyze data for progress
            # - Fitness goals from health data
            # - Learning goals from calendar
            # - Social goals from communication

            return {"status": "success", "records_analyzed": len(records)}

        except Exception as e:
            return {"status": "error", "error": str(e)}


# ========== Email Parsing ==========

@celery_app.task(bind=True)
def parse_email_for_expenses(self, user_id: int, email_data: dict):
    """
    Parse emails for expense tracking.

    Args:
        user_id: User ID
        email_data: Email content and metadata
    """
    import asyncio
    return asyncio.run(_parse_email_for_expenses_async(user_id, email_data))


async def _parse_email_for_expenses_async(user_id: int, email_data: dict) -> dict[str, Any]:
    """Use AI to extract expense information from emails."""
    try:
        # TODO: Implement AI-based email parsing
        # - Purchase amounts
        # - Merchant names
        # - Categories
        # - Dates

        return {"status": "success", "expenses_found": 0}

    except Exception as e:
        return {"status": "error", "error": str(e)}


# ========== News Aggregation ==========

@celery_app.task(bind=True)
def generate_news_aggregation(self, user_id: int):
    """
    Generate personalized news aggregation.

    Args:
        user_id: User ID
    """
    import asyncio
    return asyncio.run(_generate_news_aggregation_async(user_id))


async def _generate_news_aggregation_async(user_id: int) -> dict[str, Any]:
    """Generate personalized news based on goals and interests."""
    async with AsyncSessionLocal() as db:
        # Get user's active goals
        result = await db.execute(
            select(Goal).where(
                Goal.user_id == user_id,
                Goal.status == "active"
            )
        )
        goals = result.scalars().all()

        try:
            # TODO: Fetch and aggregate news
            # - Use News API
            # - Filter by user interests
            # - Summarize content
            # - Store recommendations

            return {"status": "success", "articles_found": 0}

        except Exception as e:
            return {"status": "error", "error": str(e)}


# ========== App Execution ==========
# TODO: Implement app execution for marketplace apps
# This will handle running user-installed apps with UI, state, and custom logic

# @celery_app.task(bind=True)
# def execute_user_app(self, app_id: int, execution_id: int):
#     """
#     Execute a user's installed app.
#
#     Args:
#         app_id: App installation ID
#         execution_id: Execution record ID
#     """
#     pass


# ========== Book Search ==========

@celery_app.task(bind=True)
def find_libgen_books(self, search_query: str, user_id: int, goal_id: int = None):
    """
    Search for books on libgen based on user goals.

    Args:
        search_query: Search terms
        user_id: User ID
        goal_id: Optional goal ID to associate books with
    """
    import asyncio
    return asyncio.run(_find_libgen_books_async(search_query, user_id, goal_id))


async def _find_libgen_books_async(search_query: str, user_id: int, goal_id: int = None) -> dict[str, Any]:
    """Search libgen for relevant books."""
    try:
        # TODO: Implement libgen search
        # - Query libgen API
        # - Parse results
        # - Filter by relevance
        # - Store recommendations

        return {"status": "success", "books_found": 0}

    except Exception as e:
        return {"status": "error", "error": str(e)}


# ========== Data Source Sync (for New Platform) ==========

@celery_app.task(bind=True)
def sync_data_source_task(self, data_source_id: int, incremental: bool = True):
    """
    Sync a data source (used by sync engine).

    Args:
        data_source_id: Data source ID
        incremental: If True, only sync since last sync
    """
    import asyncio
    return asyncio.run(_sync_data_source_task_async(data_source_id, incremental))


async def _sync_data_source_task_async(data_source_id: int, incremental: bool) -> dict[str, Any]:
    """Async implementation of data source sync."""
    from app.services.sync_engine import get_sync_engine

    async with AsyncSessionLocal() as db:
        sync_engine = await get_sync_engine(db)
        result = await sync_engine.sync_data_source(data_source_id, incremental)

        return {
            "success": result.success,
            "records_fetched": result.records_fetched,
            "records_created": result.records_created,
            "records_updated": result.records_updated,
            "error": result.error
        }


# ========== Celery Beat Schedule ==========

@celery_app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    """Setup periodic tasks using Celery Beat."""

    # Sync all data sources every hour
    sender.add_periodic_task(
        3600.0,  # 1 hour
        sync_all_data_sources.s(),
        name='sync-all-data-sources-hourly'
    )

    # Process morning reminders at 7 AM UTC (adjust for timezone)
    sender.add_periodic_task(
        86400.0,  # Daily
        process_morning_reminders.s(),
        name='process-morning-reminders-daily'
    )

    # Analyze goal progress daily
    sender.add_periodic_task(
        86400.0,  # Daily
        analyze_goal_progress.s(),
        name='analyze-goal-progress-daily'
    )
