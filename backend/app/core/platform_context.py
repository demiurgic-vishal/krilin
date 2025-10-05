"""
Platform Context System - The heart of the app platform.

Every app receives a PlatformContext (ctx) object that provides:
- Scoped storage API (ctx.storage)
- App communication API (ctx.apps)
- Integration access API (ctx.integrations)
- Real-time streams API (ctx.streams)
- Notification, file, scheduling, and AI APIs
- User information and app metadata

All operations are automatically scoped to the current user and app.
"""
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class UserInfo(BaseModel):
    """Current user information available in context."""
    id: int
    email: str
    full_name: Optional[str] = None
    timezone: str = "UTC"
    preferences: Dict[str, Any] = {}


class PlatformContext:
    """
    Platform Context provided to every app.

    This is the primary interface apps use to interact with the platform.
    All operations are automatically scoped to the current user and app.

    Example usage in app code:
    ```python
    async def get_habits(ctx: PlatformContext):
        # All queries automatically scoped to current user
        habits = await ctx.storage.query("habits", where={"active": True})
        return habits
    ```
    """

    def __init__(
        self,
        user_id: int,
        app_id: str,
        db: AsyncSession,
        user_info: Optional[UserInfo] = None
    ):
        self.user_id = user_id
        self.app_id = app_id
        self._db = db
        self._user_info = user_info

        # Initialize API interfaces (lazy loaded)
        self._storage = None
        self._apps = None
        self._integrations = None
        self._streams = None
        self._notifications = None
        self._files = None
        self._schedule = None
        self._ai = None

    # User information
    @property
    def user(self) -> UserInfo:
        """Get current user information."""
        if not self._user_info:
            raise ValueError("User info not loaded in context")
        return self._user_info

    # Storage API - Lazy loaded
    @property
    def storage(self):
        """Get storage API for database operations."""
        if self._storage is None:
            from app.core.storage_api import StorageAPI
            self._storage = StorageAPI(
                db=self._db,
                user_id=self.user_id,
                app_id=self.app_id
            )
        return self._storage

    # Apps API - Lazy loaded
    @property
    def apps(self):
        """Get apps API for inter-app communication."""
        if self._apps is None:
            from app.core.apps_api import AppsAPI
            self._apps = AppsAPI(
                db=self._db,
                user_id=self.user_id,
                app_id=self.app_id,
                context=self
            )
        return self._apps

    # Integrations API - Lazy loaded
    @property
    def integrations(self):
        """Get integrations API for external service access."""
        if self._integrations is None:
            from app.core.integrations_api import IntegrationsAPI
            self._integrations = IntegrationsAPI(
                db=self._db,
                user_id=self.user_id,
                app_id=self.app_id
            )
        return self._integrations

    # Streams API - Lazy loaded
    @property
    def streams(self):
        """Get streams API for real-time communication."""
        if self._streams is None:
            from app.core.streams_api import StreamsAPI
            self._streams = StreamsAPI(
                user_id=self.user_id,
                app_id=self.app_id
            )
        return self._streams

    # Notifications API - Lazy loaded
    @property
    def notifications(self):
        """Get notifications API."""
        if self._notifications is None:
            from app.core.notifications_api import NotificationsAPI
            self._notifications = NotificationsAPI(
                db=self._db,
                user_id=self.user_id,
                app_id=self.app_id
            )
        return self._notifications

    # Files API - Lazy loaded
    @property
    def files(self):
        """Get files API for file storage operations."""
        if self._files is None:
            from app.core.files_api import FilesAPI
            self._files = FilesAPI(
                user_id=self.user_id,
                app_id=self.app_id
            )
        return self._files

    # Schedule API - Lazy loaded
    @property
    def schedule(self):
        """Get schedule API for background jobs."""
        if self._schedule is None:
            from app.core.schedule_api import ScheduleAPI
            self._schedule = ScheduleAPI(
                user_id=self.user_id,
                app_id=self.app_id
            )
        return self._schedule

    # AI API - Lazy loaded
    @property
    def ai(self):
        """Get AI API for Claude completions."""
        if self._ai is None:
            from app.core.ai_api import AIAPI
            self._ai = AIAPI(user_id=self.user_id, app_id=self.app_id)
        return self._ai

    # Utility methods
    def generate_id(self) -> str:
        """Generate a unique ID."""
        import uuid
        return str(uuid.uuid4())

    def log(self, message: str, level: str = "info", **kwargs):
        """Structured logging for app operations."""
        log_data = {
            "app_id": self.app_id,
            "user_id": self.user_id,
            "message": message,
            **kwargs
        }

        if level == "debug":
            logger.debug(f"[APP:{self.app_id}] {message}", extra=log_data)
        elif level == "info":
            logger.info(f"[APP:{self.app_id}] {message}", extra=log_data)
        elif level == "warning":
            logger.warning(f"[APP:{self.app_id}] {message}", extra=log_data)
        elif level == "error":
            logger.error(f"[APP:{self.app_id}] {message}", extra=log_data)

    def now(self) -> datetime:
        """Get current datetime in user's timezone."""
        # TODO: Implement timezone awareness
        return datetime.utcnow()

    def __repr__(self) -> str:
        return f"<PlatformContext(user_id={self.user_id}, app_id='{self.app_id}')>"
