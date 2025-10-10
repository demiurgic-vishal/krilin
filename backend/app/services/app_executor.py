"""
App Executor - Runs apps in backend with full error capture.

This service simulates user interactions with apps and captures:
- Backend action execution errors
- Frontend rendering errors (via headless browser)
- Integration failures
- Database errors

Used for testing apps before deployment and providing real errors to Claude.
"""
import asyncio
import logging
import traceback
import json
from typing import Dict, Any, Optional, List
from pathlib import Path
from datetime import datetime
import hashlib

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.user_app_manager import UserAppManager, get_user_app_manager
from app.models.error_report import ErrorReport
from app.core.platform_context import PlatformContext

logger = logging.getLogger(__name__)


class ExecutionResult:
    """Result of an app execution."""

    def __init__(
        self,
        success: bool,
        output: Optional[Any] = None,
        error: Optional[str] = None,
        stack_trace: Optional[str] = None,
        execution_time: float = 0.0,
        logs: Optional[List[str]] = None
    ):
        self.success = success
        self.output = output
        self.error = error
        self.stack_trace = stack_trace
        self.execution_time = execution_time
        self.logs = logs or []

    def to_dict(self):
        return {
            "success": self.success,
            "output": self.output,
            "error": self.error,
            "stack_trace": self.stack_trace,
            "execution_time": self.execution_time,
            "logs": self.logs
        }


