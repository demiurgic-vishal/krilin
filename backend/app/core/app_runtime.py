"""
App Runtime System - Load and execute app code with platform context.

The runtime:
- Loads app Python modules dynamically
- Creates isolated execution environment
- Injects platform context
- Executes app actions with resource limits
- Handles errors and logging

For MVP, all apps are trusted (built by core team), so sandboxing is simplified.
Year 2 will add WebAssembly or strict containerization for user-generated apps.
"""
import logging
import importlib
import sys
import asyncio
from typing import Any, Dict, Optional, Callable
from pathlib import Path
import traceback

from app.core.platform_context import PlatformContext

logger = logging.getLogger(__name__)


class AppRuntimeError(Exception):
    """Raised when app execution fails."""
    pass


class AppModule:
    """
    Wrapper for a loaded app module.

    Provides access to app's actions, outputs, and metadata.
    """

    def __init__(self, app_id: str, module: Any, manifest: Dict[str, Any]):
        self.app_id = app_id
        self.module = module
        self.manifest = manifest

    def get_action(self, action_name: str) -> Optional[Callable]:
        """Get an action function from the app module."""
        if hasattr(self.module, action_name):
            return getattr(self.module, action_name)
        return None

    def get_output_function(self, output_id: str) -> Optional[Callable]:
        """Get an output function from the app module."""
        func_name = f"get_output_{output_id}"
        if hasattr(self.module, func_name):
            return getattr(self.module, func_name)
        return None

    def has_initialization(self) -> bool:
        """Check if app has an initialization function."""
        return hasattr(self.module, 'initialize_app')

    async def initialize(self, ctx: PlatformContext):
        """Initialize the app (called on first install)."""
        if self.has_initialization():
            init_func = getattr(self.module, 'initialize_app')
            if asyncio.iscoroutinefunction(init_func):
                await init_func(ctx)
            else:
                init_func(ctx)


