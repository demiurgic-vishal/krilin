"""
App Platform Models - Core models for the Cloud OS App Platform.

These models support the platform's app ecosystem where apps:
- Have their own UI, state, and complex logic (not simple workflows)
- Embed Claude AI agents with custom tools
- Compose via dependencies and shared outputs
- Run in shared backend with user isolation via context
"""
from datetime import datetime
from typing import Optional, Literal

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Text, Integer, Float, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# Type aliases
AppStatus = Literal["draft", "published", "active", "disabled"]
InstallationStatus = Literal["installed", "installing", "failed", "uninstalled"]
PermissionType = Literal["data_read", "data_write", "integrations", "notifications", "files", "schedule", "ai"]


class App(Base):
    """
    Core app definition in the platform.

    Apps are complete applications (not workflows) with:
    - Full UI components (widgets, pages, settings)
    - Embedded Claude AI agent
    - Database tables for state
    - Actions/endpoints
    - Declared outputs for composition
    """

    __tablename__ = "platform_apps"

    # Primary key
    id: Mapped[str] = mapped_column(String(100), primary_key=True, index=True)  # e.g., "habit-tracker"

    # Metadata
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    version: Mapped[str] = mapped_column(String(50))
    author: Mapped[str] = mapped_column(String(255))
    icon: Mapped[str] = mapped_column(String(255), default="app")
    category: Mapped[str] = mapped_column(String(100), index=True)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)

    # App content
    manifest: Mapped[dict] = mapped_column(JSON)  # Complete app manifest
    code_module: Mapped[Optional[str]] = mapped_column(String(255))  # Python module path, e.g., "apps.habit_tracker.backend"

    # NEW: File-based app storage
    app_directory: Mapped[Optional[str]] = mapped_column(String(500))  # Path to app files, e.g., "apps/user_123/my-tracker"

    # NEW: AI generation metadata
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    generation_prompt: Mapped[Optional[str]] = mapped_column(Text)  # Original user request that generated this app
    owner_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), index=True)  # User who created this app

    # Publishing metadata
    is_official: Mapped[bool] = mapped_column(Boolean, default=True)  # Official vs user-generated
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))  # When app was published
    publish_count: Mapped[int] = mapped_column(Integer, default=0)  # Version counter

    # Status (draft -> published -> installed)
    status: Mapped[AppStatus] = mapped_column(String(20), default="draft")

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
    owner: Mapped[Optional["User"]] = relationship("User", foreign_keys=[owner_id])
    installations: Mapped[list["AppInstallation"]] = relationship(
        back_populates="app",
        cascade="all, delete-orphan"
    )
    dependencies: Mapped[list["AppDependency"]] = relationship(
        foreign_keys="AppDependency.app_id",
        back_populates="app",
        cascade="all, delete-orphan"
    )
    dependent_apps: Mapped[list["AppDependency"]] = relationship(
        foreign_keys="AppDependency.depends_on_app_id",
        back_populates="depends_on_app"
    )
    permissions: Mapped[list["AppPermission"]] = relationship(
        back_populates="app",
        cascade="all, delete-orphan"
    )
    tables: Mapped[list["AppTable"]] = relationship(
        back_populates="app",
        cascade="all, delete-orphan"
    )
    outputs: Mapped[list["AppOutput"]] = relationship(
        back_populates="app",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<App(id='{self.id}', name='{self.name}', version='{self.version}')>"


class AppInstallation(Base):
    """
    Tracks which users have installed which apps.

    Each installation has:
    - User-specific configuration
    - App state (persisted between requests)
    - Installation metadata
    """

    __tablename__ = "app_installations"
    __table_args__ = (
        UniqueConstraint('user_id', 'app_id', name='unique_user_app_installation'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # References
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    app_id: Mapped[str] = mapped_column(ForeignKey("platform_apps.id"), index=True)

    # Installation metadata
    installed_version: Mapped[str] = mapped_column(String(50))
    status: Mapped[InstallationStatus] = mapped_column(String(20), default="installed")

    # App-specific state and config
    app_state: Mapped[dict] = mapped_column(JSON, default=dict)  # App's runtime state
    app_config: Mapped[dict] = mapped_column(JSON, default=dict)  # User's custom configuration

    # Permissions granted (copy of what user approved)
    granted_permissions: Mapped[list[str]] = mapped_column(JSON, default=list)

    # Auto-update settings
    auto_update: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    installed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    user: Mapped["User"] = relationship()
    app: Mapped[App] = relationship(back_populates="installations")

    def __repr__(self) -> str:
        return f"<AppInstallation(id={self.id}, user_id={self.user_id}, app_id='{self.app_id}')>"


class AppDependency(Base):
    """
    Tracks dependencies between apps.

    Example: "productivity-dashboard" depends on "habit-tracker" v1.x
    """

    __tablename__ = "app_dependencies"
    __table_args__ = (
        UniqueConstraint('app_id', 'depends_on_app_id', name='unique_app_dependency'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # The app that has the dependency
    app_id: Mapped[str] = mapped_column(ForeignKey("platform_apps.id"), index=True)

    # The app it depends on
    depends_on_app_id: Mapped[str] = mapped_column(ForeignKey("platform_apps.id"), index=True)

    # Version constraint (semver)
    version_constraint: Mapped[str] = mapped_column(String(50))  # e.g., ">=1.0.0", "^2.0.0"

    # Is this dependency required or optional?
    required: Mapped[bool] = mapped_column(Boolean, default=True)

    # What does this dependency provide?
    purpose: Mapped[Optional[str]] = mapped_column(Text)  # e.g., "Provides habit streak data"

    # Relationships
    app: Mapped[App] = relationship(
        foreign_keys=[app_id],
        back_populates="dependencies"
    )
    depends_on_app: Mapped[App] = relationship(
        foreign_keys=[depends_on_app_id],
        back_populates="dependent_apps"
    )

    def __repr__(self) -> str:
        return f"<AppDependency(app='{self.app_id}', depends_on='{self.depends_on_app_id}')>"


class AppPermission(Base):
    """
    Defines what permissions an app requires.

    Users must approve these during installation.
    """

    __tablename__ = "app_permissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # App requesting permission
    app_id: Mapped[str] = mapped_column(ForeignKey("platform_apps.id"), index=True)

    # Permission details
    permission_type: Mapped[PermissionType] = mapped_column(String(50))
    scope: Mapped[str] = mapped_column(String(255))  # e.g., "read:habits", "write:calendar"
    description: Mapped[str] = mapped_column(Text)  # Human-readable explanation

    # Is this permission required or optional?
    required: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    app: Mapped[App] = relationship(back_populates="permissions")

    def __repr__(self) -> str:
        return f"<AppPermission(app='{self.app_id}', type='{self.permission_type}', scope='{self.scope}')>"


class AppTable(Base):
    """
    Defines database tables that belong to an app.

    Tables are named: app_{app_id}_{table_name}
    Example: app_habit-tracker_habits
    """

    __tablename__ = "app_tables"
    __table_args__ = (
        UniqueConstraint('app_id', 'table_name', name='unique_app_table'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # App owning this table
    app_id: Mapped[str] = mapped_column(ForeignKey("platform_apps.id"), index=True)

    # Table metadata
    table_name: Mapped[str] = mapped_column(String(255))  # e.g., "habits"
    full_table_name: Mapped[str] = mapped_column(String(255))  # e.g., "app_habit-tracker_habits"

    # Table schema (JSON Schema format)
    schema: Mapped[dict] = mapped_column(JSON)

    # Description
    description: Mapped[Optional[str]] = mapped_column(Text)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships
    app: Mapped[App] = relationship(back_populates="tables")

    def __repr__(self) -> str:
        return f"<AppTable(app='{self.app_id}', table='{self.table_name}')>"


class AppOutput(Base):
    """
    Defines outputs that an app exposes to other apps.

    Example: Habit Tracker exposes "daily_streaks" output
    Other apps can access via: ctx.apps.get("habit-tracker").get_output("daily_streaks")
    """

    __tablename__ = "app_outputs"
    __table_args__ = (
        UniqueConstraint('app_id', 'output_id', name='unique_app_output'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # App providing this output
    app_id: Mapped[str] = mapped_column(ForeignKey("platform_apps.id"), index=True)

    # Output metadata
    output_id: Mapped[str] = mapped_column(String(100))  # e.g., "daily_streaks"
    output_type: Mapped[str] = mapped_column(String(50))  # "data", "agent", "stream"

    # Output schema (for data outputs)
    schema: Mapped[Optional[dict]] = mapped_column(JSON)

    # Description
    description: Mapped[str] = mapped_column(Text)

    # Access control
    access_level: Mapped[str] = mapped_column(
        String(50),
        default="any_app"
    )  # "any_app", "requires_permission"

    # Update frequency (for data outputs)
    update_frequency: Mapped[Optional[str]] = mapped_column(String(50))  # "real-time", "hourly", "daily"

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships
    app: Mapped[App] = relationship(back_populates="outputs")

    def __repr__(self) -> str:
        return f"<AppOutput(app='{self.app_id}', output='{self.output_id}')>"


class AppAgentConversation(Base):
    """
    Tracks conversations with app-specific Claude agents.

    Each app has its own agent, and conversations are isolated per app.
    """

    __tablename__ = "app_agent_conversations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # User and app
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    app_id: Mapped[str] = mapped_column(ForeignKey("platform_apps.id"), index=True)

    # Conversation metadata
    title: Mapped[str] = mapped_column(String(255), default="New Conversation")

    # Agent state
    conversation_history: Mapped[list[dict]] = mapped_column(JSON, default=list)
    context: Mapped[dict] = mapped_column(JSON, default=dict)

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
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    user: Mapped["User"] = relationship()
    app: Mapped[App] = relationship()

    def __repr__(self) -> str:
        return f"<AppAgentConversation(id={self.id}, user_id={self.user_id}, app_id='{self.app_id}')>"
