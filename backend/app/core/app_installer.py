"""
App Installation System - Install, update, and uninstall apps.

Handles:
- Dependency resolution with semantic versioning
- Permission approval flows
- Database table creation from manifests
- App registration and lifecycle management
- Installation validation and rollback

For MVP, all apps are trusted (built by core team).
Year 2 will add permission prompts, sandboxing, and user-generated apps.
"""
import logging
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import json
import re
from datetime import datetime

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.app_platform import (
    App,
    AppInstallation,
    AppDependency,
    AppPermission,
    AppTable,
    AppOutput,
    InstallationStatus
)
from app.core.platform_context import PlatformContext
from app.core.context_factory import create_app_context
from app.core.app_runtime import get_app_runtime
from app.core.app_manifest import AppManifest

logger = logging.getLogger(__name__)


class AppInstallerError(Exception):
    """Raised when app installation operations fail."""
    pass


class DependencyResolutionError(AppInstallerError):
    """Raised when dependency resolution fails."""
    pass


class PermissionDeniedError(AppInstallerError):
    """Raised when required permissions are not granted."""
    pass


def parse_version(version: str) -> Tuple[int, int, int]:
    """
    Parse semantic version string.

    Args:
        version: Version string like "1.2.3"

    Returns:
        Tuple of (major, minor, patch)

    Raises:
        ValueError: If version format is invalid
    """
    match = re.match(r'^(\d+)\.(\d+)\.(\d+)', version)
    if not match:
        raise ValueError(f"Invalid version format: {version}")

    return (
        int(match.group(1)),
        int(match.group(2)),
        int(match.group(3))
    )


def version_satisfies(version: str, constraint: str) -> bool:
    """
    Check if version satisfies semver constraint.

    Supports constraints like:
    - "^1.2.0" (compatible with 1.x.x, >= 1.2.0)
    - "~1.2.0" (compatible with 1.2.x, >= 1.2.0)
    - ">=1.0.0" (greater than or equal)
    - "1.2.3" (exact match)

    Args:
        version: Version to check
        constraint: Constraint pattern

    Returns:
        True if version satisfies constraint

    For MVP, we implement basic semver.
    Year 2 can use proper semver library.
    """
    try:
        v_major, v_minor, v_patch = parse_version(version)

        # Exact match
        if not constraint.startswith('^') and not constraint.startswith('~') and not constraint.startswith('>='):
            c_major, c_minor, c_patch = parse_version(constraint)
            return v_major == c_major and v_minor == c_minor and v_patch == c_patch

        # Caret (^) - Compatible with major version
        if constraint.startswith('^'):
            c_major, c_minor, c_patch = parse_version(constraint[1:])
            return (
                v_major == c_major and
                (v_minor > c_minor or (v_minor == c_minor and v_patch >= c_patch))
            )

        # Tilde (~) - Compatible with minor version
        if constraint.startswith('~'):
            c_major, c_minor, c_patch = parse_version(constraint[1:])
            return (
                v_major == c_major and
                v_minor == c_minor and
                v_patch >= c_patch
            )

        # Greater than or equal
        if constraint.startswith('>='):
            c_major, c_minor, c_patch = parse_version(constraint[2:])
            if v_major > c_major:
                return True
            if v_major == c_major and v_minor > c_minor:
                return True
            if v_major == c_major and v_minor == c_minor and v_patch >= c_patch:
                return True
            return False

        return False

    except ValueError as e:
        logger.error(f"[INSTALLER] Version parsing error: {e}")
        return False


async def resolve_dependencies(
    app_id: str,
    manifest: Dict[str, Any],
    db: AsyncSession
) -> List[str]:
    """
    Resolve app dependencies with semantic versioning.

    Checks that all required apps are available and installed.

    Args:
        app_id: App being installed
        manifest: App manifest
        db: Database session

    Returns:
        List of app IDs that need to be installed first

    Raises:
        DependencyResolutionError: If dependencies cannot be resolved
    """
    dependencies = manifest.get("dependencies", {})
    required_apps = dependencies.get("apps", [])

    missing_deps = []

    for dep in required_apps:
        dep_app_id = dep.get("app_id")
        dep_version = dep.get("version", "*")

        if not dep_app_id:
            continue

        # Check if dependency app exists in registry
        result = await db.execute(
            select(App).where(App.id == dep_app_id)
        )
        dep_app = result.scalar_one_or_none()

        if not dep_app:
            raise DependencyResolutionError(
                f"Required dependency '{dep_app_id}' not found in app registry"
            )

        # Check version compatibility
        if dep_version != "*" and not version_satisfies(dep_app.version, dep_version):
            raise DependencyResolutionError(
                f"Dependency '{dep_app_id}' version {dep_app.version} "
                f"does not satisfy constraint {dep_version}"
            )

        logger.info(
            f"[INSTALLER] Dependency {dep_app_id} ({dep_app.version}) "
            f"satisfies constraint {dep_version}"
        )

    return missing_deps


