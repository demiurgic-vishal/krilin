"""
Enhanced Integration Base Class - Layer 2: Integration + Sync Layer
Provides manifest-based integration framework with OAuth, sync capabilities.
"""
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


@dataclass
class IntegrationInfo:
    """Metadata about an integration."""
    name: str
    description: str
    category: str  # calendar, fitness, email, productivity, health, finance
    icon: str  # URL or icon name
    auth_type: str  # oauth2, api_key, custom
    official: bool = False
    version: str = "1.0.0"
    tags: List[str] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []


@dataclass
class OAuthConfig:
    """OAuth 2.0 configuration."""
    auth_url: str
    token_url: str
    scopes: List[str]
    client_id: str
    client_secret: str
    redirect_uri: str = ""
    authorization_params: Dict[str, str] = None

    def __post_init__(self):
        if self.authorization_params is None:
            self.authorization_params = {}


@dataclass
class DataTypeSchema:
    """Schema for a type of data provided by integration."""
    data_type: str  # e.g., "calendar_events", "emails", "workouts"
    description: str
    fields: Dict[str, str]  # field_name -> field_type
    frequency: str = "hourly"  # How often to sync: realtime, hourly, daily
    requires_premium: bool = False


@dataclass
class SyncResult:
    """Result of a data sync operation."""
    success: bool
    records_fetched: int = 0
    records_created: int = 0
    records_updated: int = 0
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class BaseIntegration(ABC):
    """
    Base class for all integrations.

    Each integration implements this interface to provide:
    - OAuth configuration
    - Data schemas it provides
    - Sync functionality
    - Local storage schema
    """

    @abstractmethod
    def get_integration_info(self) -> IntegrationInfo:
        """
        Return metadata about this integration.

        Returns:
            IntegrationInfo: Name, description, category, icon, auth type
        """
        pass

    @abstractmethod
    def get_oauth_config(self, redirect_uri: str) -> Optional[OAuthConfig]:
        """
        Return OAuth configuration if this integration uses OAuth.

        Args:
            redirect_uri: OAuth redirect URI

        Returns:
            OAuthConfig or None if not OAuth-based
        """
        pass

    @abstractmethod
    def get_provided_schemas(self) -> List[DataTypeSchema]:
        """
        Declare what data structures this integration provides.

        Returns:
            List of DataTypeSchema defining available data types
        """
        pass

    @abstractmethod
    async def authenticate(self, auth_code: str) -> Dict[str, Any]:
        """
        Exchange OAuth authorization code for access tokens.

        Args:
            auth_code: OAuth authorization code

        Returns:
            Dictionary with access_token, refresh_token, expires_in, etc.
        """
        pass

    @abstractmethod
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh expired access token.

        Args:
            refresh_token: Refresh token

        Returns:
            Dictionary with new access_token, refresh_token, expires_in
        """
        pass

    @abstractmethod
    async def fetch_data(
        self,
        credentials: Dict[str, Any],
        data_type: str,
        since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch data from external API.

        Args:
            credentials: User credentials (access_token, etc.)
            data_type: Type of data to fetch (from get_provided_schemas)
            since: Only fetch data changed since this time (for incremental sync)

        Returns:
            List of data records
        """
        pass

    def get_local_storage_schema(self, data_type: str) -> Dict[str, str]:
        """
        Define how fetched data should be stored locally.

        Args:
            data_type: Type of data

        Returns:
            Dictionary of field_name -> field_type for local storage
        """
        # Default: same as provided schema
        for schema in self.get_provided_schemas():
            if schema.data_type == data_type:
                return schema.fields

        return {}

    async def validate_credentials(self, credentials: Dict[str, Any]) -> bool:
        """
        Validate if credentials are still valid.

        Args:
            credentials: User credentials

        Returns:
            True if valid, False otherwise
        """
        try:
            # Attempt to fetch minimal data to test credentials
            await self.fetch_data(credentials, self.get_provided_schemas()[0].data_type)
            return True
        except Exception as e:
            logger.error(f"Credential validation failed: {str(e)}")
            return False

    def supports_incremental_sync(self, data_type: str) -> bool:
        """
        Check if integration supports incremental sync for this data type.

        Args:
            data_type: Type of data

        Returns:
            True if incremental sync supported
        """
        # Default: assume all integrations support incremental sync
        return True

    def get_sync_frequency(self, data_type: str) -> str:
        """
        Get recommended sync frequency for data type.

        Args:
            data_type: Type of data

        Returns:
            Frequency string: realtime, hourly, daily
        """
        for schema in self.get_provided_schemas():
            if schema.data_type == data_type:
                return schema.frequency

        return "hourly"  # Default

    async def pre_sync_hook(
        self,
        db: AsyncSession,
        user_id: int,
        data_source_id: int
    ):
        """
        Hook called before sync starts.

        Can be used for setup, validation, etc.

        Args:
            db: Database session
            user_id: User ID
            data_source_id: Data source ID
        """
        pass

    async def post_sync_hook(
        self,
        db: AsyncSession,
        user_id: int,
        data_source_id: int,
        sync_result: SyncResult
    ):
        """
        Hook called after sync completes.

        Can be used for cleanup, notifications, etc.

        Args:
            db: Database session
            user_id: User ID
            data_source_id: Data source ID
            sync_result: Result of sync operation
        """
        pass


