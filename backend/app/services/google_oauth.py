"""
Unified Google OAuth service for all Google APIs.
Handles OAuth flow for Calendar, Gmail, and other Google services.
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

from app.config import settings

# Thread pool for running sync Google API calls
_executor = ThreadPoolExecutor(max_workers=4)


class GoogleOAuthService:
    """Unified OAuth service for all Google APIs."""

    # Combined scopes for all Google services
    SCOPES = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events.readonly",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.labels",
    ]

    def __init__(self):
        """Initialize Google OAuth service."""
        self.client_id = settings.google_client_id
        self.client_secret = settings.google_client_secret

    def create_authorization_url(self, redirect_uri: str, state: str) -> str:
        """
        Create OAuth authorization URL with all Google scopes.

        Args:
            redirect_uri: OAuth callback URL
            state: State parameter for CSRF protection

        Returns:
            str: Authorization URL for user to visit
        """
        client_config = {
            "web": {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }

        flow = Flow.from_client_config(
            client_config=client_config,
            scopes=self.SCOPES,
            redirect_uri=redirect_uri,
        )

        authorization_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            state=state,
            prompt="consent",
        )

        return authorization_url

    def _exchange_code_for_tokens_sync(
        self, code: str, redirect_uri: str
    ) -> dict[str, Any]:
        """Synchronous token exchange."""
        client_config = {
            "web": {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }

        flow = Flow.from_client_config(
            client_config=client_config,
            scopes=self.SCOPES,
            redirect_uri=redirect_uri,
        )

        flow.fetch_token(code=code)
        credentials = flow.credentials

        return {
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_expires_at": credentials.expiry.isoformat() if credentials.expiry else None,
            "scopes": credentials.scopes,
        }

    async def exchange_code_for_tokens(
        self, code: str, redirect_uri: str
    ) -> dict[str, Any]:
        """Exchange authorization code for tokens."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            _executor,
            self._exchange_code_for_tokens_sync,
            code,
            redirect_uri
        )