async def validate_permissions(
    manifest: Dict[str, Any],
    auto_approve: bool = True
) -> bool:
    """
    Validate and approve app permissions.

    For MVP, all apps are trusted and permissions are auto-approved.
    Year 2 will show permission prompts to users.

    Args:
        manifest: App manifest
        auto_approve: Whether to auto-approve (default: True for MVP)

    Returns:
        True if permissions approved, False otherwise

    Raises:
        PermissionDeniedError: If permissions denied
    """
    permissions = manifest.get("permissions", {})

    required_permissions = []
    if permissions.get("data_read"):
        required_permissions.append("data_read")
    if permissions.get("data_write"):
        required_permissions.append("data_write")
    if permissions.get("integrations"):
        required_permissions.append("integrations")
    if permissions.get("notifications"):
        required_permissions.append("notifications")
    if permissions.get("files"):
        required_permissions.append("files")
    if permissions.get("schedule"):
        required_permissions.append("schedule")
    if permissions.get("ai"):
        required_permissions.append("ai")

    logger.info(
        f"[INSTALLER] App requires permissions: {', '.join(required_permissions)}"
    )

    # For MVP, auto-approve all permissions
    if auto_approve:
        logger.info("[INSTALLER] Auto-approving permissions (MVP mode)")
        return True

    # Year 2: Show permission prompt to user
    # For now, always approve
    return True


async def create_app_tables(
    app_id: str,
    manifest: Dict[str, Any],
    db: AsyncSession
):
    """
    Create database tables for an app from manifest schema.

    Tables are created with naming: app_{app_id}_{table_name}
    All tables have standard columns: id, user_id, data, created_at, updated_at

    Args:
        app_id: App identifier
        manifest: App manifest with database schema
        db: Database session

    Raises:
        AppInstallerError: If table creation fails
    """
    from sqlalchemy import text

    database_spec = manifest.get("database", {})
    tables = database_spec.get("tables", [])

    for table_spec in tables:
        table_name = table_spec.get("name")
        if not table_name:
            continue

        # Build full table name
        full_table_name = f"app_{app_id.replace('-', '_')}_{table_name}"

        logger.info(f"[INSTALLER] Creating table: {full_table_name}")

        # Build CREATE TABLE SQL
        # All tables have: id (PK), user_id (scoping), data (JSONB), created_at, updated_at
        # Note: asyncpg doesn't support multiple statements in one execute() call
        create_table_sql = f"""
            CREATE TABLE IF NOT EXISTS {full_table_name} (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                data JSONB NOT NULL DEFAULT '{{}}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        """

        create_user_id_index_sql = f"""
            CREATE INDEX IF NOT EXISTS idx_{full_table_name}_user_id
            ON {full_table_name}(user_id)
        """

        create_updated_at_index_sql = f"""
            CREATE INDEX IF NOT EXISTS idx_{full_table_name}_updated_at
            ON {full_table_name}(updated_at)
        """

        # Execute each statement separately (asyncpg requirement)
        try:
            await db.execute(text(create_table_sql))
            await db.execute(text(create_user_id_index_sql))
            await db.execute(text(create_updated_at_index_sql))
            await db.commit()

            logger.info(f"[INSTALLER] Table {full_table_name} created successfully")

        except Exception as e:
            logger.error(f"[INSTALLER] Failed to create table {full_table_name}: {e}")
            raise AppInstallerError(f"Failed to create table: {str(e)}")