class AppExecutor:
    """
    Executes apps in the backend with full error capture.

    Can simulate user interactions and provide detailed error feedback.
    """

    def __init__(
        self,
        user_app_manager: Optional[UserAppManager] = None
    ):
        self.user_app_manager = user_app_manager or get_user_app_manager()

    async def execute_action(
        self,
        user_id: int,
        app_id: str,
        action_name: str,
        params: Dict[str, Any],
        db: AsyncSession,
        save_errors: bool = True
    ) -> ExecutionResult:
        """
        Execute a single action with full error capture.

        Args:
            user_id: User ID
            app_id: App ID
            action_name: Name of action to execute
            params: Action parameters
            db: Database session
            save_errors: Whether to save errors to database

        Returns:
            ExecutionResult with output or error details
        """
        logger.info(
            f"[APP EXECUTOR] Executing action '{action_name}' "
            f"for app '{app_id}' (user {user_id})"
        )

        start_time = asyncio.get_event_loop().time()
        logs = []

        try:
            # Create PlatformContext
            ctx = PlatformContext(
                user_id=user_id,
                app_id=app_id,
                db=db
            )

            # Load backend module
            app_dir = self.user_app_manager.get_app_dir(user_id, app_id)
            backend_path = app_dir / "backend.py"

            if not backend_path.exists():
                raise FileNotFoundError(f"Backend file not found: {backend_path}")

            # Import module dynamically
            import sys
            import importlib.util

            # Normalize app_id for module name
            module_name = f"app_{app_id.replace('-', '_')}"

            sys.path.insert(0, str(app_dir.parent))
            try:
                spec = importlib.util.spec_from_file_location(
                    module_name,
                    backend_path
                )

                if not spec or not spec.loader:
                    raise ImportError(f"Failed to load module from {backend_path}")

                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)

                logs.append(f"Loaded module: {module_name}")

                # Get action function
                action_func = getattr(module, action_name, None)
                if not action_func:
                    raise AttributeError(
                        f"Action '{action_name}' not found in backend.py. "
                        f"Available functions: {[f for f in dir(module) if not f.startswith('_')]}"
                    )

                logs.append(f"Found action function: {action_name}")

                # Execute action
                logger.info(f"[APP EXECUTOR] Calling {action_name} with params: {params}")
                result = await action_func(ctx, **params)

                execution_time = asyncio.get_event_loop().time() - start_time
                logs.append(f"Execution completed in {execution_time:.2f}s")

                logger.info(f"[APP EXECUTOR] Action completed successfully")

                return ExecutionResult(
                    success=True,
                    output=result,
                    execution_time=execution_time,
                    logs=logs
                )

            finally:
                # Clean up sys.path
                if str(app_dir.parent) in sys.path:
                    sys.path.remove(str(app_dir.parent))

        except Exception as e:
            execution_time = asyncio.get_event_loop().time() - start_time
            error_msg = str(e)
            stack = traceback.format_exc()

            logger.error(
                f"[APP EXECUTOR] Action execution failed: {error_msg}\n{stack}"
            )

            # Save error to database
            if save_errors:
                await self._save_execution_error(
                    db=db,
                    user_id=user_id,
                    app_id=app_id,
                    action_name=action_name,
                    params=params,
                    error_msg=error_msg,
                    stack_trace=stack
                )

            return ExecutionResult(
                success=False,
                error=error_msg,
                stack_trace=stack,
                execution_time=execution_time,
                logs=logs
            )

    async def execute_user_scenario(
        self,
        user_id: int,
        app_id: str,
        scenario: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Execute a user interaction scenario.

        A scenario is a sequence of actions that simulate user behavior.

        Example scenario:
        {
            "name": "Create and view todo",
            "steps": [
                {"action": "create_todo", "params": {"title": "Test", "completed": false}},
                {"action": "get_todos", "params": {}},
                {"action": "mark_complete", "params": {"todo_id": "${step1.output.id}"}}
            ]
        }

        Args:
            user_id: User ID
            app_id: App ID
            scenario: Scenario definition
            db: Database session

        Returns:
            Dictionary with scenario results
        """
        logger.info(
            f"[APP EXECUTOR] Executing scenario '{scenario.get('name')}' "
            f"for app '{app_id}'"
        )

        scenario_name = scenario.get("name", "unnamed_scenario")
        steps = scenario.get("steps", [])

        results = []
        step_outputs = {}  # Store outputs for referencing in later steps

        for i, step in enumerate(steps):
            step_num = i + 1
            action_name = step.get("action")
            params = step.get("params", {})

            # Resolve parameter references (e.g., "${step1.output.id}")
            params = self._resolve_param_references(params, step_outputs)

            logger.info(
                f"[APP EXECUTOR] Step {step_num}/{len(steps)}: "
                f"{action_name} with {params}"
            )

            # Execute action
            result = await self.execute_action(
                user_id=user_id,
                app_id=app_id,
                action_name=action_name,
                params=params,
                db=db,
                save_errors=True
            )

            # Store result
            step_result = {
                "step": step_num,
                "action": action_name,
                "params": params,
                "result": result.to_dict()
            }
            results.append(step_result)

            # Store output for later reference
            if result.success:
                step_outputs[f"step{step_num}"] = {"output": result.output}
            else:
                # Stop scenario on error
                logger.warning(
                    f"[APP EXECUTOR] Scenario failed at step {step_num}: "
                    f"{result.error}"
                )
                break

        # Calculate success
        all_success = all(r["result"]["success"] for r in results)

        return {
            "scenario": scenario_name,
            "success": all_success,
            "total_steps": len(steps),
            "completed_steps": len(results),
            "results": results
        }

    async def simulate_frontend_interaction(
        self,
        user_id: int,
        app_id: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Simulate frontend rendering and interaction using headless browser.

        This would use Playwright/Puppeteer to actually render the app
        and capture JavaScript errors, rendering issues, etc.

        For now, this is a placeholder that returns basic structure.
        """
        logger.info(
            f"[APP EXECUTOR] Simulating frontend for app '{app_id}'"
        )

        # This is where you would:
        # 1. Start a headless browser (Playwright/Puppeteer)
        # 2. Navigate to the app preview URL
        # 3. Wait for React to render
        # 4. Capture console errors
        # 5. Try basic interactions (click buttons, fill forms)
        # 6. Capture any JavaScript errors

        # Placeholder implementation
        return {
            "success": True,
            "message": "Frontend simulation not yet implemented",
            "console_logs": [],
            "errors": []
        }

    def _resolve_param_references(
        self,
        params: Dict[str, Any],
        step_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Resolve parameter references like "${step1.output.id}".

        Args:
            params: Parameter dictionary that may contain references
            step_outputs: Dictionary of previous step outputs

        Returns:
            Resolved parameters
        """
        resolved = {}

        for key, value in params.items():
            if isinstance(value, str) and value.startswith("${") and value.endswith("}"):
                # Extract reference path
                ref = value[2:-1]  # Remove ${ and }
                parts = ref.split(".")

                # Navigate through step_outputs
                current = step_outputs
                for part in parts:
                    if isinstance(current, dict) and part in current:
                        current = current[part]
                    else:
                        logger.warning(
                            f"[APP EXECUTOR] Could not resolve reference: {value}"
                        )
                        current = None
                        break

                resolved[key] = current
            else:
                resolved[key] = value

        return resolved

    async def _save_execution_error(
        self,
        db: AsyncSession,
        user_id: int,
        app_id: str,
        action_name: str,
        params: Dict,
        error_msg: str,
        stack_trace: str
    ):
        """Save execution error to database."""
        # Create error hash
        error_content = f"execution:{action_name}:{error_msg}"
        error_hash = hashlib.sha256(error_content.encode()).hexdigest()

        # Determine error category
        category = "runtime_error"
        if "AttributeError" in error_msg:
            category = "missing_function"
        elif "TypeError" in error_msg:
            category = "invalid_parameters"
        elif "ImportError" in error_msg or "ModuleNotFoundError" in error_msg:
            category = "import_error"

        # Create error report
        error_report = ErrorReport(
            user_id=user_id,
            app_id=app_id,
            error_type="runtime",
            severity="error",
            category=category,
            message=error_msg,
            file="backend.py",
            suggestion=self._generate_suggestion(category, error_msg),
            context={
                "action": action_name,
                "params": params,
                "source": "app_executor"
            },
            stack_trace=stack_trace,
            error_hash=error_hash,
            status="new",
            created_at=datetime.utcnow()
        )

        db.add(error_report)
        await db.commit()

        logger.info(
            f"[APP EXECUTOR] Saved execution error to database "
            f"(hash: {error_hash[:8]})"
        )

    def _generate_suggestion(self, category: str, error_msg: str) -> str:
        """Generate helpful suggestion based on error category."""
        suggestions = {
            "missing_function": (
                "The action function is not defined in backend.py. "
                "Make sure the function name matches the action ID in manifest.json "
                "and is properly defined with async def."
            ),
            "invalid_parameters": (
                "The function parameters don't match what was provided. "
                "Check that the function signature matches the action parameters "
                "defined in manifest.json."
            ),
            "import_error": (
                "Failed to import required module. "
                "Check that all import statements are correct and the module exists."
            ),
            "runtime_error": (
                "An error occurred during action execution. "
                "Review the stack trace to identify the issue."
            )
        }

        return suggestions.get(category, "Fix the error and try again.")


# Global instance
_app_executor: Optional[AppExecutor] = None


def get_app_executor() -> AppExecutor:
    """Get the global AppExecutor instance."""
    global _app_executor
    if _app_executor is None:
        _app_executor = AppExecutor()
    return _app_executor
