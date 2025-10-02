"""
AI Agent service using Pydantic AI.
Central service for managing specialized AI agents.
"""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from app.config import settings
from app.models.conversation import AgentType


class AgentResponse(BaseModel):
    """Response from AI agents."""
    content: str
    metadata: Dict[str, Any] = {}
    suggestions: Optional[List[str]] = None
    context_updates: Optional[Dict[str, Any]] = None
    goals_mentioned: Optional[List[str]] = None
    goals_created: Optional[List[Dict[str, Any]]] = None
    resources_found: Optional[List[Dict[str, Any]]] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None


class AgentContext(BaseModel):
    """Context passed to AI agents."""
    user_id: int
    user_preferences: Dict[str, Any] = {}
    conversation_context: Dict[str, Any] = {}
    recent_messages: List[Dict[str, str]] = []
    is_goal_setting: bool = False
    message_intent: str = "general"


class BaseKrilinAgent:
    """Base class for all Krilin AI agents."""

    def __init__(self, agent_name: str, system_prompt: str):
        self.agent_name = agent_name
        # Use Anthropic Claude for all Pydantic AI agents
        self.agent = Agent(
            'anthropic:claude-sonnet-4-5-20250929',  # Claude Sonnet 4.5
            system_prompt=system_prompt,
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
        agent_context = AgentContext(**context)

        # Run the agent with context
        result = await self.agent.run(message)

        # Access result - pydantic-ai 1.0+ uses .output instead of .data
        response_content = result.output if hasattr(result, 'output') else result.data

        return AgentResponse(
            content=str(response_content),
            metadata={
                "agent_name": self.agent_name,
                "model_used": "claude-sonnet-4-5"
            },
            prompt_tokens=result.usage().request_tokens if hasattr(result, 'usage') and callable(result.usage) and result.usage() else None,
            completion_tokens=result.usage().response_tokens if hasattr(result, 'usage') and callable(result.usage) and result.usage() else None
        )
    
    async def process_goal_message(
        self,
        message: str,
        context: Dict[str, Any]
    ) -> AgentResponse:
        """
        Process goal-oriented messages that create plans and resources.

        Args:
            message: User goal statement
            context: User context

        Returns:
            AgentResponse: Comprehensive response with plan and resources
        """
        agent_context = AgentContext(**context)

        # Enhanced prompt for goal processing
        enhanced_prompt = f"""
        User Goal: {message}

        Please provide a comprehensive response that includes:
        1. A personalized plan with specific steps
        2. Relevant resources (books, articles, tools)
        3. Practice exercises or activities
        4. Timeline suggestions
        5. Metrics for tracking progress

        Make the response actionable and motivating, following Krillin's supportive personality.
        """

        result = await self.agent.run(enhanced_prompt)

        # Access result - pydantic-ai 1.0+ uses .output instead of .data
        response_content = result.output if hasattr(result, 'output') else result.data

        return AgentResponse(
            content=str(response_content),
            metadata={
                "agent_name": self.agent_name,
                "model_used": "claude-sonnet-4-5",
                "is_goal_response": True
            },
            prompt_tokens=result.usage().request_tokens if hasattr(result, 'usage') and callable(result.usage) and result.usage() else None,
            completion_tokens=result.usage().response_tokens if hasattr(result, 'usage') and callable(result.usage) and result.usage() else None
        )
    
    def _build_message_history(self, recent_messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Build message history for agent context."""
        return recent_messages[-10:]  # Keep last 10 messages


class GeneralAssistant(BaseKrilinAgent):
    """General purpose AI assistant for questions and conversations."""

    def __init__(self):
        system_prompt = """You are Krillin, a friendly and helpful AI assistant.

        You help users with:
        - Answering general questions
        - Having conversations
        - Providing information and explanations
        - Offering advice and guidance

        You're knowledgeable, supportive, and always eager to help.
        Use a warm, encouraging tone inspired by Dragon Ball Z's Krillin -
        humble, loyal, and always ready to support your friends.
        """

        super().__init__("General Assistant", system_prompt)


class CodingAgent(BaseKrilinAgent):
    """
    Hybrid Coding Agent that routes to Claude Agent SDK for execution tasks.

    This agent:
    - Uses Pydantic AI for planning and conversation
    - Delegates to Claude Agent SDK for actual code execution
    """

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

        super().__init__("Coding Agent", system_prompt)

    async def execute_code_task(
        self,
        task: str,
        context: Dict[str, Any]
    ) -> AgentResponse:
        """
        Execute actual coding/automation tasks using Claude Agent SDK.

        Args:
            task: Coding task to execute
            context: User context

        Returns:
            AgentResponse: Execution results
        """
        from app.services.claude_coding_agent import get_claude_coding_agent

        # Get Claude coding agent
        claude_agent = get_claude_coding_agent()

        # Execute the task with real terminal/file access
        result = await claude_agent.execute_task(task, context)

        # Convert Claude response to AgentResponse format
        return AgentResponse(
            content=result.content,
            metadata={
                **result.metadata,
                "tools_used": result.tools_used,
                "files_created": result.files_created,
                "files_modified": result.files_modified,
                "commands_executed": result.commands_executed,
                "execution_success": result.execution_success,
            },
            prompt_tokens=None,  # Claude SDK doesn't expose these separately
            completion_tokens=None,
        )


class FinanceAgent(BaseKrilinAgent):
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
        
        super().__init__("Finance Agent", system_prompt)


class HealthAgent(BaseKrilinAgent):
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
        
        super().__init__("Health Agent", system_prompt)


class ResearchAgent(BaseKrilinAgent):
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
        
        super().__init__("Research Agent", system_prompt)


class ShoppingAgent(BaseKrilinAgent):
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
        
        super().__init__("Shopping Agent", system_prompt)


# Agent registry
_agents: Dict[AgentType, BaseKrilinAgent] = {
    "general_assistant": GeneralAssistant(),
    "coding": CodingAgent(),
    "finance": FinanceAgent(),
    "health": HealthAgent(),
    "research": ResearchAgent(),
    "shopping": ShoppingAgent(),
}


def get_agent_by_type(agent_type: AgentType) -> BaseKrilinAgent:
    """
    Get AI agent by type.
    
    Args:
        agent_type: Type of agent to retrieve
        
    Returns:
        BaseKrilinAgent: Specialized AI agent
        
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