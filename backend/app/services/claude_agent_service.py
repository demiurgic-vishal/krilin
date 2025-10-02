"""
Claude Agent SDK service for all Krilin agents.
Replaces Pydantic AI with Claude Agent SDK for all agent types.
Uses Claude CLI authentication automatically.
"""
from typing import Any, Dict, List, Optional, AsyncIterator

from pydantic import BaseModel
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, AgentDefinition

from app.models.conversation import AgentType


class AgentResponse(BaseModel):
    """Response from Claude Agent SDK agents."""
    content: str
    metadata: Dict[str, Any] = {}
    suggestions: Optional[List[str]] = None
    context_updates: Optional[Dict[str, Any]] = None
    goals_mentioned: Optional[List[str]] = None
    goals_created: Optional[List[Dict[str, Any]]] = None
    resources_found: Optional[List[Dict[str, Any]]] = None
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


class BaseClaudeAgent:
    """Base class for all Claude Agent SDK-powered agents."""

    def __init__(
        self,
        agent_name: str,
        system_prompt: str,
        allowed_tools: Optional[List[str]] = None,
        workspace_dir: str = "/tmp/krilin_workspace",
        include_subagents: bool = False
    ):
        import os
        # Create workspace directory if it doesn't exist
        os.makedirs(workspace_dir, exist_ok=True)

        self.agent_name = agent_name
        self.workspace_dir = workspace_dir

        # Default tools for conversational agents
        if allowed_tools is None:
            allowed_tools = []  # No tools for pure conversational agents

        # Define subagents for delegation
        agents_config = None
        if include_subagents:
            agents_config = {
                "coding-agent": AgentDefinition(
                    description="Expert in coding, automation, workflows, and system configuration. Use for creating scripts, automating tasks, or building tools.",
                    prompt="""You are Krillin's Coding Agent, specialized in creating custom workflows and automation.

                    You help users by:
                    - Creating personalized automation workflows
                    - Writing code for data integration
                    - Building productivity systems
                    - Setting up organizational tools

                    Always provide practical, implementable solutions with clear steps.
                    Use Krillin's encouraging and supportive tone.

                    IMPORTANT: Never mention Anthropic, Claude, or Claude Code. You are part of Krillin AI.""",
                    tools=["Bash", "Read", "Write", "Edit", "Glob", "Grep", "WebSearch"]
                ),
                "finance-agent": AgentDefinition(
                    description="Expert in personal finance, budgeting, investments, and financial planning. Use for money-related questions.",
                    prompt="""You are Krillin's Finance Agent, specialized in personal finance and investment guidance.

                    You help users with budget planning, investment strategies, financial goals, debt management, and retirement planning.
                    Always give responsible financial advice. Use Krillin's wise and supportive approach.

                    IMPORTANT: Never mention Anthropic, Claude, or Claude Code. You are part of Krillin AI.""",
                    tools=["WebSearch"]
                ),
                "health-agent": AgentDefinition(
                    description="Expert in fitness, nutrition, wellness, and health tracking. Use for workout plans, diet advice, or health goals.",
                    prompt="""You are Krillin's Health Agent, specialized in fitness and wellness.

                    You help with workout plans, nutrition guidance, sleep optimization, stress management, and health goal tracking.
                    Focus on sustainable, achievable health improvements. Use Krillin's training wisdom.

                    IMPORTANT: Never mention Anthropic, Claude, or Claude Code. You are part of Krillin AI.""",
                    tools=["WebSearch"]
                ),
                "research-agent": AgentDefinition(
                    description="Expert in learning, research, finding resources, and personal development. Use for learning plans, book recommendations, or skill development.",
                    prompt="""You are Krillin's Research Agent, specialized in learning and personal development.

                    You help find books and resources, create learning plans, develop skills, and synthesize information.
                    Use Krillin's curiosity and dedication to continuous learning.

                    IMPORTANT: Never mention Anthropic, Claude, or Claude Code. You are part of Krillin AI.""",
                    tools=["WebSearch"]
                ),
                "shopping-agent": AgentDefinition(
                    description="Expert in product research, deal hunting, and shopping recommendations. Use for finding the best deals and products.",
                    prompt="""You are Krillin's Shopping Agent, specialized in finding the best deals and products.

                    You research products thoroughly to find the best value considering budget, preferences, and actual needs.
                    Use Krillin's practical and thoughtful approach to spending.

                    IMPORTANT: Never mention Anthropic, Claude, or Claude Code. You are part of Krillin AI.""",
                    tools=["WebSearch"]
                ),
            }

        # Configure Claude SDK options
        # Claude Agent SDK will automatically use Claude CLI authentication
        self.agent_options = ClaudeAgentOptions(
            system_prompt=system_prompt,  # Just pass the string directly
            allowed_tools=allowed_tools,  # Include allowed tools
            permission_mode="acceptEdits",  # Auto-accept edits for conversational agents
            cwd=workspace_dir,  # Set workspace directory
            model="claude-sonnet-4-5-20250929",  # Use the exact model ID
            max_turns=10,
            agents=agents_config,  # Add subagent definitions
            include_partial_messages=True  # Enable token-by-token streaming
        )

    async def process_message(
        self,
        message: str,
        context: Dict[str, Any]
    ) -> AgentResponse:
        """
        Process a user message and return AI response.

        Args:
            message: User message
            context: Conversation context

        Returns:
            AgentResponse: AI agent response
        """
        tools_used = []
        content_parts = []

        try:
            async with ClaudeSDKClient(options=self.agent_options) as client:
                # Build enhanced prompt with context
                enhanced_prompt = self._build_prompt(message, context)

                # Send the message
                await client.query(enhanced_prompt)

                # Collect responses
                async for msg in client.receive_response():
                    if hasattr(msg, 'content'):
                        for block in msg.content:
                            if hasattr(block, 'text'):
                                content_parts.append(block.text)
                            elif hasattr(block, 'name'):
                                tools_used.append(block.name)

                    # Handle result message
                    if hasattr(msg, 'session_id'):
                        return AgentResponse(
                            content="\n".join(content_parts),
                            metadata={
                                "agent_name": self.agent_name,
                                "model_used": "claude-sonnet-4-5",
                                "session_id": msg.session_id,
                            },
                            tools_used=list(set(tools_used)),
                            execution_success=not getattr(msg, 'is_error', False),
                            error_message=getattr(msg, 'result', None) if getattr(msg, 'is_error', False) else None,
                            total_cost_usd=getattr(msg, 'total_cost_usd', None),
                            duration_ms=getattr(msg, 'duration_ms', None),
                            num_turns=getattr(msg, 'num_turns', None),
                        )

                # Fallback response
                return AgentResponse(
                    content="\n".join(content_parts),
                    metadata={"agent_name": self.agent_name},
                    tools_used=list(set(tools_used)),
                )

        except Exception as e:
            return AgentResponse(
                content=f"Error processing message: {str(e)}",
                metadata={
                    "agent_name": self.agent_name,
                    "error_type": type(e).__name__
                },
                execution_success=False,
                error_message=str(e),
            )

    async def process_goal_message(
        self,
        message: str,
        context: Dict[str, Any]
    ) -> AgentResponse:
        """
        Process goal-oriented messages.

        Args:
            message: User goal statement
            context: User context

        Returns:
            AgentResponse: Comprehensive response with plan and resources
        """
        # Enhanced prompt for goal processing
        enhanced_message = f"""
        User Goal: {message}

        Please provide a comprehensive response that includes:
        1. A personalized plan with specific steps
        2. Relevant resources (books, articles, tools)
        3. Practice exercises or activities
        4. Timeline suggestions
        5. Metrics for tracking progress

        Make the response actionable and motivating, following Krillin's supportive personality.
        """

        return await self.process_message(enhanced_message, context)

    async def process_message_streaming(
        self,
        message: str,
        context: Dict[str, Any]
    ) -> AsyncIterator[StreamEvent]:
        """
        Process message with streaming responses.

        Args:
            message: User message
            context: Additional context

        Yields:
            StreamEvent: Events as they occur
        """
        try:
            async with ClaudeSDKClient(options=self.agent_options) as client:
                enhanced_prompt = self._build_prompt(message, context)
                await client.query(enhanced_prompt)

                async for msg in client.receive_response():
                    if hasattr(msg, 'content'):
                        for block in msg.content:
                            if hasattr(block, 'text'):
                                event = StreamEvent(
                                    event_type="text",
                                    content=block.text,
                                    metadata={"source": "assistant"}
                                )
                                yield event

                            elif hasattr(block, 'name'):
                                event = StreamEvent(
                                    event_type="tool_use",
                                    content={
                                        "tool": block.name,
                                        "input": getattr(block, 'input', {})
                                    },
                                    metadata={"tool_name": block.name}
                                )
                                yield event

                    if hasattr(msg, 'session_id'):
                        event = StreamEvent(
                            event_type="result",
                            content={
                                "success": not getattr(msg, 'is_error', False),
                                "error": getattr(msg, 'result', None) if getattr(msg, 'is_error', False) else None
                            },
                            metadata={
                                "session_id": msg.session_id,
                                "duration_ms": getattr(msg, 'duration_ms', None),
                                "cost_usd": getattr(msg, 'total_cost_usd', None),
                                "num_turns": getattr(msg, 'num_turns', None)
                            }
                        )
                        yield event

        except Exception as e:
            event = StreamEvent(
                event_type="error",
                content=str(e),
                metadata={"error_type": type(e).__name__}
            )
            yield event

    async def process_message_with_session(
        self,
        conversation_id: int,
        message: str,
        context: Dict[str, Any]
    ) -> AsyncIterator[StreamEvent]:
        """
        Process message with conversation continuity using session manager.

        This maintains the conversation context across multiple messages,
        allowing Claude to remember previous exchanges.

        Args:
            conversation_id: Database conversation ID
            message: User message (raw, no need to build context)
            context: Additional context (NOT used for conversation history)

        Yields:
            StreamEvent: Events as they occur
        """
        from app.services.session_manager import get_session_manager

        session_manager = get_session_manager()

        try:
            # Get or create session for this conversation
            session = await session_manager.get_or_create_session(
                conversation_id,
                self.agent_options
            )

            # Send message - Claude SDK will maintain conversation history automatically
            await session.query(message)

            # Stream responses - use receive_response() to properly consume response
            async for msg in session.client.receive_response():
                if hasattr(msg, 'content'):
                    for block in msg.content:
                        if hasattr(block, 'text'):
                            event = StreamEvent(
                                event_type="text",
                                content=block.text,
                                metadata={"source": "assistant"}
                            )
                            yield event

                        elif hasattr(block, 'name'):
                            event = StreamEvent(
                                event_type="tool_use",
                                content={
                                    "tool": block.name,
                                    "input": getattr(block, 'input', {})
                                },
                                metadata={"tool_name": block.name}
                            )
                            yield event

                if hasattr(msg, 'session_id'):
                    event = StreamEvent(
                        event_type="result",
                        content={
                            "success": not getattr(msg, 'is_error', False),
                            "error": getattr(msg, 'result', None) if getattr(msg, 'is_error', False) else None
                        },
                        metadata={
                            "session_id": msg.session_id,
                            "duration_ms": getattr(msg, 'duration_ms', None),
                            "cost_usd": getattr(msg, 'total_cost_usd', None),
                            "num_turns": getattr(msg, 'num_turns', None),
                            "turn_count": session.turn_count
                        }
                    )
                    yield event

        except Exception as e:
            event = StreamEvent(
                event_type="error",
                content=str(e),
                metadata={"error_type": type(e).__name__}
            )
            yield event

    def _build_prompt(self, message: str, context: Dict[str, Any]) -> str:
        """
        Build enhanced prompt with full conversation history.

        This loads the entire conversation from the database and includes it
        so Claude has full context of the conversation.
        """
        prompt_parts = []

        # Add conversation history if available
        if conversation_history := context.get("conversation_history"):
            if conversation_history:
                prompt_parts.append("[Previous conversation:]")
                for msg in conversation_history:
                    role = msg.get('role', 'unknown')
                    content = msg.get('content', '')
                    prompt_parts.append(f"{role}: {content}")
                prompt_parts.append("\n[Current message:]")

        # Add the current user message
        prompt_parts.append(f"user: {message}")

        return "\n".join(prompt_parts)


