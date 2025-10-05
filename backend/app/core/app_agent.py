"""
Per-App Claude Agent System.

Each app can have its own Claude agent with:
- Custom system prompt from manifest
- App-specific tools loaded from app code
- Context injection for tool execution
- Conversation management per app installation
- Streaming responses
- Token optimization

For MVP, agents are isolated by conversation but share the same backend.
Year 2 will add per-user agent memory and cross-app learning.
"""
import logging
import importlib
import inspect
from typing import Any, Dict, List, Optional, AsyncIterator, Callable
from pathlib import Path
import traceback

from app.core.platform_context import PlatformContext
from app.services.claude_agent_service import BaseClaudeAgent, StreamEvent, AgentResponse
from app.core.app_runtime import get_app_runtime

logger = logging.getLogger(__name__)


class AppAgentError(Exception):
    """Raised when app agent operations fail."""
    pass


class AppTool:
    """
    Wrapper for app-specific tools.

    Provides metadata and execution context for tools defined by apps.
    """

    def __init__(
        self,
        name: str,
        function: Callable,
        description: str,
        parameters: Dict[str, Any]
    ):
        self.name = name
        self.function = function
        self.description = description
        self.parameters = parameters

    async def execute(self, ctx: PlatformContext, **kwargs) -> Any:
        """Execute the tool with platform context."""
        try:
            # Check if async or sync
            if inspect.iscoroutinefunction(self.function):
                return await self.function(ctx, **kwargs)
            else:
                return self.function(ctx, **kwargs)
        except Exception as e:
            logger.error(f"[APP AGENT] Tool {self.name} execution failed: {e}")
            raise AppAgentError(f"Tool execution failed: {str(e)}")