async def register_app_metadata(
    app_id: str,
    manifest: Dict[str, Any],
    db: AsyncSession
):
    """
    Register app metadata in the database.

    Creates App record and related metadata (dependencies, permissions, tables, outputs).

    Args:
        app_id: App identifier
        manifest: App manifest
        db: Database session

    Raises:
        AppInstallerError: If registration fails
    """
    metadata = manifest.get("metadata", {})

    # Check if app already registered
    result = await db.execute(select(App).where(App.id == app_id))
    existing_app = result.scalar_one_or_none()

    if existing_app:
        logger.info(f"[INSTALLER] App {app_id} already registered, updating...")
        # Update existing
        existing_app.version = metadata.get("version", "1.0.0")
        existing_app.manifest = manifest
        existing_app.updated_at = datetime.utcnow()
    else:
        # Create new
        app = App(
            id=app_id,
            name=metadata.get("name", app_id),
            description=metadata.get("description", ""),
            version=metadata.get("version", "1.0.0"),
            author=metadata.get("author", "Krilin"),
            icon=metadata.get("icon", "app"),
            category=metadata.get("category", "productivity"),
            tags=metadata.get("tags", []),
            manifest=manifest,
            code_module=manifest.get("code_module"),
            is_official=True,
            is_public=True,
            status="active"
        )
        db.add(app)

    await db.commit()

    logger.info(f"[INSTALLER] App {app_id} metadata registered")


async def install_app(
    user_id: int,
    app_id: str,
    db: AsyncSession,
    manifest: Optional[Dict[str, Any]] = None,
    config: Optional[Dict[str, Any]] = None
) -> AppInstallation:
    """
    Install an app for a user.

    Complete installation flow:
    1. Load app manifest
    2. Resolve dependencies
    3. Validate permissions
    4. Register app metadata
    5. Create database tables
    6. Create installation record
    7. Initialize app (run app's initialization code)

    Args:
        user_id: User installing the app
        app_id: App identifier
        db: Database session
        manifest: App manifest (loaded if not provided)
        config: Installation config (optional)

    Returns:
        AppInstallation record

    Raises:
        AppInstallerError: If installation fails
        DependencyResolutionError: If dependencies cannot be resolved
        PermissionDeniedError: If permissions denied
    """
    try:
        logger.info(f"[INSTALLER] Starting installation of {app_id} for user {user_id}")

        # Check if already installed
        result = await db.execute(
            select(AppInstallation).where(
                and_(
                    AppInstallation.user_id == user_id,
                    AppInstallation.app_id == app_id,
                    AppInstallation.status == "installed"
                )
            )
        )
        existing_installation = result.scalar_one_or_none()

        if existing_installation:
            logger.info(f"[INSTALLER] App {app_id} already installed for user {user_id}")
            return existing_installation

        # Load manifest if not provided
        if manifest is None:
            runtime = get_app_runtime()
            # For now, manifest needs to be loaded from app registry
            # In production, we'd load from App table
            result = await db.execute(select(App).where(App.id == app_id))
            app_record = result.scalar_one_or_none()

            if not app_record:
                raise AppInstallerError(
                    f"App '{app_id}' not found in registry. "
                    "Please register the app first."
                )

            manifest = app_record.manifest

        # Resolve dependencies
        missing_deps = await resolve_dependencies(app_id, manifest, db)

        if missing_deps:
            raise DependencyResolutionError(
                f"Missing dependencies: {', '.join(missing_deps)}. "
                "Please install them first."
            )

        # Validate permissions
        if not await validate_permissions(manifest, auto_approve=True):
            raise PermissionDeniedError("Required permissions were not granted")

        # Register app metadata (if not already)
        await register_app_metadata(app_id, manifest, db)

        # Create database tables
        await create_app_tables(app_id, manifest, db)

        # Create installation record
        installation = AppInstallation(
            user_id=user_id,
            app_id=app_id,
            installed_version=manifest.get("metadata", {}).get("version", "1.0.0"),
            status="installing",
            app_config=config or {},
            app_state={},
            granted_permissions=manifest.get("permissions", {}).get("required", [])
        )
        db.add(installation)
        await db.commit()
        await db.refresh(installation)

        # Initialize app (run app's initialization code)
        try:
            ctx = await create_app_context(
                user_id=user_id,
                app_id=app_id,
                db=db,
                skip_installation_check=True
            )

            runtime = get_app_runtime()
            await runtime.initialize_app(ctx, manifest)

            # Mark as installed
            installation.status = "installed"
            installation.installed_at = datetime.utcnow()
            await db.commit()

            logger.info(
                f"[INSTALLER] Successfully installed {app_id} for user {user_id}"
            )

            return installation

        except Exception as e:
            # Rollback failed transaction
            await db.rollback()

            # Mark as failed in a new transaction
            installation.status = "failed"
            installation.app_state = {"error": str(e)}
            await db.commit()

            logger.error(f"[INSTALLER] App initialization failed: {e}")
            raise AppInstallerError(f"App initialization failed: {str(e)}")

    except (DependencyResolutionError, PermissionDeniedError):
        raise
    except Exception as e:
        logger.error(f"[INSTALLER] Installation failed for {app_id}: {e}")
        raise AppInstallerError(f"Installation failed: {str(e)}")


