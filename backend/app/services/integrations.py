"""
Data integration services for external sources.
Handles OAuth and data synchronization for various services.
"""
from abc import ABC, abstractmethod
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.data_source import DataSource, DataRecord


class BaseSyncService(ABC):
    """Base class for data synchronization services."""

    @abstractmethod
    async def sync(self, source: DataSource, db: AsyncSession) -> list[dict[str, Any]]:
        """
        Sync data from external source.

        Args:
            source: Data source configuration
            db: Database session

        Returns:
            list: Synced records with metadata
        """
        pass


class GoogleCalendarSync(BaseSyncService):
    """Google Calendar synchronization service."""

    async def sync(self, source: DataSource, db: AsyncSession) -> list[dict[str, Any]]:
        """
        Sync Google Calendar events.

        Args:
            source: Data source with OAuth credentials
            db: Database session

        Returns:
            list: Synced records with metadata
        """
        from datetime import datetime
        from sqlalchemy import select as sa_select
        from app.services.google_calendar import GoogleCalendarService

        google_service = GoogleCalendarService()

        # Fetch calendar events
        try:
            events = await google_service.fetch_calendar_events(
                credentials_dict=source.credentials,
                days_back=7,
                days_forward=30
            )
        except Exception as e:
            raise Exception(f"Failed to fetch Google Calendar events: {str(e)}")

        synced_records = []

        for event_data in events:
            # Check if record already exists
            result = await db.execute(
                sa_select(DataRecord).where(
                    DataRecord.data_source_id == source.id,
                    DataRecord.external_id == event_data["external_id"]
                )
            )
            existing_record = result.scalar_one_or_none()

            if existing_record:
                # Update existing record
                existing_record.data = event_data
                existing_record.updated_at = datetime.utcnow()
                synced_records.append({"is_new": False, "record_id": existing_record.id})
            else:
                # Create new record
                record = DataRecord(
                    data_source_id=source.id,
                    user_id=source.user_id,
                    external_id=event_data["external_id"],
                    record_type="calendar_event",
                    data=event_data,
                    record_date=datetime.fromisoformat(event_data["start_time"].replace("Z", "+00:00")) if event_data.get("start_time") else datetime.utcnow()
                )
                db.add(record)
                await db.flush()
                synced_records.append({"is_new": True, "record_id": record.id})

        await db.commit()

        return synced_records


class GmailSync(BaseSyncService):
    """Gmail synchronization service."""

    async def sync(self, source: DataSource, db: AsyncSession) -> list[dict[str, Any]]:
        """Sync Gmail messages."""
        from datetime import datetime
        from sqlalchemy import select as sa_select
        from app.services.gmail import GmailService

        gmail_service = GmailService()

        # Fetch emails
        try:
            emails = await gmail_service.fetch_emails(
                credentials_dict=source.credentials,
                max_results=50,
                query="newer_than:7d"  # Last 7 days
            )
        except Exception as e:
            raise Exception(f"Failed to fetch Gmail messages: {str(e)}")

        synced_records = []

        for email_data in emails:
            # Check if record already exists
            result = await db.execute(
                sa_select(DataRecord).where(
                    DataRecord.data_source_id == source.id,
                    DataRecord.external_id == email_data["external_id"]
                )
            )
            existing_record = result.scalar_one_or_none()

            if existing_record:
                # Update existing record
                existing_record.data = email_data
                existing_record.updated_at = datetime.utcnow()
                synced_records.append({"is_new": False, "record_id": existing_record.id})
            else:
                # Create new record
                record = DataRecord(
                    data_source_id=source.id,
                    user_id=source.user_id,
                    external_id=email_data["external_id"],
                    record_type="email",
                    data=email_data,
                    record_date=datetime.utcnow()
                )
                db.add(record)
                await db.flush()
                synced_records.append({"is_new": True, "record_id": record.id})

        await db.commit()

        return synced_records


