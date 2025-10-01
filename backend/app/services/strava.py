"""
Strava API integration service.
Handles OAuth authentication and activity data synchronization.
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode

import httpx

from app.config import settings

# Thread pool for sync HTTP calls in async context
_executor = ThreadPoolExecutor(max_workers=4)


class StravaService:
    """Service for Strava API integration."""

    BASE_URL = "https://www.strava.com"
    API_BASE_URL = "https://www.strava.com/api/v3"
    AUTH_URL = f"{BASE_URL}/oauth/authorize"
    TOKEN_URL = f"{BASE_URL}/oauth/token"

    # Scopes for comprehensive activity access
    SCOPES = ["read", "activity:read_all", "profile:read_all"]

    def __init__(self):
        self.client_id = settings.strava_client_id
        self.client_secret = settings.strava_client_secret

    def create_authorization_url(self, redirect_uri: str, state: str) -> str:
        """
        Create Strava OAuth authorization URL.

        Args:
            redirect_uri: Callback URL
            state: CSRF protection state

        Returns:
            str: Authorization URL
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "approval_prompt": "auto",
            "scope": ",".join(self.SCOPES),
            "state": state,
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"

    def _exchange_code_for_tokens_sync(self, code: str, redirect_uri: str) -> dict[str, Any]:
        """
        Exchange authorization code for access and refresh tokens (sync).

        Args:
            code: Authorization code
            redirect_uri: Redirect URI used in authorization

        Returns:
            dict: Token data

        Raises:
            Exception: If token exchange fails
        """
        with httpx.Client() as client:
            response = client.post(
                self.TOKEN_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                },
                timeout=30.0,
            )

            if response.status_code != 200:
                raise Exception(f"Token exchange failed: {response.text}")

            data = response.json()

            return {
                "access_token": data["access_token"],
                "refresh_token": data["refresh_token"],
                "expires_at": data["expires_at"],  # Unix timestamp
                "athlete": data.get("athlete", {}),
            }

    async def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> dict[str, Any]:
        """Async wrapper for token exchange."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            _executor, self._exchange_code_for_tokens_sync, code, redirect_uri
        )

    def _refresh_access_token_sync(self, refresh_token: str) -> dict[str, Any]:
        """
        Refresh access token using refresh token (sync).

        Args:
            refresh_token: Refresh token

        Returns:
            dict: New token data

        Raises:
            Exception: If refresh fails
        """
        with httpx.Client() as client:
            response = client.post(
                self.TOKEN_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                },
                timeout=30.0,
            )

            if response.status_code != 200:
                raise Exception(f"Token refresh failed: {response.text}")

            data = response.json()

            return {
                "access_token": data["access_token"],
                "refresh_token": data["refresh_token"],
                "expires_at": data["expires_at"],
            }

    async def refresh_access_token(self, refresh_token: str) -> dict[str, Any]:
        """Async wrapper for token refresh."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(_executor, self._refresh_access_token_sync, refresh_token)

    def _ensure_valid_token_sync(self, credentials_dict: dict) -> str:
        """
        Ensure access token is valid, refresh if expired (sync).

        Args:
            credentials_dict: Credentials dictionary

        Returns:
            str: Valid access token

        Raises:
            Exception: If token refresh fails
        """
        access_token = credentials_dict.get("access_token")
        refresh_token = credentials_dict.get("refresh_token")
        expires_at = credentials_dict.get("expires_at")

        # Check if token is expired (with 5 minute buffer)
        if expires_at:
            current_time = datetime.now(timezone.utc).timestamp()
            if current_time >= (expires_at - 300):  # 5 minutes before expiry
                # Token expired, refresh it
                token_data = self._refresh_access_token_sync(refresh_token)
                # Update credentials (caller should save this)
                credentials_dict.update(token_data)
                return token_data["access_token"]

        return access_token

    def _fetch_activities_sync(
        self, credentials_dict: dict, days_back: int = 30, per_page: int = 50
    ) -> list[dict[str, Any]]:
        """
        Fetch athlete activities (sync).

        Args:
            credentials_dict: Credentials dictionary
            days_back: Number of days to fetch activities for
            per_page: Activities per page

        Returns:
            list: Activities data

        Raises:
            Exception: If API call fails
        """
        access_token = self._ensure_valid_token_sync(credentials_dict)

        # Calculate timestamp for filtering
        after_timestamp = int((datetime.now(timezone.utc) - timedelta(days=days_back)).timestamp())

        activities = []

        with httpx.Client() as client:
            page = 1
            while True:
                response = client.get(
                    f"{self.API_BASE_URL}/athlete/activities",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={"after": after_timestamp, "page": page, "per_page": per_page},
                    timeout=30.0,
                )

                if response.status_code != 200:
                    raise Exception(f"Failed to fetch activities: {response.text}")

                page_activities = response.json()

                if not page_activities:
                    break

                activities.extend(page_activities)
                page += 1

                # Strava rate limit: 200 requests per 15 minutes
                # Break after reasonable number of pages
                if page > 10:
                    break

        # Transform to our format
        return [
            {
                "external_id": str(activity["id"]),
                "name": activity.get("name", "Activity"),
                "type": activity.get("type", "Unknown"),
                "sport_type": activity.get("sport_type", activity.get("type")),
                "start_date": activity.get("start_date"),
                "start_date_local": activity.get("start_date_local"),
                "distance": activity.get("distance"),  # meters
                "moving_time": activity.get("moving_time"),  # seconds
                "elapsed_time": activity.get("elapsed_time"),  # seconds
                "total_elevation_gain": activity.get("total_elevation_gain"),  # meters
                "average_speed": activity.get("average_speed"),  # m/s
                "max_speed": activity.get("max_speed"),  # m/s
                "average_heartrate": activity.get("average_heartrate"),
                "max_heartrate": activity.get("max_heartrate"),
                "average_cadence": activity.get("average_cadence"),
                "average_watts": activity.get("average_watts"),
                "kilojoules": activity.get("kilojoules"),
                "calories": activity.get("calories"),
                "achievement_count": activity.get("achievement_count", 0),
                "kudos_count": activity.get("kudos_count", 0),
                "pr_count": activity.get("pr_count", 0),
                "raw_data": activity,
            }
            for activity in activities
        ]

    async def fetch_activities(
        self, credentials_dict: dict, days_back: int = 30, per_page: int = 50
    ) -> list[dict[str, Any]]:
        """Async wrapper for fetching activities."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            _executor, self._fetch_activities_sync, credentials_dict, days_back, per_page
        )
