"""
Whoop API integration service.
Handles OAuth flow and fitness data synchronization (recovery, sleep, workouts, cycles).
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Any, Optional
import requests

from app.config import settings

# Thread pool for running sync API calls
_executor = ThreadPoolExecutor(max_workers=4)


class WhoopService:
    """Service for interacting with Whoop API v2."""

    BASE_URL = "https://api.prod.whoop.com"
    AUTH_URL = f"{BASE_URL}/oauth/oauth2/auth"
    TOKEN_URL = f"{BASE_URL}/oauth/oauth2/token"

    SCOPES = [
        "read:recovery",
        "read:sleep",
        "read:workout",
        "read:cycles",
        "read:profile",
        "offline",  # Required for refresh tokens
    ]

    def __init__(self):
        """Initialize Whoop service."""
        self.client_id = settings.whoop_client_id
        self.client_secret = settings.whoop_client_secret

    def create_authorization_url(self, redirect_uri: str, state: str) -> str:
        """
        Create OAuth authorization URL.

        Args:
            redirect_uri: OAuth callback URL
            state: State parameter for CSRF protection

        Returns:
            str: Authorization URL for user to visit
        """
        scope = " ".join(self.SCOPES)

        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "scope": scope,
            "state": state,
        }

        query_string = "&".join([f"{k}={requests.utils.quote(str(v))}" for k, v in params.items()])
        return f"{self.AUTH_URL}?{query_string}"

    def _exchange_code_for_tokens_sync(
        self, code: str, redirect_uri: str
    ) -> dict[str, Any]:
        """Synchronous token exchange."""
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }

        response = requests.post(self.TOKEN_URL, data=data)
        response.raise_for_status()
        token_data = response.json()

        return {
            "access_token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token"),
            "expires_in": token_data.get("expires_in"),
            "token_type": token_data.get("token_type", "Bearer"),
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

    def _make_api_request_sync(
        self, endpoint: str, access_token: str, params: Optional[dict] = None
    ) -> dict[str, Any]:
        """Make authenticated API request."""
        headers = {
            "Authorization": f"Bearer {access_token}",
        }

        url = f"{self.BASE_URL}{endpoint}"
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()

    async def _make_api_request(
        self, endpoint: str, access_token: str, params: Optional[dict] = None
    ) -> dict[str, Any]:
        """Make authenticated API request (async)."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            _executor,
            self._make_api_request_sync,
            endpoint,
            access_token,
            params
        )

    async def fetch_recovery_data(
        self, credentials_dict: dict, days_back: int = 7
    ) -> list[dict[str, Any]]:
        """
        Fetch recovery scores from Whoop.

        Args:
            credentials_dict: OAuth credentials
            days_back: Number of days to fetch

        Returns:
            list: Recovery data
        """
        access_token = credentials_dict.get("access_token")

        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_back)

        params = {
            "start": start_date.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "end": end_date.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        }

        data = await self._make_api_request("/developer/v1/recovery", access_token, params)
        return data.get("records", [])

    async def fetch_sleep_data(
        self, credentials_dict: dict, days_back: int = 7
    ) -> list[dict[str, Any]]:
        """Fetch sleep data from Whoop."""
        access_token = credentials_dict.get("access_token")

        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_back)

        params = {
            "start": start_date.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "end": end_date.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        }

        data = await self._make_api_request("/developer/v1/activity/sleep", access_token, params)
        return data.get("records", [])

    async def fetch_workout_data(
        self, credentials_dict: dict, days_back: int = 7
    ) -> list[dict[str, Any]]:
        """Fetch workout data from Whoop."""
        access_token = credentials_dict.get("access_token")

        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_back)

        params = {
            "start": start_date.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "end": end_date.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        }

        data = await self._make_api_request("/developer/v1/activity/workout", access_token, params)
        return data.get("records", [])

    async def fetch_cycle_data(
        self, credentials_dict: dict, days_back: int = 7
    ) -> list[dict[str, Any]]:
        """Fetch physiological cycle data from Whoop."""
        access_token = credentials_dict.get("access_token")

        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_back)

        params = {
            "start": start_date.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "end": end_date.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        }

        data = await self._make_api_request("/developer/v1/cycle", access_token, params)
        return data.get("records", [])
