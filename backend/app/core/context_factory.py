"""
Platform Context Factory - Creates and manages platform contexts.

Responsible for:
- Creating PlatformContext instances with all necessary dependencies
- Loading user information
- Validating app installation
- Permission checking
"""
import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.platform_context import PlatformContext, UserInfo
from app.models.user import User
from app.models.app_platform import AppInstallation, App

logger = logging.getLogger(__name__)


class ContextCreationError(Exception):
    """Raised when context creation fails."""
    pass


async def create_app_context(
    user_id: int,
    app_id: str,
    db: AsyncSession,
    skip_installation_check: bool = False
) -> PlatformContext:
    """
    Create a platform context for an app action.

    Args:
        user_id: User ID
        app_id: App ID
        db: Database session
        skip_installation_check: Skip checking if app is installed (for system operations)

    Returns:
        PlatformContext instance

    Raises:
        ContextCreationError: If user not found or app not installed
    """
    # Load user
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise ContextCreationError(f"User {user_id} not found")

    # Check app installation (unless skipped)
    if not skip_installation_check:
        result = await db.execute(
            select(AppInstallation).where(
                AppInstallation.user_id == user_id,
                AppInstallation.app_id == app_id,
                AppInstallation.status == "installed"
            )
        )
        installation = result.scalar_one_or_none()

        if not installation:
            raise ContextCreationError(
                f"App '{app_id}' is not installed for user {user_id}"
            )

    # Create user info
    user_info = UserInfo(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        timezone=user.timezone,
        preferences=user.preferences or {}
    )

    # Create and return context
    ctx = PlatformContext(
        user_id=user_id,
        app_id=app_id,
        db=db,
        user_info=user_info
    )

    logger.info(f"Created context for user={user_id}, app='{app_id}'")

    return ctx


async def validate_app_permission(
    ctx: PlatformContext,
    permission_type: str,
    scope: str
) -> bool:
    """
    Validate that an app has a specific permission.

    Args:
        ctx: Platform context
        permission_type: Type of permission (e.g., "data_read", "integrations")
        scope: Specific scope (e.g., "read:habits", "google_calendar")

    Returns:
        True if permission granted, False otherwise
    """
    # Get user's granted permissions for this app
    result = await ctx._db.execute(
        select(AppInstallation).where(
            AppInstallation.user_id == ctx.user_id,
            AppInstallation.app_id == ctx.app_id
        )
    )
    installation = result.scalar_one_or_none()

    if not installation:
        return False

    # Check if permission was granted
    permission_key = f"{permission_type}:{scope}"
    return permission_key in installation.granted_permissions


async def get_installed_apps(
    user_id: int,
    db: AsyncSession,
    status: Optional[str] = "installed"
) -> list[dict]:
    """
    Get list of apps installed by user.

    Args:
        user_id: User ID
        db: Database session
        status: Filter by installation status

    Returns:
        List of installed app data
    """
    query = select(AppInstallation, App).join(
        App, AppInstallation.app_id == App.id
    ).where(
        AppInstallation.user_id == user_id
    )

    if status:
        query = query.where(AppInstallation.status == status)

    result = await db.execute(query)
    installations = result.all()

    return [
        {
            "installation_id": installation.id,
            "app_id": app.id,
            "app_name": app.name,
            "app_version": app.version,
            "installed_version": installation.installed_version,
            "status": installation.status,
            "installed_at": installation.installed_at,
            "last_used_at": installation.last_used_at,
        }
        for installation, app in installations
    ]


async def is_app_installed(
    user_id: int,
    app_id: str,
    db: AsyncSession
) -> bool:
    """
    Check if an app is installed for a user.

    Args:
        user_id: User ID
        app_id: App ID
        db: Database session

    Returns:
        True if installed, False otherwise
    """
    result = await db.execute(
        select(AppInstallation).where(
            AppInstallation.user_id == user_id,
            AppInstallation.app_id == app_id,
            AppInstallation.status == "installed"
        )
    )
    return result.scalar_one_or_none() is not None