class AppAgent(BaseClaudeAgent):
    """
    Per-App Claude Agent.

    Each app can define its own Claude agent with custom tools and prompts.
    The agent receives a PlatformContext and can use all platform APIs.

    Architecture:
    - Agent config loaded from app manifest
    - Tools loaded from app's agent_tools.py module
    - Context injected into every tool call
    - Conversations isolated per app installation
    - Streaming support for responsive UI

    Example app agent tools module (apps/habit_tracker/agent_tools.py):

    ```python
    # Tool definitions with descriptions
    TOOLS = [
        {
            "name": "log_habit",
            "description": "Log completion of a habit for today",
            "parameters": {
                "habit_id": {"type": "string", "description": "ID of habit to log"},
                "notes": {"type": "string", "description": "Optional notes", "required": False}
            }
        }
    ]

    async def log_habit(ctx, habit_id: str, notes: str = ""):
        # Use platform context
        habit = await ctx.storage.find_one("habits", {"id": habit_id})

        log = await ctx.storage.insert("habit_logs", {
            "habit_id": habit_id,
            "completed_at": ctx.now().isoformat(),
            "notes": notes
        })

        await ctx.streams.publish("habit_completed", {
            "habit_id": habit_id,
            "log_id": log["id"]
        })

        return {"success": True, "log": log}
    ```
    """

    def __init__(
        self,
        app_id: str,
        manifest: Dict[str, Any],
        ctx: PlatformContext
    ):
        """
        Initialize app-specific agent.

        Args:
            app_id: App identifier
            manifest: App manifest dictionary
            ctx: Platform context for this app and user
        """
        self.app_id = app_id
        self.manifest = manifest
        self.ctx = ctx

        # Load agent config from manifest
        agent_config = manifest.get("agent_config", {})

        # Get system prompt
        system_prompt = agent_config.get(
            "system_prompt",
            f"You are an AI assistant for the {manifest.get('metadata', {}).get('name', app_id)} app."
        )

        # Load app-specific tools
        self.app_tools = self._load_app_tools()

        # Get tool names for BaseClaudeAgent
        # Note: For MVP, we use standard Claude tools (Bash, Read, Write, etc.)
        # App-specific tools are called via tool delegation pattern
        allowed_tools = agent_config.get("allowed_tools", ["WebSearch"])

        # Initialize base agent
        super().__init__(
            agent_name=f"{app_id}-agent",
            system_prompt=system_prompt,
            allowed_tools=allowed_tools,
            workspace_dir=f"/tmp/krilin_apps/{app_id}",
            include_subagents=False  # Apps don't have subagents
        )

        logger.info(
            f"[APP AGENT] Initialized agent for {app_id} "
            f"with {len(self.app_tools)} custom tools"
        )

    def _load_app_tools(self) -> Dict[str, AppTool]:
        """
        Load app-specific tools from app's agent_tools.py module.

        Returns:
            Dict mapping tool names to AppTool instances
        """
        tools = {}

        try:
            # Try to import app's agent_tools module
            # Format: apps.habit_tracker.agent_tools
            module_path = f"apps.{self.app_id.replace('-', '_')}.agent_tools"

            try:
                tools_module = importlib.import_module(module_path)
            except ModuleNotFoundError:
                # Try alternative path
                module_path = f"backend.apps.{self.app_id.replace('-', '_')}.agent_tools"
                try:
                    tools_module = importlib.import_module(module_path)
                except ModuleNotFoundError:
                    logger.info(
                        f"[APP AGENT] No agent_tools module found for {self.app_id}, "
                        "app will use only standard tools"
                    )
                    return tools

            # Get TOOLS list from module
            if not hasattr(tools_module, 'TOOLS'):
                logger.warning(
                    f"[APP AGENT] Module {module_path} has no TOOLS list, "
                    "skipping custom tools"
                )
                return tools

            tool_definitions = tools_module.TOOLS

            # Load each tool
            for tool_def in tool_definitions:
                tool_name = tool_def.get("name")
                if not tool_name:
                    logger.warning("[APP AGENT] Tool definition missing 'name', skipping")
                    continue

                # Get tool function from module
                if not hasattr(tools_module, tool_name):
                    logger.warning(
                        f"[APP AGENT] Tool function '{tool_name}' not found in module, "
                        "skipping"
                    )
                    continue

                tool_function = getattr(tools_module, tool_name)

                # Create AppTool instance
                app_tool = AppTool(
                    name=tool_name,
                    function=tool_function,
                    description=tool_def.get("description", ""),
                    parameters=tool_def.get("parameters", {})
                )

                tools[tool_name] = app_tool

                logger.info(f"[APP AGENT] Loaded tool: {tool_name}")

            return tools

        except Exception as e:
            logger.error(f"[APP AGENT] Error loading app tools for {self.app_id}: {e}")
            logger.error(traceback.format_exc())
            return tools

    async def execute_tool(self, tool_name: str, **params) -> Any:
        """
        Execute an app-specific tool with context injection.

        Args:
            tool_name: Name of tool to execute
            **params: Tool parameters

        Returns:
            Tool execution result

        Raises:
            AppAgentError: If tool not found or execution fails
        """
        if tool_name not in self.app_tools:
            raise AppAgentError(f"Tool '{tool_name}' not found in app {self.app_id}")

        tool = self.app_tools[tool_name]

        logger.info(
            f"[APP AGENT] Executing tool {tool_name} for app {self.app_id}, "
            f"user {self.ctx.user_id}"
        )

        try:
            result = await tool.execute(self.ctx, **params)

            logger.info(f"[APP AGENT] Tool {tool_name} completed successfully")

            return result

        except Exception as e:
            logger.error(f"[APP AGENT] Tool {tool_name} execution failed: {e}")
            raise AppAgentError(f"Tool execution failed: {str(e)}")

    def get_tool_descriptions(self) -> List[Dict[str, Any]]:
        """
        Get descriptions of all available app tools.

        Returns:
            List of tool metadata dictionaries
        """
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters
            }
            for tool in self.app_tools.values()
        ]

    async def process_message_with_tools(
        self,
        message: str,
        context: Dict[str, Any]
    ) -> AgentResponse:
        """
        Process message with app-specific tool awareness.

        Enhances the prompt to include information about app-specific tools
        and handles tool execution requests.

        Args:
            message: User message
            context: Additional context

        Returns:
            AgentResponse with tool execution results
        """
        # Build enhanced context with tool descriptions
        enhanced_context = context.copy()

        if self.app_tools:
            tool_descriptions = self.get_tool_descriptions()
            tools_info = "\n\n[Available app-specific tools:]\n"

            for tool_desc in tool_descriptions:
                tools_info += f"\n- {tool_desc['name']}: {tool_desc['description']}\n"
                tools_info += f"  Parameters: {tool_desc['parameters']}\n"

            # Add to context
            enhanced_context["app_tools"] = tools_info

        # Process with base agent
        response = await self.process_message(message, enhanced_context)

        return response

    async def process_message_streaming_with_tools(
        self,
        message: str,
        context: Dict[str, Any]
    ) -> AsyncIterator[StreamEvent]:
        """
        Process message with streaming and app-specific tool awareness.

        Args:
            message: User message
            context: Additional context

        Yields:
            StreamEvent: Events as they occur
        """
        # Build enhanced context with tool descriptions
        enhanced_context = context.copy()

        if self.app_tools:
            tool_descriptions = self.get_tool_descriptions()
            tools_info = "\n\n[Available app-specific tools - you can tell the user about these:]\n"

            for tool_desc in tool_descriptions:
                tools_info += f"\n- {tool_desc['name']}: {tool_desc['description']}\n"
                tools_info += f"  Parameters: {tool_desc['parameters']}\n"

            # Add to context
            enhanced_context["app_tools_info"] = tools_info

        # Stream with base agent
        async for event in self.process_message_streaming(message, enhanced_context):
            yield event

    def _build_prompt(self, message: str, context: Dict[str, Any]) -> str:
        """
        Build enhanced prompt with app-specific context.

        Extends base prompt building to include:
        - App tool descriptions
        - App data context
        - User preferences
        """
        # Start with base prompt
        prompt = super()._build_prompt(message, context)

        # Add app tools info if available
        if app_tools_info := context.get("app_tools_info"):
            prompt = f"{app_tools_info}\n\n{prompt}"

        # Add user info if available
        if self.ctx.user_info:
            user_context = f"\n[User context:]\n"
            user_context += f"Name: {self.ctx.user_info.full_name}\n"
            user_context += f"Email: {self.ctx.user_info.email}\n"
            user_context += f"Timezone: {self.ctx.user_info.timezone}\n"

            prompt = f"{user_context}\n{prompt}"

        return prompt


