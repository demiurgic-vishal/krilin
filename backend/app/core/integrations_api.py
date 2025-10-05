"""
Integrations API - ctx.integrations implementation.

Provides access to external service integrations:
- ctx.integrations.get(integration_id) - Get integration instance
- ctx.integrations.query(integration_id, ...) - Query synced data
- ctx.integrations.action(integration_id, action, params) - Trigger actions
- ctx.integrations.list_available() - List available integrations
- ctx.integrations.list_connected() - List user's connected integrations

Wraps the existing integration manager and sync engine.
"""
import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.data_source import DataSource
from app.services.integration_manager import get_integration_manager, get_integration
from app.services.credential_manager import get_credential_manager

logger = logging.getLogger(__name__)


class IntegrationsAPI:
    """
    Integrations API for accessing external services.

    Available via ctx.integrations in any app.
    """

    def __init__(self, db: AsyncSession, user_id: int, app_id: str):
        self.db = db
        self.user_id = user_id
        self.app_id = app_id
        self._integration_manager = get_integration_manager()
        self._credential_manager = get_credential_manager()

    async def get(self, integration_id: str):
        """
        Get an integration instance.

        Args:
            integration_id: Integration ID (e.g., "google_calendar")

        Returns:
            Integration instance

        Example:
            calendar = await ctx.integrations.get("google_calendar")
            events = await calendar.fetch_data(user_credentials, start_date="2024-01-01")
        """
        # Check if user has connected this integration
        result = await self.db.execute(
            select(DataSource).where(
                DataSource.user_id == self.user_id,
                DataSource.source_type == integration_id
            )
        )
        data_source = result.scalar_one_or_none()

        if not data_source:
            raise ValueError(
                f"Integration '{integration_id}' is not connected for this user"
            )

        # Get integration instance from manager
        integration = self._integration_manager.get_integration(integration_id)

        if not integration:
            raise ValueError(f"Integration '{integration_id}' not found")

        return integration

    async def query(
        self,
        integration_id: str,
        table: str,
        where: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        order_by: Optional[Dict[str, str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Query data synced from an integration.

        Args:
            integration_id: Integration ID
            table: Data type/table (e.g., "events", "emails", "workouts")
            where: Filter conditions
            limit: Max records
            order_by: Sort order

        Returns:
            List of records

        Example:
            # Get calendar events from last week
            events = await ctx.integrations.query(
                "google_calendar",
                table="events",
                where={
                    "start": {"gte": "2024-01-01"},
                    "end": {"lte": "2024-01-07"}
                },
                limit=100,
                order_by={"start": "asc"}
            )
        """
        # Get data source
        result = await self.db.execute(
            select(DataSource).where(
                DataSource.user_id == self.user_id,
                DataSource.source_type == integration_id
            )
        )
        data_source = result.scalar_one_or_none()

        if not data_source:
            raise ValueError(
                f"Integration '{integration_id}' is not connected"
            )

        # Query synced data from data_records table
        # For now, we'll use a simplified approach
        # In production, this would use the Query Engine with proper table mapping

        from sqlalchemy import text

        # Build WHERE clause
        where_clauses = [f"user_id = {self.user_id}"]
        where_clauses.append(f"source_id = {data_source.id}")

        params = {}

        if where:
            for i, (field, value) in enumerate(where.items()):
                param_name = f"where_{i}"

                # Handle comparison operators
                if isinstance(value, dict):
                    for op, val in value.items():
                        if op == "gte":
                            where_clauses.append(f"data->>'{field}' >= :{param_name}")
                        elif op == "lte":
                            where_clauses.append(f"data->>'{field}' <= :{param_name}")
                        elif op == "gt":
                            where_clauses.append(f"data->>'{field}' > :{param_name}")
                        elif op == "lt":
                            where_clauses.append(f"data->>'{field}' < :{param_name}")
                        else:
                            where_clauses.append(f"data->>'{field}' = :{param_name}")
                        params[param_name] = val
                else:
                    where_clauses.append(f"data->>'{field}' = :{param_name}")
                    params[param_name] = value

        where_sql = " AND ".join(where_clauses)

        # Build ORDER BY
        order_sql = ""
        if order_by:
            order_parts = []
            for field, direction in order_by.items():
                dir_sql = "ASC" if direction.lower() == "asc" else "DESC"
                order_parts.append(f"data->>'{field}' {dir_sql}")
            order_sql = "ORDER BY " + ", ".join(order_parts)

        # Build LIMIT
        limit_sql = f"LIMIT {limit}" if limit else ""

        # Execute query
        query_sql = f"""
            SELECT data
            FROM data_records
            WHERE {where_sql}
            {order_sql}
            {limit_sql}
        """

        result = await self.db.execute(text(query_sql), params)
        rows = result.mappings().all()

        logger.debug(
            f"[INTEGRATIONS] Query {integration_id}.{table}: {len(rows)} records"
        )

        return [dict(row["data"]) for row in rows]

    async def action(
        self,
        integration_id: str,
        action: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Trigger an action on an integration.

        Args:
            integration_id: Integration ID
            action: Action name (e.g., "create_event", "send_email")
            params: Action parameters

        Returns:
            Action result

        Example:
            # Create a calendar event
            event = await ctx.integrations.action(
                "google_calendar",
                "create_event",
                {
                    "title": "Team Meeting",
                    "start": "2024-01-10T10:00:00",
                    "end": "2024-01-10T11:00:00"
                }
            )
        """
        # Get integration
        integration = await self.get(integration_id)

        # Get user credentials
        credentials = await self._credential_manager.get_credentials(
            self.db,
            self.user_id,
            integration_id
        )

        if not credentials:
            raise ValueError(f"No credentials found for '{integration_id}'")

        # Call action method on integration
        # Integration classes should implement action methods
        if not hasattr(integration, action):
            raise ValueError(
                f"Integration '{integration_id}' does not support action '{action}'"
            )

        action_method = getattr(integration, action)

        # Call the action with credentials and params
        result = await action_method(credentials, **params)

        logger.info(
            f"[INTEGRATIONS] Executed {integration_id}.{action} for user {self.user_id}"
        )

        return result

    async def list_available(self) -> List[Dict[str, Any]]:
        """
        List all available integrations (not just user's).

        Returns:
            List of integration info

        Example:
            integrations = await ctx.integrations.list_available()
            for integration in integrations:
                print(f"{integration['name']}: {integration['description']}")
        """
        all_integrations = self._integration_manager.list_integrations()

        return [
            {
                "id": integration.name.lower().replace(" ", "_"),
                "name": integration.name,
                "description": integration.description,
                "category": integration.category,
                "icon": integration.icon,
                "auth_type": integration.auth_type,
                "official": integration.official,
                "tags": integration.tags
            }
            for integration in all_integrations
        ]

    async def list_connected(self) -> List[Dict[str, Any]]:
        """
        List user's connected integrations.

        Returns:
            List of connected integrations with status

        Example:
            connected = await ctx.integrations.list_connected()
            for integration in connected:
                print(f"{integration['name']}: {integration['status']}")
        """
        result = await self.db.execute(
            select(DataSource).where(
                DataSource.user_id == self.user_id
            )
        )
        data_sources = result.scalars().all()

        connected = []

        for ds in data_sources:
            # Get integration info
            integration = self._integration_manager.get_integration(ds.source_type)

            if integration:
                info = integration.get_integration_info()

                connected.append({
                    "id": ds.source_type,
                    "name": info.name,
                    "description": info.description,
                    "category": info.category,
                    "icon": info.icon,
                    "status": ds.status,
                    "connected_at": ds.connected_at,
                    "last_sync": ds.last_sync_at,
                    "sync_frequency": ds.sync_frequency
                })

        return connected

    async def is_connected(self, integration_id: str) -> bool:
        """
        Check if user has connected an integration.

        Args:
            integration_id: Integration ID

        Returns:
            True if connected, False otherwise

        Example:
            if await ctx.integrations.is_connected("google_calendar"):
                # Use calendar data
                pass
        """
        result = await self.db.execute(
            select(DataSource).where(
                DataSource.user_id == self.user_id,
                DataSource.source_type == integration_id
            )
        )
        return result.scalar_one_or_none() is not None

    async def get_sync_status(self, integration_id: str) -> Dict[str, Any]:
        """
        Get sync status for an integration.

        Args:
            integration_id: Integration ID

        Returns:
            Sync status info

        Example:
            status = await ctx.integrations.get_sync_status("google_calendar")
            print(f"Last synced: {status['last_sync_at']}")
            print(f"Records: {status['total_records']}")
        """
        result = await self.db.execute(
            select(DataSource).where(
                DataSource.user_id == self.user_id,
                DataSource.source_type == integration_id
            )
        )
        data_source = result.scalar_one_or_none()

        if not data_source:
            raise ValueError(f"Integration '{integration_id}' not connected")

        return {
            "integration_id": integration_id,
            "status": data_source.status,
            "last_sync_at": data_source.last_sync_at,
            "sync_frequency": data_source.sync_frequency,
            "total_records": data_source.total_records or 0,
            "is_syncing": data_source.status == "syncing"
        }
