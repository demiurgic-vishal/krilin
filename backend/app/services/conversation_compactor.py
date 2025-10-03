"""
Conversation compaction service for managing long chat histories.
Uses Claude to intelligently summarize old messages when context gets too long.
"""
from typing import List, Dict, Any, Optional, Tuple
from anthropic import Anthropic
import os
import tiktoken

# Token thresholds
COMPACTION_THRESHOLD_TOKENS = 100000  # Start compacting at 100k tokens (Claude has ~200k limit)
COMPACTION_RATIO = 0.5  # Compact first 50% of messages
MAX_CONTEXT_TOKENS = 180000  # Leave room for response


class ConversationCompactor:
    """Handles conversation history compaction using Claude."""

    def __init__(self):
        self.client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        # Use tiktoken for accurate token counting (cl100k_base is used by Claude)
        try:
            self.encoder = tiktoken.get_encoding("cl100k_base")
        except Exception:
            # Fallback if tiktoken not available
            self.encoder = None

    def count_tokens(self, text: str) -> int:
        """
        Count tokens in text.

        Args:
            text: Text to count tokens for

        Returns:
            int: Token count
        """
        if self.encoder:
            return len(self.encoder.encode(text))
        else:
            # Rough estimate: 1 token ≈ 4 characters
            return len(text) // 4

    def estimate_message_tokens(self, messages: List[Dict[str, str]]) -> int:
        """
        Estimate token count for messages.

        Args:
            messages: List of message dicts with 'role' and 'content'

        Returns:
            int: Estimated token count
        """
        total_tokens = 0
        for msg in messages:
            # Count tokens for role + content
            role_tokens = self.count_tokens(msg.get('role', ''))
            content_tokens = self.count_tokens(msg.get('content', ''))
            # Add formatting overhead (~4 tokens per message)
            total_tokens += role_tokens + content_tokens + 4
        return total_tokens

    def should_compact(self, messages: List[Dict[str, str]]) -> bool:
        """
        Determine if conversation needs compaction based on token count.

        Args:
            messages: List of all messages

        Returns:
            bool: True if compaction needed
        """
        total_tokens = self.estimate_message_tokens(messages)
        return total_tokens >= COMPACTION_THRESHOLD_TOKENS

    async def compact_messages(
        self,
        messages: List[Dict[str, str]],
        conversation_id: int
    ) -> str:
        """
        Compact a list of messages into a summary.

        Args:
            messages: Messages to compact (first 50% of conversation)
            conversation_id: ID of the conversation

        Returns:
            str: Compacted summary of the messages
        """
        # Build a prompt for Claude to summarize the conversation
        conversation_text = "\n\n".join([
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in messages
        ])

        compaction_prompt = f"""Please create a concise but comprehensive summary of this conversation history.
The summary will be used to provide context for continuing the conversation.

Include:
- Main topics discussed
- Key questions asked and answers provided
- Important decisions or conclusions
- Any action items or follow-ups mentioned
- The overall flow and context of the conversation

Keep the summary under 500 words while preserving all critical information.

CONVERSATION HISTORY:
{conversation_text}

SUMMARY:"""

        # Use Claude to generate summary
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": compaction_prompt
            }]
        )

        summary = response.content[0].text

        # Format the summary as a system message
        compacted_text = f"""[CONVERSATION SUMMARY - {len(messages)} previous messages]
{summary}
[END SUMMARY - Conversation continues below]"""

        return compacted_text

    def find_compaction_split_point(
        self,
        messages: List[Dict[str, str]]
    ) -> int:
        """
        Find the message index to split at for compaction.
        Compacts first 50% by token count, not message count.

        Args:
            messages: All messages

        Returns:
            int: Index to split at
        """
        total_tokens = 0
        token_counts = []

        # Calculate cumulative token counts
        for msg in messages:
            msg_tokens = self.count_tokens(msg.get('content', '')) + 4
            total_tokens += msg_tokens
            token_counts.append(total_tokens)

        # Find split point (50% of total tokens)
        target_tokens = total_tokens * COMPACTION_RATIO

        # Find message index closest to 50% tokens
        for i, cumulative_tokens in enumerate(token_counts):
            if cumulative_tokens >= target_tokens:
                return i + 1  # Return index after this message

        # Fallback: return middle by count
        return len(messages) // 2

    async def get_compacted_history(
        self,
        messages: List[Dict[str, str]],
        conversation_id: int,
        cached_summary: Optional[str] = None,
        summary_valid_until_message: Optional[int] = None
    ) -> Tuple[Optional[str], List[Dict[str, str]], bool, Dict[str, Any]]:
        """
        Get compacted conversation history with support for MULTIPLE compaction rounds.

        Strategy:
        1. If no compaction needed: return all messages
        2. If cached summary exists and total tokens OK: use cached summary
        3. If cached summary exists but tokens exceeded AGAIN: re-compact (merge summary + new messages)
        4. If no cached summary: first compaction

        Args:
            messages: All messages in conversation
            conversation_id: Conversation ID
            cached_summary: Previously cached summary (if any)
            summary_valid_until_message: Message index the cached summary is valid for

        Returns:
            tuple: (compacted_summary, recent_messages, needs_compaction_warning, compaction_metadata)
        """
        # Calculate total token count
        total_tokens = self.estimate_message_tokens(messages)

        # Check if compaction is needed
        if total_tokens < COMPACTION_THRESHOLD_TOKENS:
            return None, messages, False, {
                "total_tokens": total_tokens,
                "is_compacted": False
            }

        # Check if we have a cached summary
        if cached_summary and summary_valid_until_message is not None:
            # IMPORTANT: summary_valid_until_message tracks which messages are ALREADY in the summary
            # E.g., if compaction_point=50, then M1-M50 are in the summary
            # So we only need to check messages from index 50 onwards
            new_messages = messages[summary_valid_until_message:]

            # Calculate tokens with cached summary
            summary_tokens = self.count_tokens(cached_summary)
            new_messages_tokens = self.estimate_message_tokens(new_messages)
            total_with_cache = summary_tokens + new_messages_tokens

            # If still under threshold with cached summary, use it
            if total_with_cache < COMPACTION_THRESHOLD_TOKENS:
                # Summary represents M1-M{compaction_point}, return M{compaction_point+1} onwards
                return cached_summary, new_messages, True, {
                    "total_tokens": total_with_cache,
                    "is_compacted": True,
                    "used_cached_summary": True,
                    "messages_compacted": summary_valid_until_message,
                    "summary_tokens": summary_tokens,
                    "recent_tokens": new_messages_tokens
                }

            # ===== RE-COMPACTION NEEDED =====
            # Scenario: Old summary covered M1-M50, now M1-M150 exists and total > 100k
            # We need to merge summary + new messages and re-compact

            # Combine: [summary_of_M1-M50, M51-M150]
            combined_for_compaction = [
                {"role": "system", "content": cached_summary}  # Represents M1-M{compaction_point}
            ] + new_messages  # M{compaction_point+1} onwards

            # Find split point in combined content (50% by tokens)
            split_index = self.find_compaction_split_point(combined_for_compaction)

            # Example: If split_index=50, then:
            # - messages_to_compact = [summary, M51-M100] (which represents M1-M100)
            # - recent_messages = [M101-M150]
            messages_to_compact = combined_for_compaction[:split_index]
            recent_messages = combined_for_compaction[split_index:]

            # Create new summary (now represents M1-M100 in the example)
            new_summary = await self.compact_messages(messages_to_compact, conversation_id)

            # Calculate new compaction point in ORIGINAL message array
            # If split_index=50, we compacted [summary + 49 new messages]
            # So new_compaction_point = 50 + 49 = 99 (M1-M99 now in summary)
            new_compaction_point = summary_valid_until_message + (split_index - 1 if split_index > 0 else 0)

            summary_tokens = self.count_tokens(new_summary)
            recent_tokens = self.estimate_message_tokens(recent_messages)

            return new_summary, recent_messages, True, {
                "total_tokens": summary_tokens + recent_tokens,
                "is_compacted": True,
                "used_cached_summary": False,
                "messages_compacted": new_compaction_point,
                "summary_tokens": summary_tokens,
                "recent_tokens": recent_tokens,
                "compaction_point": new_compaction_point,
                "recompacted": True  # Flag that we re-compacted
            }

        # First time compaction - no cached summary
        split_index = self.find_compaction_split_point(messages)
        messages_to_compact = messages[:split_index]
        recent_messages = messages[split_index:]

        # Compact old messages
        compacted_summary = await self.compact_messages(messages_to_compact, conversation_id)

        # Calculate token usage
        summary_tokens = self.count_tokens(compacted_summary)
        recent_tokens = self.estimate_message_tokens(recent_messages)

        return compacted_summary, recent_messages, True, {
            "total_tokens": summary_tokens + recent_tokens,
            "is_compacted": True,
            "used_cached_summary": False,
            "messages_compacted": split_index,
            "summary_tokens": summary_tokens,
            "recent_tokens": recent_tokens,
            "compaction_point": split_index  # Store this for caching
        }


# Singleton instance
_compactor_instance = None


def get_conversation_compactor() -> ConversationCompactor:
    """Get singleton conversation compactor instance."""
    global _compactor_instance
    if _compactor_instance is None:
        _compactor_instance = ConversationCompactor()
    return _compactor_instance
