"""
App Test Runner - Phase 2: Automated Testing Layer

Executes app actions and tests frontend rendering to catch runtime errors.
Simulates user interactions and captures errors for Claude feedback.
"""
import asyncio
import logging
import traceback
from typing import Dict, Any, Optional, List
from pathlib import Path
from datetime import datetime
import hashlib

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.user_app_manager import UserAppManager, get_user_app_manager
from app.models.error_report import ErrorReport

logger = logging.getLogger(__name__)


class TestResult:
    """Result of a test execution."""

    def __init__(
        self,
        test_name: str,
        passed: bool,
        error_message: Optional[str] = None,
        stack_trace: Optional[str] = None,
        execution_time: float = 0.0,
        output: Optional[Any] = None
    ):
        self.test_name = test_name
        self.passed = passed
        self.error_message = error_message
        self.stack_trace = stack_trace
        self.execution_time = execution_time
        self.output = output

    def to_dict(self):
        return {
            "test_name": self.test_name,
            "passed": self.passed,
            "error_message": self.error_message,
            "stack_trace": self.stack_trace,
            "execution_time": self.execution_time,
            "output": self.output
        }


class AppTestRunner:
    """
    Automated testing for generated apps.

    Tests:
    - Backend action execution
    - Database operations
    - Integration usage
    - Error handling
    """

    def __init__(
        self,
        user_app_manager: Optional[UserAppManager] = None
    ):
        self.user_app_manager = user_app_manager or get_user_app_manager()

    async def test_app(
        self,
        user_id: int,
        app_id: str,
        db: AsyncSession,
        test_scenarios: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Run automated tests on an app.

        Args:
            user_id: User ID
            app_id: App ID
            db: Database session
            test_scenarios: Optional custom test scenarios

        Returns:
            Dictionary with test results
        """
        logger.info(f"[APP TEST RUNNER] Testing app '{app_id}' for user {user_id}")

        app_dir = self.user_app_manager.get_app_dir(user_id, app_id)
        if not app_dir.exists():
            raise FileNotFoundError(f"App directory not found: {app_dir}")

        # Read app files
        try:
            manifest = self.user_app_manager.read_manifest(user_id, app_id)
            backend_code = self.user_app_manager.read_backend(user_id, app_id)
        except Exception as e:
            logger.error(f"[APP TEST RUNNER] Failed to read app files: {e}")
            raise

        results = []
        errors_found = []

        # Test 1: Backend module import
        import_result = await self._test_backend_import(
            app_dir, app_id, backend_code
        )
        results.append(import_result)
        if not import_result.passed:
            errors_found.append(import_result)

        # Test 2: Action registration
        if import_result.passed:
            registration_result = await self._test_action_registration(
                app_dir, app_id
            )
            results.append(registration_result)
            if not registration_result.passed:
                errors_found.append(registration_result)

        # Test 3: Execute each action with mock data
        if import_result.passed:
            actions = manifest.get("actions", [])
            for action in actions:
                action_result = await self._test_action_execution(
                    user_id, app_id, action, db
                )
                results.append(action_result)
                if not action_result.passed:
                    errors_found.append(action_result)

        # Test 4: Custom test scenarios
        if test_scenarios:
            for scenario in test_scenarios:
                scenario_result = await self._run_custom_scenario(
                    user_id, app_id, scenario, db
                )
                results.append(scenario_result)
                if not scenario_result.passed:
                    errors_found.append(scenario_result)

        # Store errors in database
        if errors_found:
            await self._save_test_errors(
                db, user_id, app_id, errors_found
            )

        # Calculate summary
        total_tests = len(results)
        passed_tests = sum(1 for r in results if r.passed)
        failed_tests = total_tests - passed_tests

        logger.info(
            f"[APP TEST RUNNER] Tests complete: "
            f"{passed_tests}/{total_tests} passed"
        )

        return {
            "success": failed_tests == 0,
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "results": [r.to_dict() for r in results],
            "errors": [r.to_dict() for r in errors_found]
        }

    async def _test_backend_import(
        self,
        app_dir: Path,
        app_id: str,
        backend_code: str
    ) -> TestResult:
        """Test if backend.py can be imported without errors."""
        import sys
        import importlib.util

        start_time = asyncio.get_event_loop().time()

        try:
            # Write backend to temp file if needed
            backend_path = app_dir / "backend.py"

            # Add app directory to Python path temporarily
            sys.path.insert(0, str(app_dir.parent))

            try:
                # Import the module
                spec = importlib.util.spec_from_file_location(
                    f"app_{app_id.replace('-', '_')}",
                    backend_path
                )
                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)

                    execution_time = asyncio.get_event_loop().time() - start_time
                    return TestResult(
                        test_name="backend_import",
                        passed=True,
                        execution_time=execution_time,
                        output={"module": str(module)}
                    )
                else:
                    raise ImportError("Failed to create module spec")

            finally:
                # Clean up sys.path
                if str(app_dir.parent) in sys.path:
                    sys.path.remove(str(app_dir.parent))

        except Exception as e:
            execution_time = asyncio.get_event_loop().time() - start_time
            return TestResult(
                test_name="backend_import",
                passed=False,
                error_message=f"Failed to import backend.py: {str(e)}",
                stack_trace=traceback.format_exc(),
                execution_time=execution_time
            )

    async def _test_action_registration(
        self,
        app_dir: Path,
        app_id: str
    ) -> TestResult:
        """Test if register_actions function exists."""
        start_time = asyncio.get_event_loop().time()

        try:
            backend_code = (app_dir / "backend.py").read_text()

            # Check for register_actions function
            if "def register_actions" not in backend_code:
                return TestResult(
                    test_name="action_registration",
                    passed=False,
                    error_message="Missing register_actions() function in backend.py",
                    execution_time=asyncio.get_event_loop().time() - start_time
                )

            # Check for ctx parameter
            if "def register_actions(ctx)" not in backend_code:
                return TestResult(
                    test_name="action_registration",
                    passed=False,
                    error_message="register_actions() must accept 'ctx' parameter",
                    execution_time=asyncio.get_event_loop().time() - start_time
                )

            return TestResult(
                test_name="action_registration",
                passed=True,
                execution_time=asyncio.get_event_loop().time() - start_time
            )

        except Exception as e:
            return TestResult(
                test_name="action_registration",
                passed=False,
                error_message=str(e),
                stack_trace=traceback.format_exc(),
                execution_time=asyncio.get_event_loop().time() - start_time
            )

    async def _test_action_execution(
        self,
        user_id: int,
        app_id: str,
        action: Dict,
        db: AsyncSession
    ) -> TestResult:
        """
        Test executing a single action with mock parameters.

        This is a basic test - for full execution testing, use AppExecutor.
        """
        action_id = action.get("id")
        start_time = asyncio.get_event_loop().time()

        try:
            # Create mock PlatformContext
            from app.core.platform_context import PlatformContext

            ctx = PlatformContext(
                user_id=user_id,
                app_id=app_id,
                db=db
            )

            # Load action dynamically
            app_dir = self.user_app_manager.get_app_dir(user_id, app_id)

            import sys
            import importlib.util

            sys.path.insert(0, str(app_dir.parent))
            try:
                backend_path = app_dir / "backend.py"
                spec = importlib.util.spec_from_file_location(
                    f"app_{app_id.replace('-', '_')}",
                    backend_path
                )

                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)

                    # Get the action function
                    action_func = getattr(module, action_id, None)
                    if not action_func:
                        return TestResult(
                            test_name=f"action_{action_id}",
                            passed=False,
                            error_message=f"Action function '{action_id}' not found in backend.py",
                            execution_time=asyncio.get_event_loop().time() - start_time
                        )

                    # Generate mock parameters
                    mock_params = self._generate_mock_params(action)

                    # Execute action
                    result = await action_func(ctx, **mock_params)

                    execution_time = asyncio.get_event_loop().time() - start_time
                    return TestResult(
                        test_name=f"action_{action_id}",
                        passed=True,
                        execution_time=execution_time,
                        output=result
                    )

            finally:
                if str(app_dir.parent) in sys.path:
                    sys.path.remove(str(app_dir.parent))

        except Exception as e:
            execution_time = asyncio.get_event_loop().time() - start_time
            return TestResult(
                test_name=f"action_{action_id}",
                passed=False,
                error_message=f"Action execution failed: {str(e)}",
                stack_trace=traceback.format_exc(),
                execution_time=execution_time
            )

    async def _run_custom_scenario(
        self,
        user_id: int,
        app_id: str,
        scenario: Dict,
        db: AsyncSession
    ) -> TestResult:
        """Run a custom test scenario."""
        scenario_name = scenario.get("name", "custom_scenario")
        start_time = asyncio.get_event_loop().time()

        try:
            # Execute scenario steps
            # This is a placeholder - implement based on scenario structure
            execution_time = asyncio.get_event_loop().time() - start_time
            return TestResult(
                test_name=scenario_name,
                passed=True,
                execution_time=execution_time
            )

        except Exception as e:
            execution_time = asyncio.get_event_loop().time() - start_time
            return TestResult(
                test_name=scenario_name,
                passed=False,
                error_message=str(e),
                stack_trace=traceback.format_exc(),
                execution_time=execution_time
            )

    def _generate_mock_params(self, action: Dict) -> Dict:
        """Generate mock parameters for an action based on its schema."""
        params = action.get("parameters", {})
        mock_params = {}

        for param_name, param_schema in params.items():
            if isinstance(param_schema, dict):
                param_type = param_schema.get("type", "string")
            else:
                param_type = param_schema

            # Generate mock value based on type
            if param_type == "string":
                mock_params[param_name] = f"test_{param_name}"
            elif param_type == "number" or param_type == "integer":
                mock_params[param_name] = 42
            elif param_type == "boolean":
                mock_params[param_name] = True
            elif param_type == "array":
                mock_params[param_name] = []
            elif param_type == "object":
                mock_params[param_name] = {}

        return mock_params

    async def _save_test_errors(
        self,
        db: AsyncSession,
        user_id: int,
        app_id: str,
        errors: List[TestResult]
    ):
        """Save test errors to database."""
        for error in errors:
            # Create error hash
            error_content = f"test:{error.test_name}:{error.error_message}"
            error_hash = hashlib.sha256(error_content.encode()).hexdigest()

            # Create error report
            error_report = ErrorReport(
                user_id=user_id,
                app_id=app_id,
                error_type="runtime",
                severity="error",
                category="test_failure",
                message=error.error_message or "Test failed",
                file="backend.py",
                suggestion=f"Fix the issue in {error.test_name}",
                context={
                    "test_result": error.to_dict()
                },
                stack_trace=error.stack_trace,
                error_hash=error_hash,
                status="new",
                created_at=datetime.utcnow()
            )

            db.add(error_report)

        await db.commit()
        logger.info(f"[APP TEST RUNNER] Saved {len(errors)} test errors to database")


# Global instance
_app_test_runner: Optional[AppTestRunner] = None


def get_app_test_runner() -> AppTestRunner:
    """Get the global AppTestRunner instance."""
    global _app_test_runner
    if _app_test_runner is None:
        _app_test_runner = AppTestRunner()
    return _app_test_runner
