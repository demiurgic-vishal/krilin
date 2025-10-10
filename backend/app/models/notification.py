"""
Notification model for app-generated notifications.
Apps use ctx.notifications.send() to create these.
"""
from datetime import datetime
from typing import Literal, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


NotificationPriority = Literal["low", "normal", "high", "urgent"]


class Notification(Base):
    """User notifications sent by apps."""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    app_id: Mapped[str] = mapped_column(String(255), index=True)

    # Notification content
    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[Optional[str]] = mapped_column(Text)

    # Notification metadata
    priority: Mapped[NotificationPriority] = mapped_column(String(20), default="normal")
    action_url: Mapped[Optional[str]] = mapped_column(String(500))
    extra_data: Mapped[dict] = mapped_column(JSON, default=dict, name="metadata")

    # Status
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, title='{self.title}', app_id='{self.app_id}')>"
