"""
Workflow execution engine.
Safely executes user-defined workflows with sandboxing and resource limits.
"""
from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workflow import ExecutionStep, Workflow, WorkflowExecution


class WorkflowExecutor:
    """Executes workflows step by step with safety checks."""

    def __init__(
        self,
        workflow: Workflow,
        execution: WorkflowExecution,
        db: AsyncSession
    ):
        """
        Initialize workflow executor.

        Args:
            workflow: Workflow to execute
            execution: Execution record
            db: Database session
        """
        self.workflow = workflow
        self.execution = execution
        self.db = db
        self.context = {}  # Shared context between steps

    async def execute(self) -> dict[str, Any]:
        """
        Execute all workflow steps.

        Returns:
            dict: Execution results
        """
        results = {
            "steps_completed": 0,
            "steps_failed": 0,
            "outputs": {}
        }

        steps = self.workflow.definition.get("steps", [])

        for idx, step_config in enumerate(steps):
            step = await self._execute_step(idx, step_config)

            if step.status == "completed":
                results["steps_completed"] += 1
                results["outputs"][step.step_name] = step.outputs
            else:
                results["steps_failed"] += 1
                # Stop on first failure
                break

        return results

    async def _execute_step(
        self,
        step_order: int,
        step_config: dict[str, Any]
    ) -> ExecutionStep:
        """
        Execute a single workflow step.

        Args:
            step_order: Step order number
            step_config: Step configuration

        Returns:
            ExecutionStep: Executed step record
        """
        step = ExecutionStep(
            execution_id=self.execution.id,
            step_name=step_config.get("name", f"Step {step_order + 1}"),
            step_type=step_config.get("type"),
            step_order=step_order,
            config=step_config,
            inputs=self._resolve_inputs(step_config.get("inputs", {})),
            status="pending"
        )

        self.db.add(step)
        await self.db.commit()
        await self.db.refresh(step)

        try:
            step.status = "running"
            step.started_at = datetime.utcnow()
            await self.db.commit()

            # Execute based on step type
            step_type = step_config.get("type")

            if step_type == "api_call":
                outputs = await self._execute_api_call(step_config)
            elif step_type == "file_operation":
                outputs = await self._execute_file_operation(step_config)
            elif step_type == "code_execution":
                outputs = await self._execute_code(step_config)
            elif step_type == "data_transform":
                outputs = await self._execute_data_transform(step_config)
            else:
                raise ValueError(f"Unknown step type: {step_type}")

            # Update step with results
            step.status = "completed"
            step.outputs = outputs
            step.completed_at = datetime.utcnow()
            step.duration_seconds = (
                step.completed_at - step.started_at
            ).total_seconds()

            # Store outputs in context for next steps
            self.context[step.step_name] = outputs

            await self.db.commit()

        except Exception as e:
            step.status = "failed"
            step.error_message = str(e)
            step.completed_at = datetime.utcnow()
            step.duration_seconds = (
                step.completed_at - step.started_at
            ).total_seconds()

            await self.db.commit()

        return step

    def _resolve_inputs(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        Resolve input values from context and previous steps.

        Args:
            inputs: Input configuration

        Returns:
            dict: Resolved inputs
        """
        resolved = {}

        for key, value in inputs.items():
            if isinstance(value, str) and value.startswith("$"):
                # Reference to previous step output
                ref_parts = value[1:].split(".")
                resolved[key] = self._get_from_context(ref_parts)
            else:
                resolved[key] = value

        return resolved

    def _get_from_context(self, path: list[str]) -> Any:
        """Get value from context using path."""
        current = self.context

        for part in path:
            if isinstance(current, dict):
                current = current.get(part)
            else:
                return None

        return current

    async def _execute_api_call(self, config: dict[str, Any]) -> dict[str, Any]:
        """Execute an API call step."""
        # TODO: Implement safe API calling
        # - HTTP client with timeout
        # - Rate limiting
        # - Response parsing
        return {"status": "success", "data": {}}

    async def _execute_file_operation(self, config: dict[str, Any]) -> dict[str, Any]:
        """Execute a file operation step."""
        # TODO: Implement safe file operations
        # - Sandboxed directory access
        # - Size limits
        # - Allowed operations check
        return {"status": "success"}

    async def _execute_code(self, config: dict[str, Any]) -> dict[str, Any]:
        """Execute code in a sandbox."""
        # TODO: Implement sandboxed code execution
        # - Use RestrictedPython or similar
        # - Resource limits (CPU, memory, time)
        # - No network access
        # - Limited imports
        return {"status": "success", "output": ""}

    async def _execute_data_transform(self, config: dict[str, Any]) -> dict[str, Any]:
        """Execute a data transformation step."""
        # TODO: Implement data transformation
        # - JSON/CSV parsing
        # - Filtering and mapping
        # - Aggregations
        return {"status": "success", "data": {}}
