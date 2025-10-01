"""
Gmail API integration service.
Handles OAuth flow and email synchronization.
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Any, Optional
import base64

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from app.config import settings

# Thread pool for running sync Google API calls
_executor = ThreadPoolExecutor(max_workers=4)


class GmailService:
    """Service for interacting with Gmail API."""

    SCOPES = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.labels",
    ]

    def __init__(self):
        """Initialize Gmail service."""
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

    def get_gmail_service(self, credentials_dict: dict):
        """Create authenticated Gmail API service."""
        credentials = Credentials(
            token=credentials_dict.get("access_token"),
            refresh_token=credentials_dict.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret,
        )

        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())

        service = build("gmail", "v1", credentials=credentials)
        return service

    def _fetch_emails_sync(
        self,
        credentials_dict: dict,
        max_results: int = 50,
        query: str = "",
    ) -> list[dict[str, Any]]:
        """Synchronous email fetching."""
        service = self.get_gmail_service(credentials_dict)

        # Fetch message IDs
        results = service.users().messages().list(
            userId="me",
            maxResults=max_results,
            q=query
        ).execute()

        messages = results.get("messages", [])
        emails = []

        # Fetch full message details
        for msg in messages:
            try:
                message = service.users().messages().get(
                    userId="me",
                    id=msg["id"],
                    format="full"
                ).execute()

                email_data = self._parse_email(message)
                emails.append(email_data)
            except Exception as e:
                print(f"Error fetching message {msg['id']}: {e}")
                continue

        return emails

    async def fetch_emails(
        self,
        credentials_dict: dict,
        max_results: int = 50,
        query: str = "",
    ) -> list[dict[str, Any]]:
        """Fetch emails from Gmail."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            _executor,
            self._fetch_emails_sync,
            credentials_dict,
            max_results,
            query
        )

    def _parse_email(self, message: dict) -> dict[str, Any]:
        """Parse Gmail message to normalized format."""
        headers = message.get("payload", {}).get("headers", [])

        def get_header(name: str) -> Optional[str]:
            for header in headers:
                if header["name"].lower() == name.lower():
                    return header["value"]
            return None

        # Extract body
        body = ""
        if "payload" in message:
            if "body" in message["payload"] and "data" in message["payload"]["body"]:
                body = base64.urlsafe_b64decode(
                    message["payload"]["body"]["data"]
                ).decode("utf-8", errors="ignore")
            elif "parts" in message["payload"]:
                for part in message["payload"]["parts"]:
                    if part["mimeType"] == "text/plain" and "data" in part["body"]:
                        body = base64.urlsafe_b64decode(
                            part["body"]["data"]
                        ).decode("utf-8", errors="ignore")
                        break

        return {
            "external_id": message["id"],
            "thread_id": message.get("threadId"),
            "subject": get_header("Subject") or "(No Subject)",
            "from": get_header("From"),
            "to": get_header("To"),
            "date": get_header("Date"),
            "snippet": message.get("snippet", ""),
            "body": body[:5000],  # Limit body size
            "labels": message.get("labelIds", []),
            "internal_date": message.get("internalDate"),
            "size_estimate": message.get("sizeEstimate"),
        }
