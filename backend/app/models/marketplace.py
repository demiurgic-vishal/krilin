"""
App Marketplace models - Layer 7: Marketplace System
Support app catalog, publishing, discovery, reviews, and ratings.

Apps are complex applications with UI, state, and logic - not simple workflows.
"""
from datetime import datetime
from typing import Literal, Optional, TYPE_CHECKING

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, Integer, Float, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


AppVisibility = Literal["public", "private", "unlisted"]
PublishStatus = Literal["draft", "pending_review", "approved", "rejected"]


class MarketplaceApp(Base):
    """
    Published apps in the marketplace (OLD - being replaced by app_platform).

    Apps have their own UI, maintain state, have complex logic, and are installable like software.
    """

    __tablename__ = "marketplace_apps"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Author info
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    author_name: Mapped[str] = mapped_column(String(255))

    # App metadata
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100), index=True)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)

    # Version info
    version: Mapped[str] = mapped_column(String(50))
    changelog: Mapped[Optional[str]] = mapped_column(Text)

    # App content (UI, state, logic)
    manifest: Mapped[dict] = mapped_column(JSON)  # Complete app manifest with UI definition
    code: Mapped[str] = mapped_column(Text)  # Python code
    screenshots: Mapped[list[str]] = mapped_column(JSON, default=list)  # Image URLs
    icon: Mapped[str] = mapped_column(String(255), default="app")

    # Publishing
    visibility: Mapped[AppVisibility] = mapped_column(String(20), default="public")
    publish_status: Mapped[PublishStatus] = mapped_column(String(20), default="draft")
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Stats
    install_count: Mapped[int] = mapped_column(Integer, default=0)
    active_installs: Mapped[int] = mapped_column(Integer, default=0)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    rating_avg: Mapped[float] = mapped_column(Float, default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)

    # Requirements
    required_integrations: Mapped[list[str]] = mapped_column(JSON, default=list)
    required_data_types: Mapped[list[str]] = mapped_column(JSON, default=list)

    # Flags
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_official: Mapped[bool] = mapped_column(Boolean, default=False)

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
    author: Mapped["User"] = relationship()
    reviews: Mapped[list["MarketplaceAppReview"]] = relationship(
        back_populates="app",
        cascade="all, delete-orphan"
    )
    installs: Mapped[list["MarketplaceAppInstallation"]] = relationship(
        back_populates="app",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<App(id={self.id}, name='{self.name}')>"


class MarketplaceAppReview(Base):
    """User reviews and ratings for marketplace apps."""

    __tablename__ = "marketplace_app_reviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # References
    app_id: Mapped[int] = mapped_column(
        ForeignKey("marketplace_apps.id"),
        index=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # Review content
    rating: Mapped[int] = mapped_column(Integer)  # 1-5 stars
    title: Mapped[Optional[str]] = mapped_column(String(255))
    comment: Mapped[Optional[str]] = mapped_column(Text)

    # Moderation
    is_verified_install: Mapped[bool] = mapped_column(Boolean, default=False)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_reason: Mapped[Optional[str]] = mapped_column(Text)

    # Helpful votes
    helpful_count: Mapped[int] = mapped_column(Integer, default=0)

    # Author response
    author_response: Mapped[Optional[str]] = mapped_column(Text)
    author_response_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

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
    app: Mapped["MarketplaceApp"] = relationship(back_populates="reviews")
    user: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"<AppReview(id={self.id}, rating={self.rating})>"


class MarketplaceAppInstallation(Base):
    """
    Tracks which users have installed which marketplace apps.

    Links marketplace app to user's installed app instance.
    """

    __tablename__ = "marketplace_app_installations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # References
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    app_id: Mapped[int] = mapped_column(
        ForeignKey("marketplace_apps.id"),
        index=True
    )

    # Installation metadata
    installed_version: Mapped[str] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_update: Mapped[bool] = mapped_column(Boolean, default=True)

    # App instance state
    app_state: Mapped[dict] = mapped_column(JSON, default=dict)  # App's runtime state
    app_config: Mapped[dict] = mapped_column(JSON, default=dict)  # User's custom configuration

    # Timestamps
    installed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    last_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    uninstalled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    user: Mapped["User"] = relationship()
    app: Mapped["MarketplaceApp"] = relationship(back_populates="installs")

    def __repr__(self) -> str:
        return f"<AppInstallation(id={self.id}, user_id={self.user_id})>"


class MarketplaceAppCategory(Base):
    """App categories for organization."""

    __tablename__ = "marketplace_app_categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(String(255), default="folder")

    # Display order
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    # Parent category (for hierarchical categories)
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("marketplace_app_categories.id"))

    # Stats
    app_count: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<AppCategory(id={self.id}, name='{self.name}')>"


class MarketplaceAppCollection(Base):
    """Curated collections of apps."""

    __tablename__ = "marketplace_app_collections"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Collection metadata
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)

    # Curator
    curator_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    is_official: Mapped[bool] = mapped_column(Boolean, default=False)

    # Apps in collection (list of app IDs)
    app_ids: Mapped[list[int]] = mapped_column(JSON, default=list)

    # Visibility
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)

    # Stats
    follower_count: Mapped[int] = mapped_column(Integer, default=0)

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
    curator: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"<AppCollection(id={self.id}, name='{self.name}')>"
