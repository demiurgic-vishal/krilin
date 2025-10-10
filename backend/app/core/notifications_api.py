"""
Notifications API for apps - Send notifications to users.

Apps can use ctx.notifications to send various types of notifications:
- In-app notifications
- Push notifications (future)
- Email notifications (future)
"""
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert

logger = logging.getLogger(__name__)


class NotificationsAPI:
    """
    Notifications API for sending user notifications.

    Example usage in app code:
    ```python
    await ctx.notifications.send(
        "Task completed!",
        body="Great job on finishing your workout!",
        priority="high"
    )
    ```
    """

    def __init__(self, db: AsyncSession, user_id: int, app_id: str):
        self.db = db
        self.user_id = user_id
        self.app_id = app_id

    async def send(
        self,
        title: str,
        body: str = "",
        priority: str = "normal",
        action_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send a notification to the user.

        Args:
            title: Notification title
            body: Notification body text
            priority: Priority level ("low", "normal", "high", "urgent")
            action_url: Optional URL to navigate when notification is clicked
            metadata: Optional metadata for the notification

        Returns:
            dict: Notification details including ID

        Example:
            notification = await ctx.notifications.send(
                "Reminder",
                body="Time for your daily standup!",
                priority="high",
                action_url="/apps/standup-tracker"
            )
        """
        try:
            # Store notification in database
            from app.models.notification import Notification

            notification = Notification(
                user_id=self.user_id,
                app_id=self.app_id,
                title=title,
                body=body,
                priority=priority,
                action_url=action_url,
                extra_data=metadata or {},
                created_at=datetime.utcnow(),
                read=False
            )

            self.db.add(notification)
            await self.db.commit()
            await self.db.refresh(notification)

            # TODO: Trigger WebSocket/SSE for real-time delivery
            # TODO: Trigger push notification if user has enabled it

            logger.info(
                f"Notification sent from app {self.app_id} to user {self.user_id}",
                extra={
                    "app_id": self.app_id,
                    "user_id": self.user_id,
                    "notification_id": notification.id,
                    "title": title,
                    "priority": priority
                }
            )

            return {
                "id": notification.id,
                "title": title,
                "body": body,
                "priority": priority,
                "created_at": notification.created_at.isoformat(),
                "status": "sent"
            }

        except Exception as e:
            logger.error(
                f"Notification error for app {self.app_id}: {str(e)}",
                extra={
                    "app_id": self.app_id,
                    "user_id": self.user_id,
                    "error": str(e)
                }
            )
            raise ValueError(f"Failed to send notification: {str(e)}")

    async def send_bulk(
        self,
        notifications: list[Dict[str, Any]]
    ) -> list[Dict[str, Any]]:
        """
        Send multiple notifications at once.

        Args:
            notifications: List of notification dicts (title, body, priority, etc.)

        Returns:
            list: List of sent notification details

        Example:
            results = await ctx.notifications.send_bulk([
                {"title": "Task 1 done", "body": "Great!"},
                {"title": "Task 2 done", "body": "Awesome!"}
            ])
        """
        results = []
        for notif in notifications:
            result = await self.send(
                title=notif.get("title", ""),
                body=notif.get("body", ""),
                priority=notif.get("priority", "normal"),
                action_url=notif.get("action_url"),
                metadata=notif.get("metadata")
            )
            results.append(result)

        return results

    async def schedule(
        self,
        title: str,
        body: str = "",
        scheduled_for: datetime = None,
        priority: str = "normal"
    ) -> Dict[str, Any]:
        """
        Schedule a notification for future delivery.

        Args:
            title: Notification title
            body: Notification body
            scheduled_for: When to send the notification
            priority: Priority level

        Returns:
            dict: Scheduled notification details

        Example:
            from datetime import datetime, timedelta
            scheduled = await ctx.notifications.schedule(
                "Daily reminder",
                body="Don't forget to log your habits!",
                scheduled_for=datetime.now() + timedelta(hours=24)
            )
        """
        # TODO: Implement with background job scheduler (Celery/APScheduler)
        raise NotImplementedError("Scheduled notifications coming soon")

    async def get_history(
        self,
        limit: int = 50,
        unread_only: bool = False
    ) -> list[Dict[str, Any]]:
        """
        Get notification history for this app.

        Args:
            limit: Maximum number of notifications to return
            unread_only: Only return unread notifications

        Returns:
            list: List of notification dicts

        Example:
            history = await ctx.notifications.get_history(limit=20)
        """
        try:
            from app.models.notification import Notification

            query = select(Notification).where(
                Notification.user_id == self.user_id,
                Notification.app_id == self.app_id
            )

            if unread_only:
                query = query.where(Notification.read == False)

            query = query.order_by(Notification.created_at.desc()).limit(limit)

            result = await self.db.execute(query)
            notifications = result.scalars().all()

            return [
                {
                    "id": n.id,
                    "title": n.title,
                    "body": n.body,
                    "priority": n.priority,
                    "action_url": n.action_url,
                    "metadata": n.extra_data,
                    "created_at": n.created_at.isoformat(),
                    "read": n.read
                }
                for n in notifications
            ]

        except Exception as e:
            logger.error(f"Failed to get notification history: {str(e)}")
            return []