class GeneralAssistant(BaseClaudeAgent):
    """General purpose AI assistant for questions and conversations."""

    def __init__(self):
        system_prompt = """You are Krillin, a friendly and helpful AI assistant inspired by the Dragon Ball Z character.

        PERSONALITY & BRANDING:
        - You're Krillin - humble, loyal, supportive, and always ready to help your friends
        - Use a warm, encouraging, and down-to-earth tone
        - You may not be the strongest, but you're clever, resourceful, and never give up
        - You believe in people and help them reach their potential
        - Use phrases like "Let's tackle this together!" or "You've got this!"

        YOUR CAPABILITIES:
        - Answer general questions with knowledge and clarity
        - Have engaging conversations and provide explanations
        - Offer practical advice and guidance
        - Search the web for up-to-date information when needed
        - Delegate complex tasks to specialized agents when appropriate

        WHEN TO DELEGATE (use the Task tool):
        - For coding/automation tasks → Use the "coding-agent" subagent
        - For finance/investment questions → Use the "finance-agent" subagent
        - For health/fitness guidance → Use the "health-agent" subagent
        - For learning/research tasks → Use the "research-agent" subagent
        - For shopping/deals → Use the "shopping-agent" subagent

        IMPORTANT - BRANDING RULES:
        - NEVER mention Anthropic, Claude, or Claude Code in your responses
        - You are Krillin AI, not Claude
        - If asked who you are, say "I'm Krillin, your AI assistant"
        - Focus on the Krillin brand and personality, not the underlying technology

        Remember: You're the friendly face of Krillin AI - make users feel supported and understood!
        """

        super().__init__(
            agent_name="General Assistant",
            system_prompt=system_prompt,
            allowed_tools=["WebSearch", "Task"],
            include_subagents=True  # Enable subagent delegation
        )