async def uninstall_app(
    user_id: int,
    app_id: str,
    db: AsyncSession,
    delete_data: bool = False
):
    """
    Uninstall an app for a user.

    Args:
        user_id: User uninstalling the app
        app_id: App identifier
        db: Database session
        delete_data: Whether to delete app data (default: False, keep for re-install)

    Raises:
        AppInstallerError: If uninstallation fails
    """
    try:
        logger.info(f"[INSTALLER] Uninstalling {app_id} for user {user_id}")

        # Find installation
        result = await db.execute(
            select(AppInstallation).where(
                and_(
                    AppInstallation.user_id == user_id,
                    AppInstallation.app_id == app_id
                )
            )
        )
        installation = result.scalar_one_or_none()

        if not installation:
            raise AppInstallerError(f"App {app_id} not installed for user {user_id}")

        # Check for dependent apps
        # Year 2: Implement dependency checking to prevent uninstalling if other apps depend on this
        # For MVP, we allow uninstallation

        if delete_data:
            # Delete all user data from app tables
            from sqlalchemy import text

            result = await db.execute(
                select(App).where(App.id == app_id)
            )
            app = result.scalar_one_or_none()

            if app:
                database_spec = app.manifest.get("database", {})
                tables = database_spec.get("tables", [])

                for table_spec in tables:
                    table_name = table_spec.get("name")
                    if not table_name:
                        continue

                    full_table_name = f"app_{app_id.replace('-', '_')}_{table_name}"

                    # Delete user's data
                    delete_sql = f"DELETE FROM {full_table_name} WHERE user_id = :user_id"

                    await db.execute(text(delete_sql), {"user_id": user_id})

                logger.info(f"[INSTALLER] Deleted app data for user {user_id}")

        # Mark as uninstalled
        installation.status = "uninstalled"
        installation.uninstalled_at = datetime.utcnow()
        await db.commit()

        logger.info(f"[INSTALLER] Successfully uninstalled {app_id} for user {user_id}")

    except AppInstallerError:
        raise
    except Exception as e:
        logger.error(f"[INSTALLER] Uninstallation failed for {app_id}: {e}")
        raise AppInstallerError(f"Uninstallation failed: {str(e)}")


async def update_app(
    user_id: int,
    app_id: str,
    db: AsyncSession,
    new_version: str
):
    """
    Update an app to a new version.

    For MVP, updates are simple (re-install).
    Year 2 will handle migrations, data transformations, etc.

    Args:
        user_id: User updating the app
        app_id: App identifier
        db: Database session
        new_version: Target version

    Raises:
        AppInstallerError: If update fails
    """
    logger.info(
        f"[INSTALLER] Updating {app_id} to version {new_version} "
        f"for user {user_id}"
    )

    # For MVP, we just update the installation record
    # Year 2 will handle proper migrations

    result = await db.execute(
        select(AppInstallation).where(
            and_(
                AppInstallation.user_id == user_id,
                AppInstallation.app_id == app_id
            )
        )
    )
    installation = result.scalar_one_or_none()

    if not installation:
        raise AppInstallerError(f"App {app_id} not installed for user {user_id}")

    installation.updated_at = datetime.utcnow()
    await db.commit()

    logger.info(f"[INSTALLER] Successfully updated {app_id}")


async def list_installed_apps(
    user_id: int,
    db: AsyncSession
) -> List[AppInstallation]:
    """
    List all apps installed for a user.

    Args:
        user_id: User ID
        db: Database session

    Returns:
        List of AppInstallation records
    """
    result = await db.execute(
        select(AppInstallation).where(
            and_(
                AppInstallation.user_id == user_id,
                AppInstallation.status == "installed"
            )
        )
    )
    installations = result.scalars().all()

    return list(installations)


async def is_app_installed(
    user_id: int,
    app_id: str,
    db: AsyncSession
) -> bool:
    """
    Check if an app is installed for a user.

    Args:
        user_id: User ID
        app_id: App identifier
        db: Database session

    Returns:
        True if installed, False otherwise
    """
    result = await db.execute(
        select(AppInstallation).where(
            and_(
                AppInstallation.user_id == user_id,
                AppInstallation.app_id == app_id,
                AppInstallation.status == "installed"
            )
        )
    )
    installation = result.scalar_one_or_none()

    return installation is not None
