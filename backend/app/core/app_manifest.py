"""
App Manifest System - Define complete apps (not workflows).

Apps are full applications with:
- UI components (widgets, pages, settings)
- Database tables with schemas
- Actions/endpoints
- Embedded Claude AI agent
- Declared outputs for composition
- Dependencies on other apps

Replaces the old workflow manifest system.
"""
import json
import yaml
import logging
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from pathlib import Path
from packaging import version as pkg_version

logger = logging.getLogger(__name__)


@dataclass
class AppMetadata:
    """App metadata."""
    id: str  # e.g., "habit-tracker"
    name: str  # e.g., "Habit Tracker"
    version: str  # e.g., "1.0.0"
    author: str  # e.g., "Krilin Team"
    description: str
    icon: str = "app"
    category: str = "general"
    tags: List[str] = field(default_factory=list)


@dataclass
class AppDependencies:
    """App dependency specification."""
    required_apps: List[Dict[str, str]] = field(default_factory=list)  # [{"id": "habit-tracker", "version": "^1.0.0"}]
    optional_apps: List[Dict[str, str]] = field(default_factory=list)
    required_integrations: List[str] = field(default_factory=list)  # ["google_calendar", "whoop"]


@dataclass
class AppOutput:
    """Output that an app exposes."""
    id: str  # e.g., "daily_streaks"
    type: str  # "data", "agent", "stream"
    schema: Optional[Dict[str, str]] = None  # For data outputs
    description: str = ""
    access_level: str = "any_app"  # "any_app", "requires_permission"
    update_frequency: Optional[str] = None  # "real-time", "hourly", "daily"


@dataclass
class AppPermissions:
    """Permissions app requires."""
    data_scopes: List[str] = field(default_factory=list)  # ["read:own_data", "write:own_data"]
    api_access: bool = False
    notifications: bool = False
    files: bool = False
    schedule: bool = False
    ai: bool = False


@dataclass
class AgentConfig:
    """Claude AI agent configuration."""
    system_prompt: str
    tools: List[str] = field(default_factory=list)  # Tool function names defined in app code
    capabilities: List[str] = field(default_factory=list)  # ["web_search", "code_execution"]
    max_turns: int = 50
    model: str = "sonnet"


@dataclass
class DatabaseTable:
    """App database table definition."""
    name: str  # e.g., "habits" (will become app_habit-tracker_habits)
    schema: Dict[str, str]  # {field: type}
    description: Optional[str] = None
    indexes: List[str] = field(default_factory=list)  # Fields to index


@dataclass
class UIComponent:
    """UI component definition."""
    component_id: str  # e.g., "habit_streak_widget"
    component_type: str  # "widget", "page", "settings"
    title: str
    size: str = "medium"  # For widgets: "small", "medium", "large"
    data_bindings: List[str] = field(default_factory=list)  # Tables this component uses


@dataclass
class AppAction:
    """App action/endpoint definition."""
    name: str  # e.g., "log_habit"
    description: str
    parameters: List[Dict[str, Any]] = field(default_factory=list)
    reads_from: List[str] = field(default_factory=list)  # Tables read
    writes_to: List[str] = field(default_factory=list)  # Tables written
    exposed_to_agent: bool = True  # Can agent call this?