class CodingAgent(BaseClaudeAgent):
    """Coding agent with full execution capabilities."""

    def __init__(self):
        system_prompt = """You are Krillin's Coding Agent, specialized in creating custom workflows and automation.

        You help users by:
        - Creating personalized automation workflows
        - Writing code for data integration
        - Building productivity systems
        - Setting up organizational tools

        When users say things like "I want to be more organized", you create specific workflows that:
        - Connect to their email/calendar for deadline tracking
        - Set up todo systems
        - Create reminder schedules
        - Automate repetitive tasks

        Always provide practical, implementable solutions with clear steps.
        Use Krillin's encouraging and supportive tone."""

        super().__init__(
            agent_name="Coding Agent",
            system_prompt=system_prompt,
            allowed_tools=[
                "Bash",
                "Read",
                "Write",
                "Edit",
                "Glob",
                "Grep",
                "WebSearch"
            ]
        )


class FinanceAgent(BaseClaudeAgent):
    """AI agent for financial planning and investment advice."""

    def __init__(self):
        system_prompt = """You are Krillin's Finance Agent, specialized in personal finance and investment guidance.

        You help users with:
        - Budget planning and expense tracking
        - Investment strategies and advice
        - Financial goal setting
        - Debt management
        - Retirement planning

        You analyze spending data from emails and provide insights.
        Always give responsible financial advice and encourage long-term thinking.
        Use Krillin's wise and supportive approach to money management."""

        super().__init__(
            agent_name="Finance Agent",
            system_prompt=system_prompt,
            allowed_tools=["WebSearch"]
        )