class WhoopSync(BaseSyncService):
    """Whoop fitness tracker synchronization service."""

    async def sync(self, source: DataSource, db: AsyncSession) -> list[dict[str, Any]]:
        """Sync Whoop fitness data (recovery, sleep, workouts, cycles)."""
        from datetime import datetime
        from sqlalchemy import select as sa_select
        from app.services.whoop import WhoopService

        whoop_service = WhoopService()
        synced_records = []

        try:
            # Fetch all Whoop data types
            recovery_data = await whoop_service.fetch_recovery_data(
                credentials_dict=source.credentials,
                days_back=7
            )
            sleep_data = await whoop_service.fetch_sleep_data(
                credentials_dict=source.credentials,
                days_back=7
            )
            workout_data = await whoop_service.fetch_workout_data(
                credentials_dict=source.credentials,
                days_back=7
            )
            cycle_data = await whoop_service.fetch_cycle_data(
                credentials_dict=source.credentials,
                days_back=7
            )

            # Process recovery data
            for recovery in recovery_data:
                record_id = recovery.get("id")
                if not record_id:
                    continue

                result = await db.execute(
                    sa_select(DataRecord).where(
                        DataRecord.data_source_id == source.id,
                        DataRecord.external_id == str(record_id)
                    )
                )
                existing_record = result.scalar_one_or_none()

                recovery_date_str = recovery.get("created_at") or recovery.get("updated_at")
                recovery_date = datetime.fromisoformat(recovery_date_str.replace("Z", "+00:00")) if recovery_date_str else datetime.utcnow()

                if existing_record:
                    existing_record.data = recovery
                    existing_record.updated_at = datetime.utcnow()
                    synced_records.append({"is_new": False, "record_id": existing_record.id})
                else:
                    record = DataRecord(
                        data_source_id=source.id,
                        user_id=source.user_id,
                        external_id=str(record_id),
                        record_type="whoop_recovery",
                        data=recovery,
                        record_date=recovery_date
                    )
                    db.add(record)
                    await db.flush()
                    synced_records.append({"is_new": True, "record_id": record.id})

            # Process sleep data
            for sleep in sleep_data:
                record_id = sleep.get("id")
                if not record_id:
                    continue

                result = await db.execute(
                    sa_select(DataRecord).where(
                        DataRecord.data_source_id == source.id,
                        DataRecord.external_id == str(record_id)
                    )
                )
                existing_record = result.scalar_one_or_none()

                sleep_date_str = sleep.get("start") or sleep.get("created_at")
                sleep_date = datetime.fromisoformat(sleep_date_str.replace("Z", "+00:00")) if sleep_date_str else datetime.utcnow()

                if existing_record:
                    existing_record.data = sleep
                    existing_record.updated_at = datetime.utcnow()
                    synced_records.append({"is_new": False, "record_id": existing_record.id})
                else:
                    record = DataRecord(
                        data_source_id=source.id,
                        user_id=source.user_id,
                        external_id=str(record_id),
                        record_type="whoop_sleep",
                        data=sleep,
                        record_date=sleep_date
                    )
                    db.add(record)
                    await db.flush()
                    synced_records.append({"is_new": True, "record_id": record.id})

            # Process workout data
            for workout in workout_data:
                record_id = workout.get("id")
                if not record_id:
                    continue

                result = await db.execute(
                    sa_select(DataRecord).where(
                        DataRecord.data_source_id == source.id,
                        DataRecord.external_id == str(record_id)
                    )
                )
                existing_record = result.scalar_one_or_none()

                workout_date_str = workout.get("start") or workout.get("created_at")
                workout_date = datetime.fromisoformat(workout_date_str.replace("Z", "+00:00")) if workout_date_str else datetime.utcnow()

                if existing_record:
                    existing_record.data = workout
                    existing_record.updated_at = datetime.utcnow()
                    synced_records.append({"is_new": False, "record_id": existing_record.id})
                else:
                    record = DataRecord(
                        data_source_id=source.id,
                        user_id=source.user_id,
                        external_id=str(record_id),
                        record_type="whoop_workout",
                        data=workout,
                        record_date=workout_date
                    )
                    db.add(record)
                    await db.flush()
                    synced_records.append({"is_new": True, "record_id": record.id})

            # Process cycle data
            for cycle in cycle_data:
                record_id = cycle.get("id")
                if not record_id:
                    continue

                result = await db.execute(
                    sa_select(DataRecord).where(
                        DataRecord.data_source_id == source.id,
                        DataRecord.external_id == str(record_id)
                    )
                )
                existing_record = result.scalar_one_or_none()

                cycle_date_str = cycle.get("start") or cycle.get("created_at")
                cycle_date = datetime.fromisoformat(cycle_date_str.replace("Z", "+00:00")) if cycle_date_str else datetime.utcnow()

                if existing_record:
                    existing_record.data = cycle
                    existing_record.updated_at = datetime.utcnow()
                    synced_records.append({"is_new": False, "record_id": existing_record.id})
                else:
                    record = DataRecord(
                        data_source_id=source.id,
                        user_id=source.user_id,
                        external_id=str(record_id),
                        record_type="whoop_cycle",
                        data=cycle,
                        record_date=cycle_date
                    )
                    db.add(record)
                    await db.flush()
                    synced_records.append({"is_new": True, "record_id": record.id})

            await db.commit()

        except Exception as e:
            raise Exception(f"Failed to fetch Whoop data: {str(e)}")

        return synced_records


