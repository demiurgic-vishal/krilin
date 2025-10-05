"""
Integration Manager - Layer 2: Integration + Sync Layer
Registry of all available integrations with discovery and instantiation.
"""
import logging
from typing import Dict, List, Optional, Type

from app.services.integration_base import BaseIntegration, IntegrationInfo

logger = logging.getLogger(__name__)


class IntegrationManager:
    """
    Central registry of all available integrations.

    Responsibilities:
    - Load and register all integration classes
    - Provide list of available integrations (for marketplace UI)
    - Instantiate integration instances
    - Categorize integrations
    - Support dynamic loading (plugins)
    """

    def __init__(self):
        self._integrations: Dict[str, Type[BaseIntegration]] = {}
        self._integration_instances: Dict[str, BaseIntegration] = {}
        self._loaded = False

    def load_integrations(self):
        """
        Load all available integrations.

        This discovers and registers all integration classes.
        """
        if self._loaded:
            return

        # Import and register integrations
        # For now, manually import. Could use plugin system later.

        try:
            from app.services.google_calendar import GoogleCalendarIntegration
            self.register("google_calendar", GoogleCalendarIntegration)
        except Exception as e:
            logger.warning(f"Failed to load Google Calendar integration: {e}")

        try:
            from app.services.gmail import GmailIntegration
            self.register("gmail", GmailIntegration)
        except Exception as e:
            logger.warning(f"Failed to load Gmail integration: {e}")

        try:
            from app.services.whoop import WhoopIntegration
            self.register("whoop", WhoopIntegration)
        except Exception as e:
            logger.warning(f"Failed to load Whoop integration: {e}")

        try:
            from app.services.strava import StravaIntegration
            self.register("strava", StravaIntegration)
        except Exception as e:
            logger.warning(f"Failed to load Strava integration: {e}")

        self._loaded = True
        logger.info(f"Loaded {len(self._integrations)} integrations")

    def register(self, integration_id: str, integration_class: Type[BaseIntegration]):
        """
        Register an integration class.

        Args:
            integration_id: Unique integration identifier
            integration_class: Integration class (not instance)
        """
        self._integrations[integration_id] = integration_class
        logger.debug(f"Registered integration: {integration_id}")

    def get_integration(self, integration_id: str) -> Optional[BaseIntegration]:
        """
        Get integration instance by ID.

        Args:
            integration_id: Integration identifier

        Returns:
            Integration instance or None
        """
        if not self._loaded:
            self.load_integrations()

        # Return cached instance if exists
        if integration_id in self._integration_instances:
            return self._integration_instances[integration_id]

        # Create new instance
        if integration_id in self._integrations:
            integration_class = self._integrations[integration_id]
            instance = integration_class()
            self._integration_instances[integration_id] = instance
            return instance

        logger.warning(f"Integration not found: {integration_id}")
        return None

    def list_integrations(self) -> List[IntegrationInfo]:
        """
        Get list of all available integrations.

        Returns:
            List of IntegrationInfo for all integrations
        """
        if not self._loaded:
            self.load_integrations()

        integrations = []

        for integration_id in self._integrations.keys():
            integration = self.get_integration(integration_id)
            if integration:
                info = integration.get_integration_info()
                integrations.append(info)

        return integrations

    def get_integrations_by_category(self, category: str) -> List[IntegrationInfo]:
        """
        Get integrations in a specific category.

        Args:
            category: Category name (calendar, fitness, email, etc.)

        Returns:
            List of IntegrationInfo matching category
        """
        all_integrations = self.list_integrations()
        return [info for info in all_integrations if info.category == category]

    def search_integrations(self, query: str) -> List[IntegrationInfo]:
        """
        Search integrations by name, description, or tags.

        Args:
            query: Search query

        Returns:
            List of matching IntegrationInfo
        """
        all_integrations = self.list_integrations()
        query_lower = query.lower()

        results = []
        for info in all_integrations:
            # Search in name
            if query_lower in info.name.lower():
                results.append(info)
                continue

            # Search in description
            if query_lower in info.description.lower():
                results.append(info)
                continue

            # Search in tags
            if any(query_lower in tag.lower() for tag in info.tags):
                results.append(info)
                continue

        return results

    def get_integrations_providing_data_type(self, data_type: str) -> List[str]:
        """
        Find integrations that provide a specific data type.

        Useful for suggesting integrations when workflow needs data.

        Args:
            data_type: Data type needed (e.g., "calendar_events", "emails")

        Returns:
            List of integration IDs
        """
        if not self._loaded:
            self.load_integrations()

        matching_integrations = []

        for integration_id in self._integrations.keys():
            integration = self.get_integration(integration_id)
            if integration:
                schemas = integration.get_provided_schemas()
                for schema in schemas:
                    if schema.data_type == data_type:
                        matching_integrations.append(integration_id)
                        break

        return matching_integrations

    def get_categories(self) -> List[str]:
        """
        Get list of all integration categories.

        Returns:
            List of unique category names
        """
        integrations = self.list_integrations()
        categories = set(info.category for info in integrations)
        return sorted(list(categories))


# Global integration manager instance
_integration_manager: Optional[IntegrationManager] = None


def get_integration_manager() -> IntegrationManager:
    """
    Get global integration manager instance.

    Returns:
        IntegrationManager instance
    """
    global _integration_manager

    if _integration_manager is None:
        _integration_manager = IntegrationManager()
        _integration_manager.load_integrations()

    return _integration_manager


# Convenience functions

def get_integration(integration_id: str) -> Optional[BaseIntegration]:
    """
    Get integration instance by ID.

    Args:
        integration_id: Integration identifier

    Returns:
        Integration instance or None
    """
    manager = get_integration_manager()
    return manager.get_integration(integration_id)


def list_all_integrations() -> List[IntegrationInfo]:
    """
    Get list of all available integrations.

    Returns:
        List of IntegrationInfo
    """
    manager = get_integration_manager()
    return manager.list_integrations()


def find_integrations_for_data_type(data_type: str) -> List[IntegrationInfo]:
    """
    Find integrations that provide specific data type.

    Args:
        data_type: Data type needed

    Returns:
        List of IntegrationInfo for matching integrations
    """
    manager = get_integration_manager()
    integration_ids = manager.get_integrations_providing_data_type(data_type)

    integrations = []
    for integration_id in integration_ids:
        integration = manager.get_integration(integration_id)
        if integration:
            integrations.append(integration.get_integration_info())

    return integrations