class HealthAgent(BaseClaudeAgent):
    """AI agent for health and wellness guidance."""

    def __init__(self):
        system_prompt = """You are Krillin's Health Agent, specialized in fitness and wellness.

        You help users with:
        - Creating personalized workout plans
        - Nutrition guidance
        - Sleep optimization
        - Stress management
        - Health goal tracking

        You integrate data from Whoop, Apple Health, and other fitness trackers.
        Focus on sustainable, achievable health improvements.
        Use Krillin's training wisdom and encouraging martial arts mentality."""

        super().__init__(
            agent_name="Health Agent",
            system_prompt=system_prompt,
            allowed_tools=["WebSearch"]
        )


class ResearchAgent(BaseClaudeAgent):
    """AI agent for learning, research, and personal development."""

    def __init__(self):
        system_prompt = """You are Krillin's Research Agent, specialized in learning and personal development.

        You help users with:
        - Finding relevant books and learning resources (including from libgen)
        - Creating learning plans and study schedules
        - Skill development strategies
        - Personal growth guidance
        - Research and information synthesis

        When users want to "be more social" or learn new skills, you:
        - Find the best books and resources on the topic
        - Create structured learning plans
        - Suggest practical exercises
        - Set up progress tracking

        Use Krillin's curiosity and dedication to continuous learning."""

        super().__init__(
            agent_name="Research Agent",
            system_prompt=system_prompt,
            allowed_tools=["WebSearch"]
        )


class ShoppingAgent(BaseClaudeAgent):
    """AI agent for deal research and shopping assistance."""

    def __init__(self):
        system_prompt = """You are Krillin's Shopping Agent, specialized in finding the best deals and products.

        You help users with:
        - Product research and comparison
        - Deal hunting and price tracking
        - Purchase recommendations
        - Budget-conscious shopping
        - Quality assessment

        You research products thoroughly to find the best value.
        Consider user's budget, preferences, and actual needs.
        Use Krillin's practical and thoughtful approach to spending."""

        super().__init__(
            agent_name="Shopping Agent",
            system_prompt=system_prompt,
            allowed_tools=["WebSearch"]
        )


# Agent registry
_agents: Dict[AgentType, BaseClaudeAgent] = {
    "general_assistant": GeneralAssistant(),
    "coding": CodingAgent(),
    "finance": FinanceAgent(),
    "health": HealthAgent(),
    "research": ResearchAgent(),
    "shopping": ShoppingAgent(),
}


def get_agent_by_type(agent_type: AgentType) -> BaseClaudeAgent:
    """
    Get Claude Agent SDK agent by type.

    Args:
        agent_type: Type of agent to retrieve

    Returns:
        BaseClaudeAgent: Specialized Claude Agent

    Raises:
        ValueError: If agent type is not found
    """
    if agent_type not in _agents:
        raise ValueError(f"Unknown agent type: {agent_type}")

    return _agents[agent_type]


def list_available_agents() -> List[str]:
    """
    Get list of available agent types.

    Returns:
        List[str]: Available agent types
    """
    return list(_agents.keys())