class AppleHealthSync(BaseSyncService):
    """Apple Health synchronization service."""

    async def sync(self, source: DataSource, db: AsyncSession) -> list[dict[str, Any]]:
        """Sync Apple Health data."""
        # TODO: Implement Apple Health integration
        # - Parse HealthKit export
        # - Or use HealthKit API if available
        # - Store in DataRecord
        return []


class StravaSync(BaseSyncService):
    """Strava synchronization service."""

    async def sync(self, source: DataSource, db: AsyncSession) -> list[dict[str, Any]]:
        """Sync Strava activities."""
        from datetime import datetime
        from sqlalchemy import select as sa_select
        from app.services.strava import StravaService

        strava_service = StravaService()
        synced_records = []

        try:
            # Fetch activities from last 30 days
            activities = await strava_service.fetch_activities(
                credentials_dict=source.credentials,
                days_back=30
            )

            for activity in activities:
                external_id = activity["external_id"]

                # Check if record already exists
                result = await db.execute(
                    sa_select(DataRecord).where(
                        DataRecord.data_source_id == source.id,
                        DataRecord.external_id == external_id
                    )
                )
                existing_record = result.scalar_one_or_none()

                # Parse activity date
                activity_date_str = activity.get("start_date") or activity.get("start_date_local")
                activity_date = datetime.fromisoformat(activity_date_str.replace("Z", "+00:00")) if activity_date_str else datetime.utcnow()

                if existing_record:
                    # Update existing record
                    existing_record.data = activity
                    existing_record.updated_at = datetime.utcnow()
                    synced_records.append({"is_new": False, "record_id": existing_record.id})
                else:
                    # Create new record
                    record = DataRecord(
                        data_source_id=source.id,
                        user_id=source.user_id,
                        external_id=external_id,
                        record_type="strava_activity",
                        data=activity,
                        record_date=activity_date
                    )
                    db.add(record)
                    await db.flush()
                    synced_records.append({"is_new": True, "record_id": record.id})

            await db.commit()

        except Exception as e:
            raise Exception(f"Failed to fetch Strava activities: {str(e)}")

        return synced_records


class CreditCardSync(BaseSyncService):
    """Credit card transaction synchronization service."""

    async def sync(self, source: DataSource, db: AsyncSession) -> list[dict[str, Any]]:
        """Sync credit card transactions."""
        # TODO: Implement bank/card API integration
        # - Use Plaid or similar
        # - Fetch transactions
        # - Categorize and store
        return []


class NewsAPISync(BaseSyncService):
    """News API synchronization service."""

    async def sync(self, source: DataSource, db: AsyncSession) -> list[dict[str, Any]]:
        """Sync news articles."""
        # TODO: Implement News API integration
        # - Fetch articles based on user interests
        # - Summarize with AI
        # - Store recommendations
        return []


def get_sync_service(source_type: str) -> Optional[BaseSyncService]:
    """
    Get appropriate sync service for data source type.

    Args:
        source_type: Type of data source

    Returns:
        BaseSyncService: Sync service instance or None
    """
    services = {
        "google_calendar": GoogleCalendarSync(),
        "gmail": GmailSync(),
        "whoop": WhoopSync(),
        "apple_health": AppleHealthSync(),
        "strava": StravaSync(),
        "credit_card": CreditCardSync(),
        "news_api": NewsAPISync(),
    }

    return services.get(source_type)
