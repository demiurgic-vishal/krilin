"""
Claude-powered Coding Agent using Claude Agent SDK.
Provides real execution capabilities: terminal access, file operations, code editing.
"""
from typing import Any, Dict, List, Optional, AsyncIterator, Callable
import asyncio
import os

from pydantic import BaseModel
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, AssistantMessage, TextBlock, ToolUseBlock, ResultMessage

from app.config import settings


class ClaudeAgentResponse(BaseModel):
    """Response from Claude Coding Agent with execution results."""
    content: str
    metadata: Dict[str, Any] = {}
    suggestions: Optional[List[str]] = None
    tools_used: Optional[List[str]] = None
    files_created: Optional[List[str]] = None
    files_modified: Optional[List[str]] = None
    commands_executed: Optional[List[str]] = None
    execution_success: bool = True
    error_message: Optional[str] = None
    total_cost_usd: Optional[float] = None
    duration_ms: Optional[int] = None
    num_turns: Optional[int] = None


class StreamEvent(BaseModel):
    """Streaming event from Claude Agent."""
    event_type: str  # "text", "tool_use", "result", "error"
    content: Any
    metadata: Dict[str, Any] = {}


class ClaudeCodingAgent:
    """
    Hybrid Coding Agent powered by Claude Agent SDK.

    This agent can:
    - Execute bash commands
    - Read/write/edit files
    - Run scripts and automation
    - Set up workflows
    - Manage system configurations

    Unlike Pydantic AI agents, this has real execution power.
    """

    def __init__(self, workspace_dir: str = "/tmp/krilin_workspace"):
        """
        Initialize Claude Coding Agent.

        Args:
            workspace_dir: Directory where the agent can work safely
        """
        import os
        # Create workspace directory if it doesn't exist
        os.makedirs(workspace_dir, exist_ok=True)

        self.workspace_dir = workspace_dir
        self.agent_name = "Claude Coding Agent"

        # Configure Claude SDK options
        self.agent_options = ClaudeAgentOptions(
            # System prompt for coding tasks - using custom instead of preset to avoid Claude Code branding
            system_prompt={
                "type": "custom",
                "content": """You are Krillin's Coding Agent, an AI assistant specialized in creating automation and workflows.

                Key responsibilities:
                - Create Python scripts for automation
                - Set up cron jobs and scheduled tasks
                - Integrate with APIs (Gmail, Calendar, etc.)
                - Build productivity workflows
                - Write clean, maintainable code

                You have access to tools for reading, writing, and editing files, as well as running bash commands.
                Working directory: You have access to a safe workspace for creating files.
                Always explain what you're doing and ask for confirmation before executing destructive commands.
                Use Krillin's encouraging and supportive tone - be humble, loyal, and supportive like the Dragon Ball Z character.
                """
            },
            # Tools the agent can use
            allowed_tools=[
                "Bash",          # Execute terminal commands
                "Read",          # Read files
                "Write",         # Create new files
                "Edit",          # Edit existing files
                "Glob",          # Find files by pattern
                "Grep",          # Search file contents
            ],
            # Permission mode - require approval for dangerous operations
            permission_mode="acceptEdits",  # Auto-accept file edits, ask for bash commands

            # Working directory
            cwd=workspace_dir,

            # Model selection - Claude Sonnet 4.5 for best performance
            model="claude-sonnet-4-5-20250929",

            # Max turns to prevent infinite loops
            max_turns=15,
        )

    async def execute_task(
        self,
        task_description: str,
        context: Dict[str, Any]
    ) -> ClaudeAgentResponse:
        """
        Execute a coding/automation task using Claude Agent SDK.

        Args:
            task_description: Description of the task to execute
            context: Additional context (user preferences, data sources, etc.)

        Returns:
            ClaudeAgentResponse: Results of the execution
        """
        tools_used = []
        files_created = []
        files_modified = []
        commands_executed = []
        content_parts = []

        try:
            # Create client with configured options
            async with ClaudeSDKClient(options=self.agent_options) as client:
                # Build enhanced prompt with context
                enhanced_prompt = self._build_prompt(task_description, context)

                # Send the task to Claude
                await client.query(enhanced_prompt)

                # Collect all responses
                async for message in client.receive_response():
                    # Handle assistant messages (text responses)
                    if isinstance(message, AssistantMessage):
                        for block in message.content:
                            if isinstance(block, TextBlock):
                                content_parts.append(block.text)
                            elif isinstance(block, ToolUseBlock):
                                # Track tool usage
                                tools_used.append(block.name)

                                # Track specific actions
                                if block.name in ["Write"]:
                                    files_created.append(block.input.get("file_path", "unknown"))
                                elif block.name in ["Edit"]:
                                    files_modified.append(block.input.get("file_path", "unknown"))
                                elif block.name == "Bash":
                                    commands_executed.append(block.input.get("command", "unknown"))

                    # Handle result message (final stats)
                    elif isinstance(message, ResultMessage):
                        return ClaudeAgentResponse(
                            content="\n".join(content_parts),
                            metadata={
                                "agent_name": self.agent_name,
                                "model_used": "claude-sonnet-4-5",
                                "session_id": message.session_id,
                            },
                            tools_used=list(set(tools_used)),
                            files_created=files_created,
                            files_modified=files_modified,
                            commands_executed=commands_executed,
                            execution_success=not message.is_error,
                            error_message=message.result if message.is_error else None,
                            total_cost_usd=message.total_cost_usd,
                            duration_ms=message.duration_ms,
                            num_turns=message.num_turns,
                        )

                # If no ResultMessage received (shouldn't happen)
                return ClaudeAgentResponse(
                    content="\n".join(content_parts),
                    metadata={"agent_name": self.agent_name},
                    tools_used=list(set(tools_used)),
                    files_created=files_created,
                    files_modified=files_modified,
                    commands_executed=commands_executed,
                )

        except Exception as e:
            return ClaudeAgentResponse(
                content=f"Error executing task: {str(e)}",
                metadata={
                    "agent_name": self.agent_name,
                    "error_type": type(e).__name__
                },
                execution_success=False,
                error_message=str(e),
            )

    async def execute_task_streaming(
        self,
        task_description: str,
        context: Dict[str, Any],
        on_event: Optional[Callable[[StreamEvent], None]] = None
    ) -> AsyncIterator[StreamEvent]:
        """
        Execute task with streaming responses.

        Args:
            task_description: Task to execute
            context: Additional context
            on_event: Optional callback for each event

        Yields:
            StreamEvent: Events as they occur (text, tool_use, result, error)
        """
        try:
            async with ClaudeSDKClient(options=self.agent_options) as client:
                enhanced_prompt = self._build_prompt(task_description, context)
                await client.query(enhanced_prompt)

                async for message in client.receive_response():
                    if isinstance(message, AssistantMessage):
                        for block in message.content:
                            if isinstance(block, TextBlock):
                                event = StreamEvent(
                                    event_type="text",
                                    content=block.text,
                                    metadata={"source": "assistant"}
                                )
                                if on_event:
                                    on_event(event)
                                yield event

                            elif isinstance(block, ToolUseBlock):
                                event = StreamEvent(
                                    event_type="tool_use",
                                    content={
                                        "tool": block.name,
                                        "input": block.input
                                    },
                                    metadata={"tool_name": block.name}
                                )
                                if on_event:
                                    on_event(event)
                                yield event

                    elif isinstance(message, ResultMessage):
                        event = StreamEvent(
                            event_type="result",
                            content={
                                "success": not message.is_error,
                                "error": message.result if message.is_error else None
                            },
                            metadata={
                                "session_id": message.session_id,
                                "duration_ms": message.duration_ms,
                                "cost_usd": message.total_cost_usd,
                                "num_turns": message.num_turns
                            }
                        )
                        if on_event:
                            on_event(event)
                        yield event

        except Exception as e:
            event = StreamEvent(
                event_type="error",
                content=str(e),
                metadata={"error_type": type(e).__name__}
            )
            if on_event:
                on_event(event)
            yield event

    def _build_prompt(self, task: str, context: Dict[str, Any]) -> str:
        """Build enhanced prompt with context."""
        prompt_parts = [f"Task: {task}\n"]

        # Add user context
        if user_id := context.get("user_id"):
            prompt_parts.append(f"User ID: {user_id}")

        # Add data source context
        if data_sources := context.get("data_sources"):
            prompt_parts.append(f"\nAvailable data sources: {', '.join(data_sources)}")

        # Add user preferences
        if preferences := context.get("user_preferences"):
            prompt_parts.append(f"\nUser preferences: {preferences}")

        # Add specific instructions
        if instructions := context.get("instructions"):
            prompt_parts.append(f"\nAdditional instructions: {instructions}")

        return "\n".join(prompt_parts)

    async def create_workflow_script(
        self,
        workflow_description: str,
        user_id: int,
        data_sources: List[str]
    ) -> ClaudeAgentResponse:
        """
        Create a workflow automation script.

        Args:
            workflow_description: What the workflow should do
            user_id: User ID for the workflow
            data_sources: Available data sources (gmail, calendar, etc.)

        Returns:
            ClaudeAgentResponse: Script creation results
        """
        context = {
            "user_id": user_id,
            "data_sources": data_sources,
            "instructions": """
            Create a Python script that can be scheduled with cron or Celery.
            Include error handling, logging, and clear documentation.
            Make it production-ready.
            """
        }

        return await self.execute_task(workflow_description, context)

    async def setup_automation(
        self,
        automation_goal: str,
        schedule: str,
        user_context: Dict[str, Any]
    ) -> ClaudeAgentResponse:
        """
        Set up a complete automation with scheduling.

        Args:
            automation_goal: What to automate
            schedule: Cron expression or schedule description
            user_context: User context and preferences

        Returns:
            ClaudeAgentResponse: Automation setup results
        """
        task = f"""
        Set up an automation for: {automation_goal}
        Schedule: {schedule}

        Please:
        1. Create the automation script
        2. Set up the cron job or scheduled task
        3. Add error handling and notifications
        4. Test the setup
        5. Provide instructions for monitoring
        """

        return await self.execute_task(task, user_context)


# Singleton instance
_claude_coding_agent: Optional[ClaudeCodingAgent] = None


def get_claude_coding_agent() -> ClaudeCodingAgent:
    """
    Get or create the Claude Coding Agent instance.

    Returns:
        ClaudeCodingAgent: Singleton agent instance
    """
    global _claude_coding_agent
    if _claude_coding_agent is None:
        _claude_coding_agent = ClaudeCodingAgent()
    return _claude_coding_agent
