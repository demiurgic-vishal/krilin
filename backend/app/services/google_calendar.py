"""
Google Calendar API integration service.
Handles OAuth flow and calendar event synchronization.
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Any, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from app.config import settings

# Thread pool for running sync Google API calls
_executor = ThreadPoolExecutor(max_workers=4)


class GoogleCalendarService:
    """Service for interacting with Google Calendar API."""

    SCOPES = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events.readonly",
    ]

    def __init__(self):
        """Initialize Google Calendar service."""
        self.client_id = settings.google_client_id
        self.client_secret = settings.google_client_secret

    def create_authorization_url(self, redirect_uri: str, state: str) -> str:
        """
        Create OAuth authorization URL.

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
            prompt="consent",  # Force consent to get refresh token
        )

        return authorization_url

    def _exchange_code_for_tokens_sync(
        self, code: str, redirect_uri: str
    ) -> dict[str, Any]:
        """
        Synchronous implementation of token exchange.
        Called via thread pool to avoid blocking async event loop.
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
        """
        Exchange authorization code for access and refresh tokens.

        Args:
            code: Authorization code from OAuth callback
            redirect_uri: OAuth callback URL (must match)

        Returns:
            dict: Token information including access_token, refresh_token, expires_at
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            _executor,
            self._exchange_code_for_tokens_sync,
            code,
            redirect_uri
        )

    def refresh_access_token(
        self, refresh_token: str
    ) -> dict[str, Any]:
        """
        Refresh access token using refresh token.

        Args:
            refresh_token: Refresh token

        Returns:
            dict: New token information
        """
        credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret,
        )

        credentials.refresh(Request())

        return {
            "access_token": credentials.token,
            "token_expires_at": credentials.expiry.isoformat() if credentials.expiry else None,
        }

    def get_calendar_service(self, credentials_dict: dict):
        """
        Create authenticated Calendar API service.

        Args:
            credentials_dict: Dictionary with access_token, refresh_token, etc.

        Returns:
            Google Calendar API service instance
        """
        credentials = Credentials(
            token=credentials_dict.get("access_token"),
            refresh_token=credentials_dict.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret,
        )

        # Auto-refresh if expired
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())

        service = build("calendar", "v3", credentials=credentials)
        return service

    def _fetch_calendar_events_sync(
        self,
        credentials_dict: dict,
        days_back: int = 7,
        days_forward: int = 30,
        max_results: int = 100,
    ) -> list[dict[str, Any]]:
        """
        Synchronous implementation of fetching calendar events.
        Called via thread pool to avoid blocking async event loop.
        """
        service = self.get_calendar_service(credentials_dict)

        # Calculate time range
        now = datetime.utcnow()
        time_min = (now - timedelta(days=days_back)).isoformat() + "Z"
        time_max = (now + timedelta(days=days_forward)).isoformat() + "Z"

        # Fetch events from primary calendar
        events_result = (
            service.events()
            .list(
                calendarId="primary",
                timeMin=time_min,
                timeMax=time_max,
                maxResults=max_results,
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )

        events = events_result.get("items", [])

        # Normalize event data
        normalized_events = []
        for event in events:
            normalized_event = self._normalize_event(event)
            normalized_events.append(normalized_event)

        return normalized_events

    async def fetch_calendar_events(
        self,
        credentials_dict: dict,
        days_back: int = 7,
        days_forward: int = 30,
        max_results: int = 100,
    ) -> list[dict[str, Any]]:
        """
        Fetch calendar events from Google Calendar.

        Args:
            credentials_dict: OAuth credentials
            days_back: Number of days in the past to fetch
            days_forward: Number of days in the future to fetch
            max_results: Maximum number of events to fetch

        Returns:
            list: Calendar events with normalized structure
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            _executor,
            self._fetch_calendar_events_sync,
            credentials_dict,
            days_back,
            days_forward,
            max_results
        )

    def _normalize_event(self, event: dict) -> dict[str, Any]:
        """
        Normalize Google Calendar event to standard format.

        Args:
            event: Raw event from Google Calendar API

        Returns:
            dict: Normalized event data
        """
        # Extract start and end times
        start = event.get("start", {})
        end = event.get("end", {})

        start_time = start.get("dateTime", start.get("date"))
        end_time = end.get("dateTime", end.get("date"))

        # Check if all-day event
        is_all_day = "date" in start and "dateTime" not in start

        return {
            "external_id": event.get("id"),
            "title": event.get("summary", "Untitled Event"),
            "description": event.get("description"),
            "start_time": start_time,
            "end_time": end_time,
            "is_all_day": is_all_day,
            "location": event.get("location"),
            "attendees": [
                {
                    "email": attendee.get("email"),
                    "response_status": attendee.get("responseStatus"),
                }
                for attendee in event.get("attendees", [])
            ],
            "organizer": event.get("organizer", {}).get("email"),
            "html_link": event.get("htmlLink"),
            "status": event.get("status"),
            "created": event.get("created"),
            "updated": event.get("updated"),
            "raw_data": event,
        }

    def get_user_timezone(self, credentials_dict: dict) -> Optional[str]:
        """
        Get user's timezone from calendar settings.

        Args:
            credentials_dict: OAuth credentials

        Returns:
            str: Timezone string (e.g., "America/Los_Angeles")
        """
        try:
            service = self.get_calendar_service(credentials_dict)
            calendar = service.calendars().get(calendarId="primary").execute()
            return calendar.get("timeZone")
        except Exception:
            return None