# Agent registry per app installation
_app_agents: Dict[str, AppAgent] = {}


async def get_app_agent(
    app_id: str,
    ctx: PlatformContext,
    manifest: Optional[Dict[str, Any]] = None
) -> AppAgent:
    """
    Get or create an app agent for a specific app and user.

    Agents are cached per user-app combination.

    Args:
        app_id: App identifier
        ctx: Platform context (contains user_id and app_id)
        manifest: App manifest (loaded if not provided)

    Returns:
        AppAgent instance

    Raises:
        AppAgentError: If agent creation fails
    """
    # Cache key includes user_id and app_id for isolation
    cache_key = f"{ctx.user_id}:{app_id}"

    if cache_key in _app_agents:
        return _app_agents[cache_key]

    try:
        # Load manifest if not provided
        if manifest is None:
            runtime = get_app_runtime()
            app_module = await runtime.load_app(app_id, {})
            manifest = app_module.manifest

        # Create agent
        agent = AppAgent(app_id, manifest, ctx)

        # Cache it
        _app_agents[cache_key] = agent

        logger.info(f"[APP AGENT] Created agent for user {ctx.user_id}, app {app_id}")

        return agent

    except Exception as e:
        logger.error(f"[APP AGENT] Failed to create agent for {app_id}: {e}")
        logger.error(traceback.format_exc())
        raise AppAgentError(f"Failed to create app agent: {str(e)}")


async def process_app_agent_message(
    app_id: str,
    ctx: PlatformContext,
    message: str,
    context: Optional[Dict[str, Any]] = None,
    streaming: bool = True
) -> AsyncIterator[StreamEvent]:
    """
    Process a message with an app's agent.

    Convenience function for app agent chat.

    Args:
        app_id: App identifier
        ctx: Platform context
        message: User message
        context: Additional context (conversation history, etc.)
        streaming: Whether to stream responses (default: True)

    Yields:
        StreamEvent: Events as they occur (if streaming)

    Returns:
        AgentResponse: Complete response (if not streaming)
    """
    agent = await get_app_agent(app_id, ctx)

    context = context or {}

    if streaming:
        async for event in agent.process_message_streaming_with_tools(message, context):
            yield event
    else:
        response = await agent.process_message_with_tools(message, context)
        # Yield as single result event
        yield StreamEvent(
            event_type="result",
            content=response.content,
            metadata=response.metadata
        )


def clear_app_agent_cache(app_id: Optional[str] = None, user_id: Optional[int] = None):
    """
    Clear app agent cache.

    Useful for development when app agent code changes.

    Args:
        app_id: Specific app to clear, or None for all apps
        user_id: Specific user to clear, or None for all users
    """
    global _app_agents

    if app_id and user_id:
        # Clear specific user-app combination
        cache_key = f"{user_id}:{app_id}"
        if cache_key in _app_agents:
            del _app_agents[cache_key]
            logger.info(f"[APP AGENT] Cleared cache for user {user_id}, app {app_id}")
    elif app_id:
        # Clear all agents for an app (across all users)
        keys_to_delete = [k for k in _app_agents.keys() if k.endswith(f":{app_id}")]
        for key in keys_to_delete:
            del _app_agents[key]
        logger.info(f"[APP AGENT] Cleared {len(keys_to_delete)} cached agents for app {app_id}")
    elif user_id:
        # Clear all agents for a user (across all apps)
        keys_to_delete = [k for k in _app_agents.keys() if k.startswith(f"{user_id}:")]
        for key in keys_to_delete:
            del _app_agents[key]
        logger.info(f"[APP AGENT] Cleared {len(keys_to_delete)} cached agents for user {user_id}")
    else:
        # Clear all
        _app_agents.clear()
        logger.info("[APP AGENT] Cleared all app agent cache")
