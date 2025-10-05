"""
Apps API - ctx.apps implementation.

Enables inter-app communication and composition:
- ctx.apps.is_installed(app_id) - Check if app installed
- ctx.apps.get(app_id).get_output(output_id) - Access app outputs
- ctx.apps.get(app_id).query(method, params) - Call app methods
- ctx.apps.list_installed() - List user's installed apps

Apps can depend on each other and access shared outputs.
"""
import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.app_platform import App, AppInstallation, AppOutput

logger = logging.getLogger(__name__)


class AppProxy:
    """
    Proxy for accessing another app's capabilities.

    Created when you call ctx.apps.get("app-id")
    """

    def __init__(self, app_id: str, user_id: int, db: AsyncSession, requesting_app_id: str):
        self.app_id = app_id
        self.user_id = user_id
        self.db = db
        self.requesting_app_id = requesting_app_id

    async def get_output(self, output_id: str) -> Any:
        """
        Get data from an app's output.

        Args:
            output_id: Output identifier (e.g., "daily_streaks")

        Returns:
            Output data

        Example:
            # In Analytics Dashboard app
            streaks = await ctx.apps.get("habit-tracker").get_output("daily_streaks")
        """
        # Get output definition
        result = await self.db.execute(
            select(AppOutput).where(
                AppOutput.app_id == self.app_id,
                AppOutput.output_id == output_id
            )
        )
        output_def = result.scalar_one_or_none()

        if not output_def:
            raise ValueError(f"Output '{output_id}' not found in app '{self.app_id}'")

        # Check access level
        if output_def.access_level == "requires_permission":
            # TODO: Check if requesting app has permission
            pass

        # Load the app module and call the output function
        # This is where we dynamically load app code
        try:
            app_module = await self._load_app_module()

            if hasattr(app_module, f"get_output_{output_id}"):
                output_func = getattr(app_module, f"get_output_{output_id}")

                # Create context for the target app
                from app.core.context_factory import create_app_context

                target_ctx = await create_app_context(
                    user_id=self.user_id,
                    app_id=self.app_id,
                    db=self.db
                )

                # Call the output function with the target app's context
                return await output_func(target_ctx)
            else:
                raise ValueError(
                    f"App '{self.app_id}' does not implement get_output_{output_id}"
                )

        except ImportError as e:
            logger.error(f"Failed to load app module for '{self.app_id}': {e}")
            raise ValueError(f"App '{self.app_id}' module not found")

    async def query(self, method: str, params: Dict[str, Any] = None) -> Any:
        """
        Call an app method.

        Args:
            method: Method name
            params: Method parameters

        Returns:
            Method result

        Example:
            stats = await ctx.apps.get("habit-tracker").query("get_stats", {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31"
            })
        """
        params = params or {}

        # Load app module and call method
        try:
            app_module = await self._load_app_module()

            if not hasattr(app_module, method):
                raise ValueError(f"App '{self.app_id}' does not have method '{method}'")

            method_func = getattr(app_module, method)

            # Create context for the target app
            from app.core.context_factory import create_app_context

            target_ctx = await create_app_context(
                user_id=self.user_id,
                app_id=self.app_id,
                db=self.db
            )

            # Call the method with context and params
            return await method_func(target_ctx, **params)

        except ImportError as e:
            logger.error(f"Failed to load app module for '{self.app_id}': {e}")
            raise ValueError(f"App '{self.app_id}' module not found")

    async def query_agent(self, prompt: str) -> str:
        """
        Query another app's Claude agent.

        Args:
            prompt: Prompt for the agent

        Returns:
            Agent response

        Example:
            response = await ctx.apps.get("finance-tracker").query_agent(
                "What was my total spending last month?"
            )
        """
        # TODO: Implement agent-to-agent communication
        # This would create a conversation with the target app's agent
        raise NotImplementedError("Agent-to-agent communication not yet implemented")

    async def _load_app_module(self):
        """Load the app's Python module."""
        # Get app code_module path from database
        result = await self.db.execute(
            select(App).where(App.id == self.app_id)
        )
        app = result.scalar_one_or_none()

        if not app or not app.code_module:
            raise ImportError(f"App '{self.app_id}' has no code module")

        # Dynamically import the module
        import importlib
        return importlib.import_module(app.code_module)


class AppsAPI:
    """
    Apps API for inter-app communication.

    Available via ctx.apps in any app.
    """

    def __init__(self, db: AsyncSession, user_id: int, app_id: str, context: Any):
        self.db = db
        self.user_id = user_id
        self.app_id = app_id  # Requesting app
        self.context = context

    async def is_installed(self, app_id: str) -> bool:
        """
        Check if an app is installed for the current user.

        Args:
            app_id: App ID to check

        Returns:
            True if installed, False otherwise

        Example:
            if await ctx.apps.is_installed("calendar"):
                # Use calendar app
                pass
        """
        result = await self.db.execute(
            select(AppInstallation).where(
                AppInstallation.user_id == self.user_id,
                AppInstallation.app_id == app_id,
                AppInstallation.status == "installed"
            )
        )
        return result.scalar_one_or_none() is not None

    def get(self, app_id: str) -> AppProxy:
        """
        Get a proxy to interact with another app.

        Args:
            app_id: App ID

        Returns:
            AppProxy instance

        Example:
            habit_tracker = ctx.apps.get("habit-tracker")
            streaks = await habit_tracker.get_output("daily_streaks")
        """
        return AppProxy(
            app_id=app_id,
            user_id=self.user_id,
            db=self.db,
            requesting_app_id=self.app_id
        )

    async def list_installed(self) -> List[Dict[str, Any]]:
        """
        List all apps installed by current user.

        Returns:
            List of installed app info

        Example:
            apps = await ctx.apps.list_installed()
            for app in apps:
                print(f"{app['name']} v{app['version']}")
        """
        from app.core.context_factory import get_installed_apps

        return await get_installed_apps(
            user_id=self.user_id,
            db=self.db,
            status="installed"
        )

    async def get_dependencies(self, app_id: Optional[str] = None) -> List[Dict[str, str]]:
        """
        Get dependencies for an app.

        Args:
            app_id: App ID (defaults to current app)

        Returns:
            List of dependencies with version constraints

        Example:
            deps = await ctx.apps.get_dependencies()
            # [{"id": "calendar", "version": "^1.0.0", "required": true}]
        """
        app_id = app_id or self.app_id

        result = await self.db.execute(
            select(App).where(App.id == app_id)
        )
        app = result.scalar_one_or_none()

        if not app:
            return []

        manifest = app.manifest or {}
        deps_data = manifest.get("dependencies", {})

        dependencies = []

        # Add required dependencies
        for dep in deps_data.get("required_apps", []):
            dependencies.append({
                **dep,
                "required": True
            })

        # Add optional dependencies
        for dep in deps_data.get("optional_apps", []):
            dependencies.append({
                **dep,
                "required": False
            })

        return dependencies

    async def check_dependencies_installed(self, app_id: Optional[str] = None) -> Dict[str, bool]:
        """
        Check if all dependencies are installed.

        Args:
            app_id: App ID (defaults to current app)

        Returns:
            Dict mapping app_id -> installed status

        Example:
            status = await ctx.apps.check_dependencies_installed()
            # {"calendar": True, "habit-tracker": False}
        """
        dependencies = await self.get_dependencies(app_id)

        status = {}
        for dep in dependencies:
            dep_app_id = dep["id"]
            is_installed = await self.is_installed(dep_app_id)
            status[dep_app_id] = is_installed

        return status
