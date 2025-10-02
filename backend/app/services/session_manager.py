"""
Session Manager for Claude SDK Clients.
Maintains conversation continuity by reusing ClaudeSDKClient instances per conversation.
"""
import asyncio
from typing import Dict, Optional
from datetime import datetime, timedelta

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions


class ConversationSession:
    """Manages a single conversation session with Claude."""

    def __init__(self, conversation_id: int, client: ClaudeSDKClient):
        self.conversation_id = conversation_id
        self.client = client
        self.last_used = datetime.utcnow()
        self.is_connected = True
        self.turn_count = 0

    async def query(self, message: str):
        """Send a message in this conversation."""
        self.last_used = datetime.utcnow()
        self.turn_count += 1
        await self.client.query(message)

    async def disconnect(self):
        """Disconnect the client."""
        if self.is_connected:
            await self.client.disconnect()
            self.is_connected = False


class SessionManager:
    """
    Global session manager that maintains ClaudeSDKClient instances per conversation.

    This ensures conversation continuity - Claude remembers previous messages
    in the same conversation across multiple API requests.
    """

    def __init__(self, session_timeout_minutes: int = 30):
        self.sessions: Dict[int, ConversationSession] = {}
        self.session_timeout = timedelta(minutes=session_timeout_minutes)
        self._cleanup_task: Optional[asyncio.Task] = None

    async def get_or_create_session(
        self,
        conversation_id: int,
        agent_options: ClaudeAgentOptions
    ) -> ConversationSession:
        """
        Get existing session or create a new one for this conversation.

        Args:
            conversation_id: Database conversation ID
            agent_options: Configuration for the Claude agent

        Returns:
            ConversationSession: Active session with connected client
        """
        # Check if we have an existing session
        if conversation_id in self.sessions:
            session = self.sessions[conversation_id]

            # Verify it's still connected
            if session.is_connected:
                session.last_used = datetime.utcnow()
                return session
            else:
                # Session was disconnected, remove it
                del self.sessions[conversation_id]

        # Create new session
        client = ClaudeSDKClient(options=agent_options)
        await client.connect()

        session = ConversationSession(conversation_id, client)
        self.sessions[conversation_id] = session

        return session

    async def cleanup_old_sessions(self):
        """Remove sessions that haven't been used recently."""
        now = datetime.utcnow()
        to_remove = []

        for conv_id, session in self.sessions.items():
            if now - session.last_used > self.session_timeout:
                to_remove.append(conv_id)
                await session.disconnect()

        for conv_id in to_remove:
            del self.sessions[conv_id]

        if to_remove:
            print(f"Cleaned up {len(to_remove)} inactive sessions")

    async def start_cleanup_task(self):
        """Start background task to clean up old sessions."""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def _cleanup_loop(self):
        """Background loop for cleaning up old sessions."""
        while True:
            await asyncio.sleep(300)  # Run every 5 minutes
            await self.cleanup_old_sessions()

    async def end_session(self, conversation_id: int):
        """Explicitly end a conversation session."""
        if conversation_id in self.sessions:
            session = self.sessions[conversation_id]
            await session.disconnect()
            del self.sessions[conversation_id]

    async def shutdown(self):
        """Disconnect all sessions and stop cleanup task."""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass

        for session in self.sessions.values():
            await session.disconnect()

        self.sessions.clear()


# Global session manager instance
_session_manager: Optional[SessionManager] = None


def get_session_manager() -> SessionManager:
    """Get the global session manager instance."""
    global _session_manager
    if _session_manager is None:
        _session_manager = SessionManager(session_timeout_minutes=30)
    return _session_manager


async def cleanup_session_manager():
    """Cleanup function to be called on application shutdown."""
    global _session_manager
    if _session_manager is not None:
        await _session_manager.shutdown()
        _session_manager = None