class APISyncMixin:
    """
    Mixin for integrations that sync via REST API.

    Provides common HTTP client functionality.
    """

    async def _make_api_request(
        self,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        timeout: int = 30
    ) -> Dict[str, Any]:
        """
        Make HTTP API request.

        Args:
            method: HTTP method (GET, POST, etc.)
            url: Request URL
            headers: Request headers
            params: Query parameters
            json_data: JSON body
            timeout: Request timeout in seconds

        Returns:
            Response data as dictionary
        """
        import aiohttp
        import asyncio

        if headers is None:
            headers = {}

        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=json_data,
                timeout=aiohttp.ClientTimeout(total=timeout)
            ) as response:
                response.raise_for_status()
                return await response.json()

    def _get_auth_header(self, access_token: str) -> Dict[str, str]:
        """
        Generate authorization header.

        Args:
            access_token: OAuth access token

        Returns:
            Authorization header dictionary
        """
        return {"Authorization": f"Bearer {access_token}"}


class WebhookMixin:
    """
    Mixin for integrations that support webhooks.

    Provides webhook registration and handling.
    """

    async def register_webhook(
        self,
        credentials: Dict[str, Any],
        webhook_url: str,
        events: List[str]
    ) -> str:
        """
        Register webhook with integration.

        Args:
            credentials: User credentials
            webhook_url: URL to receive webhooks
            events: List of events to subscribe to

        Returns:
            Webhook ID
        """
        raise NotImplementedError("Integration does not support webhooks")

    async def handle_webhook(
        self,
        db: AsyncSession,
        user_id: int,
        data_source_id: int,
        webhook_data: Dict[str, Any]
    ) -> SyncResult:
        """
        Handle incoming webhook data.

        Args:
            db: Database session
            user_id: User ID
            data_source_id: Data source ID
            webhook_data: Webhook payload

        Returns:
            SyncResult
        """
        raise NotImplementedError("Integration does not support webhooks")

    async def unregister_webhook(
        self,
        credentials: Dict[str, Any],
        webhook_id: str
    ):
        """
        Unregister webhook.

        Args:
            credentials: User credentials
            webhook_id: Webhook ID to unregister
        """
        raise NotImplementedError("Integration does not support webhooks")


# Helper functions

def create_oauth_config_from_env(
    integration_name: str,
    auth_url: str,
    token_url: str,
    scopes: List[str],
    redirect_uri: str = ""
) -> OAuthConfig:
    """
    Create OAuth config from environment variables.

    Expects CLIENT_ID and CLIENT_SECRET in environment.

    Args:
        integration_name: Name of integration (e.g., "GOOGLE", "STRAVA")
        auth_url: Authorization URL
        token_url: Token URL
        scopes: OAuth scopes
        redirect_uri: Redirect URI

    Returns:
        OAuthConfig instance
    """
    import os

    client_id_key = f"{integration_name.upper()}_CLIENT_ID"
    client_secret_key = f"{integration_name.upper()}_CLIENT_SECRET"

    client_id = os.getenv(client_id_key, "")
    client_secret = os.getenv(client_secret_key, "")

    return OAuthConfig(
        auth_url=auth_url,
        token_url=token_url,
        scopes=scopes,
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri=redirect_uri
    )
