"""
AI API for apps - Provides Claude integration via Claude Agent SDK.

Apps can use ctx.ai to interact with Claude for various AI tasks:
- Chat completions
- Text generation
- Analysis
- Summarization
"""
import logging
from typing import List, Dict, Any, Optional
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

logger = logging.getLogger(__name__)


class AIAPI:
    """
    AI API providing Claude integration for apps via Claude Agent SDK.

    Example usage in app code:
    ```python
    response = await ctx.ai.chat(
        messages=[{"role": "user", "content": "What's the weather?"}],
        system="You are a helpful assistant",
        max_tokens=500
    )
    ```
    """

    def __init__(self, user_id: int, app_id: str):
        self.user_id = user_id
        self.app_id = app_id

    async def chat(
        self,
        messages: List[Dict[str, str]],
        system: str = "",
        max_tokens: int = 1000,
        model: str = "sonnet",
        temperature: float = 1.0
    ) -> str:
        """
        Send messages to Claude and get a response.

        Args:
            messages: List of message dicts with 'role' and 'content'
            system: System prompt to guide Claude's behavior
            max_tokens: Maximum tokens in response
            model: Claude model to use ("sonnet", "opus", "haiku")
            temperature: Response randomness (0-1)

        Returns:
            str: Claude's response text

        Example:
            response = await ctx.ai.chat(
                messages=[
                    {"role": "user", "content": "Analyze this data: [1,2,3,4,5]"}
                ],
                system="You are a data analyst",
                max_tokens=500
            )
        """
        try:
            # Build the prompt from messages
            prompt_parts = []
            for msg in messages:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                prompt_parts.append(f"{role}: {content}")

            prompt = "\n".join(prompt_parts)

            # Configure Claude SDK options
            options = ClaudeAgentOptions(
                model=model,
                max_turns=1,  # Single turn for simple chat
                allowed_tools=[],  # No tools for simple chat
                include_partial_messages=False  # Don't need streaming for sync response
            )

            # Add system prompt to options if provided
            # Note: Claude Agent SDK doesn't support system prompts in options
            # so we prepend it to the prompt
            if system:
                prompt = f"[System: {system}]\n\n{prompt}"

            # Log API usage
            logger.info(
                f"AI API call from app {self.app_id} for user {self.user_id}",
                extra={
                    "app_id": self.app_id,
                    "user_id": self.user_id,
                    "model": model,
                    "message_count": len(messages)
                }
            )

            content_parts = []

            # Call Claude via SDK
            async with ClaudeSDKClient(options=options) as client:
                await client.query(prompt)

                # Collect response
                async for msg in client.receive_response():
                    if hasattr(msg, 'content'):
                        for block in msg.content:
                            if hasattr(block, 'text'):
                                content_parts.append(block.text)

            result = "\n".join(content_parts)
            return result

        except Exception as e:
            logger.error(
                f"AI API error for app {self.app_id}: {str(e)}",
                extra={
                    "app_id": self.app_id,
                    "user_id": self.user_id,
                    "error": str(e)
                }
            )
            raise ValueError(f"AI API error: {str(e)}")

    async def complete(
        self,
        prompt: str,
        system: str = "",
        max_tokens: int = 1000,
        model: str = "sonnet"
    ) -> str:
        """
        Simple completion - send a prompt and get a response.

        Args:
            prompt: The user prompt
            system: System instructions
            max_tokens: Maximum tokens in response
            model: Claude model to use

        Returns:
            str: Claude's response

        Example:
            summary = await ctx.ai.complete(
                "Summarize: The quick brown fox jumps over the lazy dog",
                max_tokens=100
            )
        """
        return await self.chat(
            messages=[{"role": "user", "content": prompt}],
            system=system,
            max_tokens=max_tokens,
            model=model
        )

    async def analyze(
        self,
        data: Any,
        question: str,
        max_tokens: int = 1000
    ) -> str:
        """
        Analyze data and answer a question about it.

        Args:
            data: The data to analyze (will be converted to string)
            question: Question to answer about the data
            max_tokens: Maximum tokens in response

        Returns:
            str: Analysis result

        Example:
            analysis = await ctx.ai.analyze(
                data={"workouts": [...], "avg_duration": 45},
                question="What trends do you see in my workout data?"
            )
        """
        prompt = f"""Data:
{str(data)}

Question: {question}"""

        return await self.chat(
            messages=[{"role": "user", "content": prompt}],
            system="You are a data analyst. Provide clear, actionable insights.",
            max_tokens=max_tokens
        )

    async def summarize(
        self,
        text: str,
        max_length: int = 200,
        style: str = "concise"
    ) -> str:
        """
        Summarize text.

        Args:
            text: Text to summarize
            max_length: Maximum length of summary in words
            style: Summary style ('concise', 'detailed', 'bullet-points')

        Returns:
            str: Summary

        Example:
            summary = await ctx.ai.summarize(
                text=long_article,
                max_length=100,
                style="bullet-points"
            )
        """
        style_prompts = {
            "concise": "Create a brief, concise summary.",
            "detailed": "Create a comprehensive summary covering all key points.",
            "bullet-points": "Create a bullet-point summary of key points."
        }

        system_prompt = f"{style_prompts.get(style, style_prompts['concise'])} Keep it under {max_length} words."

        return await self.chat(
            messages=[{"role": "user", "content": f"Summarize:\n\n{text}"}],
            system=system_prompt,
            max_tokens=max_length * 2  # Rough token estimate
        )

    async def extract(
        self,
        text: str,
        extract_type: str,
        format: str = "json"
    ) -> str:
        """
        Extract information from text.

        Args:
            text: Text to extract from
            extract_type: What to extract (e.g., "dates", "names", "tasks")
            format: Output format ("json", "list", "text")

        Returns:
            str: Extracted information

        Example:
            tasks = await ctx.ai.extract(
                text="Remember to call John, buy groceries, and finish the report",
                extract_type="tasks",
                format="json"
            )
        """
        return await self.chat(
            messages=[{"role": "user", "content": f"Extract {extract_type} from:\n\n{text}"}],
            system=f"Extract {extract_type} and return as {format}. Be precise and thorough.",
            max_tokens=1000
        )