class AppRuntime:
    """
    App Runtime - Manages app loading and execution.

    For MVP with trusted apps:
    - Simple module loading (importlib)
    - Basic timeout enforcement
    - Error handling and logging
    - No complex sandboxing (all apps trusted)

    For Year 2 with user-generated apps:
    - WebAssembly runtime or strict containers
    - Fine-grained resource limits
    - Static code analysis
    - Runtime monitoring
    """

    def __init__(self):
        self._loaded_modules: Dict[str, AppModule] = {}

    async def load_app(self, app_id: str, manifest: Dict[str, Any]) -> AppModule:
        """
        Load an app's Python module.

        Args:
            app_id: App identifier (e.g., "habit-tracker")
            manifest: App manifest dictionary

        Returns:
            AppModule instance

        Raises:
            AppRuntimeError: If loading fails
        """
        # Check cache first
        if app_id in self._loaded_modules:
            return self._loaded_modules[app_id]

        try:
            # Get module path from manifest
            # Format: apps.habit_tracker.backend
            module_path = manifest.get("code_module") or f"apps.{app_id.replace('-', '_')}.backend"

            logger.info(f"[RUNTIME] Loading app module: {module_path}")

            # Dynamically import the module
            try:
                module = importlib.import_module(module_path)
            except ModuleNotFoundError:
                # Try alternative path
                module_path = f"backend.apps.{app_id.replace('-', '_')}.backend"
                module = importlib.import_module(module_path)

            # Reload if already loaded (for development)
            if module_path in sys.modules:
                module = importlib.reload(module)

            # Wrap in AppModule
            app_module = AppModule(app_id, module, manifest)

            # Cache it
            self._loaded_modules[app_id] = app_module

            logger.info(f"[RUNTIME] Successfully loaded app: {app_id}")

            return app_module

        except Exception as e:
            logger.error(f"[RUNTIME] Failed to load app {app_id}: {e}")
            logger.error(traceback.format_exc())
            raise AppRuntimeError(f"Failed to load app '{app_id}': {str(e)}")

    async def execute_app_action(
        self,
        ctx: PlatformContext,
        action_name: str,
        params: Dict[str, Any],
        timeout: int = 30
    ) -> Any:
        """
        Execute an app action with context.

        Args:
            ctx: Platform context (scoped to user and app)
            action_name: Name of the action to execute
            params: Action parameters
            timeout: Execution timeout in seconds (default: 30s)

        Returns:
            Action result

        Raises:
            AppRuntimeError: If execution fails
        """
        app_id = ctx.app_id

        try:
            # Load app module
            manifest = {}  # Will be loaded from database in production
            app_module = await self.load_app(app_id, manifest)

            # Get action function
            action_func = app_module.get_action(action_name)

            if not action_func:
                raise AppRuntimeError(
                    f"Action '{action_name}' not found in app '{app_id}'"
                )

            logger.info(
                f"[RUNTIME] Executing {app_id}.{action_name} "
                f"for user {ctx.user_id}"
            )
            logger.info(f"[RUNTIME] Params received: {params}")
            logger.info(f"[RUNTIME] Params keys: {list(params.keys())}")

            # Execute with timeout
            try:
                if asyncio.iscoroutinefunction(action_func):
                    result = await asyncio.wait_for(
                        action_func(ctx, **params),
                        timeout=timeout
                    )
                else:
                    # Sync function, run in executor with timeout
                    loop = asyncio.get_event_loop()
                    result = await asyncio.wait_for(
                        loop.run_in_executor(None, action_func, ctx, **params),
                        timeout=timeout
                    )

                logger.info(f"[RUNTIME] Action {app_id}.{action_name} completed successfully")

                return result

            except asyncio.TimeoutError:
                logger.error(f"[RUNTIME] Action {app_id}.{action_name} timed out after {timeout}s")
                raise AppRuntimeError(
                    f"Action '{action_name}' timed out after {timeout} seconds"
                )

        except AppRuntimeError:
            raise
        except Exception as e:
            logger.error(f"[RUNTIME] Error executing {app_id}.{action_name}: {e}")
            logger.error(traceback.format_exc())
            raise AppRuntimeError(f"Error executing action: {str(e)}")

    async def execute_app_output(
        self,
        ctx: PlatformContext,
        output_id: str
    ) -> Any:
        """
        Execute an app's output function.

        Args:
            ctx: Platform context
            output_id: Output identifier (e.g., "daily_streaks")

        Returns:
            Output data

        Raises:
            AppRuntimeError: If execution fails
        """
        app_id = ctx.app_id

        try:
            # Load app module
            manifest = {}  # Will be loaded from database in production
            app_module = await self.load_app(app_id, manifest)

            # Get output function
            output_func = app_module.get_output_function(output_id)

            if not output_func:
                raise AppRuntimeError(
                    f"Output '{output_id}' not found in app '{app_id}'"
                )

            logger.info(f"[RUNTIME] Getting output {app_id}.{output_id}")

            # Execute
            if asyncio.iscoroutinefunction(output_func):
                result = await output_func(ctx)
            else:
                result = output_func(ctx)

            return result

        except AppRuntimeError:
            raise
        except Exception as e:
            logger.error(f"[RUNTIME] Error getting output {app_id}.{output_id}: {e}")
            raise AppRuntimeError(f"Error getting output: {str(e)}")

    async def initialize_app(
        self,
        ctx: PlatformContext,
        manifest: Dict[str, Any]
    ):
        """
        Initialize an app (called on installation).

        Creates database tables and runs any initialization logic.

        Args:
            ctx: Platform context
            manifest: App manifest
        """
        app_id = ctx.app_id

        try:
            logger.info(f"[RUNTIME] Initializing app: {app_id}")

            # Load app module
            app_module = await self.load_app(app_id, manifest)

            # Tables are already created by installer, so skip table creation here

            # Run app's initialization function (if exists)
            await app_module.initialize(ctx)

            logger.info(f"[RUNTIME] App {app_id} initialized successfully")

        except Exception as e:
            logger.error(f"[RUNTIME] Failed to initialize app {app_id}: {e}")
            raise AppRuntimeError(f"Failed to initialize app: {str(e)}")

    async def _create_app_tables(
        self,
        ctx: PlatformContext,
        manifest: Dict[str, Any]
    ):
        """
        Create database tables for an app.

        Tables are created with naming: app_{app_id}_{table_name}

        Args:
            ctx: Platform context
            manifest: App manifest with database schema
        """
        from sqlalchemy import text

        database_spec = manifest.get("database", {})
        tables = database_spec.get("tables", [])

        for table_spec in tables:
            table_name = table_spec["name"]
            schema = table_spec["schema"]

            # Build full table name
            full_table_name = f"app_{ctx.app_id.replace('-', '_')}_{table_name}"

            logger.info(f"[RUNTIME] Creating table: {full_table_name}")

            # Build CREATE TABLE SQL
            # All tables have: id (PK), user_id (scoping), data (JSONB), created_at, updated_at
            create_sql = f"""
                CREATE TABLE IF NOT EXISTS {full_table_name} (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    data JSONB NOT NULL DEFAULT '{{}}'::jsonb,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                );

                -- Index on user_id for fast scoping
                CREATE INDEX IF NOT EXISTS idx_{full_table_name}_user_id
                ON {full_table_name}(user_id);

                -- Index on updated_at for sorting
                CREATE INDEX IF NOT EXISTS idx_{full_table_name}_updated_at
                ON {full_table_name}(updated_at);
            """

            # Execute
            await ctx._db.execute(text(create_sql))
            await ctx._db.commit()

            logger.info(f"[RUNTIME] Table {full_table_name} created successfully")

    def clear_cache(self, app_id: Optional[str] = None):
        """
        Clear module cache.

        Useful for development when app code changes.

        Args:
            app_id: Specific app to clear, or None for all apps
        """
        if app_id:
            if app_id in self._loaded_modules:
                del self._loaded_modules[app_id]
                logger.info(f"[RUNTIME] Cleared cache for app: {app_id}")
        else:
            self._loaded_modules.clear()
            logger.info("[RUNTIME] Cleared all app module cache")


# Global runtime instance
_runtime: Optional[AppRuntime] = None


def get_app_runtime() -> AppRuntime:
    """Get the global app runtime instance."""
    global _runtime
    if _runtime is None:
        _runtime = AppRuntime()
    return _runtime


# Convenience functions

async def load_app(app_id: str, manifest: Dict[str, Any]) -> AppModule:
    """Load an app module."""
    runtime = get_app_runtime()
    return await runtime.load_app(app_id, manifest)


async def execute_app_action(
    ctx: PlatformContext,
    action_name: str,
    params: Dict[str, Any],
    timeout: int = 30
) -> Any:
    """Execute an app action."""
    runtime = get_app_runtime()
    return await runtime.execute_app_action(ctx, action_name, params, timeout)


async def execute_app_output(
    ctx: PlatformContext,
    output_id: str
) -> Any:
    """Execute an app's output function."""
    runtime = get_app_runtime()
    return await runtime.execute_app_output(ctx, output_id)


async def initialize_app(
    ctx: PlatformContext,
    manifest: Dict[str, Any]
):
    """Initialize an app on installation."""
    runtime = get_app_runtime()
    return await runtime.initialize_app(ctx, manifest)