class AppManifest:
    """
    Complete app manifest.

    Example manifest.json:
    ```json
    {
      "metadata": {
        "id": "habit-tracker",
        "name": "Habit Tracker",
        "version": "1.0.0",
        "author": "Krilin Team",
        "description": "Track daily habits and build streaks",
        "category": "productivity",
        "tags": ["habits", "productivity", "tracking"]
      },
      "dependencies": {
        "required_apps": [],
        "optional_apps": [
          {"id": "calendar", "version": "^1.0.0"}
        ],
        "required_integrations": []
      },
      "outputs": [
        {
          "id": "daily_streaks",
          "type": "data",
          "schema": {"habit_id": "string", "streak": "number", "last_completed": "datetime"},
          "description": "Current streak for each habit",
          "update_frequency": "real-time"
        }
      ],
      "permissions": {
        "data_scopes": ["read:own_data", "write:own_data"],
        "notifications": true,
        "schedule": true
      },
      "agent_config": {
        "system_prompt": "You are a habit tracking assistant. Help users build and maintain habits.",
        "tools": ["get_habits", "log_habit", "calculate_streak", "get_stats"],
        "capabilities": ["web_search"]
      },
      "database": {
        "tables": [
          {
            "name": "habits",
            "schema": {
              "id": "string",
              "name": "string",
              "description": "string",
              "frequency": "string",
              "active": "boolean",
              "created_at": "datetime"
            },
            "indexes": ["active", "created_at"]
          },
          {
            "name": "habit_logs",
            "schema": {
              "id": "string",
              "habit_id": "string",
              "completed_at": "datetime",
              "notes": "string"
            },
            "indexes": ["habit_id", "completed_at"]
          }
        ]
      },
      "ui_components": [
        {
          "component_id": "habit_list",
          "component_type": "page",
          "title": "My Habits",
          "data_bindings": ["habits", "habit_logs"]
        },
        {
          "component_id": "streak_widget",
          "component_type": "widget",
          "title": "Current Streaks",
          "size": "medium",
          "data_bindings": ["habits", "habit_logs"]
        }
      ],
      "actions": [
        {
          "name": "log_habit",
          "description": "Log completion of a habit",
          "parameters": [
            {"name": "habit_id", "type": "string", "required": true},
            {"name": "notes", "type": "string", "required": false}
          ],
          "reads_from": ["habits"],
          "writes_to": ["habit_logs"],
          "exposed_to_agent": true
        }
      ]
    }
    ```
    """

    def __init__(
        self,
        metadata: AppMetadata,
        dependencies: AppDependencies,
        outputs: List[AppOutput],
        permissions: AppPermissions,
        agent_config: AgentConfig,
        database: List[DatabaseTable],
        ui_components: List[UIComponent],
        actions: List[AppAction]
    ):
        self.metadata = metadata
        self.dependencies = dependencies
        self.outputs = outputs
        self.permissions = permissions
        self.agent_config = agent_config
        self.database = database
        self.ui_components = ui_components
        self.actions = actions

    @classmethod
    def from_json(cls, json_path: Path) -> 'AppManifest':
        """Load manifest from JSON file."""
        with open(json_path, 'r') as f:
            data = json.load(f)
        return cls.from_dict(data)

    @classmethod
    def from_yaml(cls, yaml_path: Path) -> 'AppManifest':
        """Load manifest from YAML file."""
        with open(yaml_path, 'r') as f:
            data = yaml.safe_load(f)
        return cls.from_dict(data)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AppManifest':
        """Create manifest from dictionary."""
        # Parse metadata
        metadata = AppMetadata(**data["metadata"])

        # Parse dependencies
        deps_data = data.get("dependencies", {})
        dependencies = AppDependencies(
            required_apps=deps_data.get("required_apps", []),
            optional_apps=deps_data.get("optional_apps", []),
            required_integrations=deps_data.get("required_integrations", [])
        )

        # Parse outputs
        outputs = [
            AppOutput(**output_data)
            for output_data in data.get("outputs", [])
        ]

        # Parse permissions
        perms_data = data.get("permissions", {})
        permissions = AppPermissions(**perms_data)

        # Parse agent config
        agent_data = data.get("agent_config", {})
        agent_config = AgentConfig(**agent_data)

        # Parse database tables
        db_data = data.get("database", {})
        tables = [
            DatabaseTable(**table_data)
            for table_data in db_data.get("tables", [])
        ]

        # Parse UI components
        ui_components = [
            UIComponent(**ui_data)
            for ui_data in data.get("ui_components", [])
        ]

        # Parse actions
        actions = [
            AppAction(**action_data)
            for action_data in data.get("actions", [])
        ]

        return cls(
            metadata=metadata,
            dependencies=dependencies,
            outputs=outputs,
            permissions=permissions,
            agent_config=agent_config,
            database=tables,
            ui_components=ui_components,
            actions=actions
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert manifest to dictionary."""
        return {
            "metadata": {
                "id": self.metadata.id,
                "name": self.metadata.name,
                "version": self.metadata.version,
                "author": self.metadata.author,
                "description": self.metadata.description,
                "icon": self.metadata.icon,
                "category": self.metadata.category,
                "tags": self.metadata.tags
            },
            "dependencies": {
                "required_apps": self.dependencies.required_apps,
                "optional_apps": self.dependencies.optional_apps,
                "required_integrations": self.dependencies.required_integrations
            },
            "outputs": [
                {
                    "id": output.id,
                    "type": output.type,
                    "schema": output.schema,
                    "description": output.description,
                    "access_level": output.access_level,
                    "update_frequency": output.update_frequency
                }
                for output in self.outputs
            ],
            "permissions": {
                "data_scopes": self.permissions.data_scopes,
                "api_access": self.permissions.api_access,
                "notifications": self.permissions.notifications,
                "files": self.permissions.files,
                "schedule": self.permissions.schedule,
                "ai": self.permissions.ai
            },
            "agent_config": {
                "system_prompt": self.agent_config.system_prompt,
                "tools": self.agent_config.tools,
                "capabilities": self.agent_config.capabilities,
                "max_turns": self.agent_config.max_turns,
                "model": self.agent_config.model
            },
            "database": {
                "tables": [
                    {
                        "name": table.name,
                        "schema": table.schema,
                        "description": table.description,
                        "indexes": table.indexes
                    }
                    for table in self.database
                ]
            },
            "ui_components": [
                {
                    "component_id": ui.component_id,
                    "component_type": ui.component_type,
                    "title": ui.title,
                    "size": ui.size,
                    "data_bindings": ui.data_bindings
                }
                for ui in self.ui_components
            ],
            "actions": [
                {
                    "name": action.name,
                    "description": action.description,
                    "parameters": action.parameters,
                    "reads_from": action.reads_from,
                    "writes_to": action.writes_to,
                    "exposed_to_agent": action.exposed_to_agent
                }
                for action in self.actions
            ]
        }

    def validate(self) -> List[str]:
        """
        Validate manifest structure and return errors.

        Returns:
            List of error messages (empty if valid)
        """
        errors = []

        # Validate metadata
        if not self.metadata.id:
            errors.append("App ID is required")
        if not self.metadata.name:
            errors.append("App name is required")
        if not self.metadata.version:
            errors.append("App version is required")
        else:
            # Validate semver
            try:
                pkg_version.parse(self.metadata.version)
            except Exception:
                errors.append(f"Invalid version format: {self.metadata.version}")

        # Validate dependencies
        for dep in self.dependencies.required_apps:
            if "id" not in dep or "version" not in dep:
                errors.append(f"Dependency missing id or version: {dep}")

        # Validate database tables
        table_names = set()
        for table in self.database:
            if not table.name:
                errors.append("Table name is required")
            if table.name in table_names:
                errors.append(f"Duplicate table name: {table.name}")
            table_names.add(table.name)

            if not table.schema:
                errors.append(f"Table '{table.name}' has no schema")

        # Validate actions reference valid tables
        for action in self.actions:
            for table_name in action.reads_from + action.writes_to:
                if table_name not in table_names:
                    errors.append(f"Action '{action.name}' references unknown table: {table_name}")

        # Validate UI components reference valid tables
        for ui in self.ui_components:
            for table_name in ui.data_bindings:
                if table_name not in table_names:
                    errors.append(f"UI component '{ui.component_id}' references unknown table: {table_name}")

        return errors

    def get_required_dependencies(self) -> List[Dict[str, str]]:
        """Get list of required app dependencies."""
        return self.dependencies.required_apps

    def get_all_dependencies(self) -> List[Dict[str, str]]:
        """Get list of all app dependencies (required + optional)."""
        return self.dependencies.required_apps + self.dependencies.optional_apps

    def get_required_integrations(self) -> List[str]:
        """Get list of required integrations."""
        return self.dependencies.required_integrations

    def __repr__(self) -> str:
        return f"<AppManifest(id='{self.metadata.id}', version='{self.metadata.version}')>"
