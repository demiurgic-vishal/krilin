"""
User App Manager - Manages file-based storage for user-generated apps.

This service handles:
- Creating app directory structure for users
- Writing/reading app files (frontend, backend, manifest, preview)
- Managing app file lifecycle
- Validating app structure
"""
import os
import json
import shutil
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class UserAppManager:
    """
    Manages file-based storage for user-generated apps.

    Directory structure:
        apps/
            user_{user_id}/
                {app_id}/
                    manifest.json      # App metadata and configuration
                    frontend.tsx       # React component source
                    backend.py         # Python backend actions
                    preview.html       # Wrapper with Krilin SDK
                    app.bundle.js      # Compiled frontend (optional)
                    CLAUDE.md          # Context for Claude Code SDK
    """

    def __init__(self, base_dir: str = "apps"):
        """
        Initialize UserAppManager.

        Args:
            base_dir: Base directory for all user apps (default: "apps")
        """
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)

    def get_user_apps_dir(self, user_id: int) -> Path:
        """Get the directory for a user's apps."""
        user_dir = self.base_dir / f"user_{user_id}"
        user_dir.mkdir(exist_ok=True)
        return user_dir

    def get_app_dir(self, user_id: int, app_id: str) -> Path:
        """Get the directory for a specific app."""
        # Normalize app_id: convert hyphens to underscores for directory name
        # This matches the Python module naming convention
        normalized_app_id = app_id.replace('-', '_')
        return self.get_user_apps_dir(user_id) / normalized_app_id

    def create_app_directory(
        self,
        user_id: int,
        app_id: str,
        manifest: Dict[str, Any],
        frontend_code: Optional[str] = None,
        backend_code: Optional[str] = None,
        preview_html: Optional[str] = None
    ) -> Path:
        """
        Create a new app directory structure.

        Args:
            user_id: User ID who owns the app
            app_id: App identifier (e.g., "my-habit-tracker")
            manifest: App manifest dictionary
            frontend_code: React component source code (optional)
            backend_code: Python backend code (optional)
            preview_html: Preview HTML wrapper (optional)

        Returns:
            Path to the created app directory

        Raises:
            FileExistsError: If app directory already exists
        """
        app_dir = self.get_app_dir(user_id, app_id)

        if app_dir.exists():
            raise FileExistsError(f"App directory already exists: {app_dir}")

        # Create app directory
        app_dir.mkdir(parents=True, exist_ok=False)
        logger.info(f"Created app directory: {app_dir}")

        # Write manifest
        self.write_manifest(user_id, app_id, manifest)

        # Write frontend if provided
        if frontend_code:
            self.write_frontend(user_id, app_id, frontend_code)

        # Write backend if provided
        if backend_code:
            self.write_backend(user_id, app_id, backend_code)

        # Write preview HTML if provided
        if preview_html:
            self.write_preview_html(user_id, app_id, preview_html)

        # Create CLAUDE.md with app context
        self.write_claude_context(user_id, app_id, manifest)

        logger.info(f"App directory created successfully: {app_dir}")
        return app_dir

    def write_manifest(self, user_id: int, app_id: str, manifest: Dict[str, Any]) -> None:
        """Write app manifest.json file."""
        app_dir = self.get_app_dir(user_id, app_id)
        manifest_path = app_dir / "manifest.json"

        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)

        logger.info(f"Wrote manifest: {manifest_path}")

    def write_frontend(self, user_id: int, app_id: str, code: str) -> None:
        """Write frontend.tsx file."""
        app_dir = self.get_app_dir(user_id, app_id)
        frontend_path = app_dir / "frontend.tsx"

        with open(frontend_path, 'w') as f:
            f.write(code)

        logger.info(f"Wrote frontend: {frontend_path}")

    def write_backend(self, user_id: int, app_id: str, code: str) -> None:
        """Write backend.py file."""
        app_dir = self.get_app_dir(user_id, app_id)
        backend_path = app_dir / "backend.py"

        with open(backend_path, 'w') as f:
            f.write(code)

        logger.info(f"Wrote backend: {backend_path}")

    def write_preview_html(self, user_id: int, app_id: str, html: str) -> None:
        """Write preview.html file."""
        app_dir = self.get_app_dir(user_id, app_id)
        preview_path = app_dir / "preview.html"

        with open(preview_path, 'w') as f:
            f.write(html)

        logger.info(f"Wrote preview HTML: {preview_path}")

    def write_bundle(self, user_id: int, app_id: str, bundle_js: str) -> None:
        """Write compiled app.bundle.js file."""
        app_dir = self.get_app_dir(user_id, app_id)
        bundle_path = app_dir / "app.bundle.js"

        with open(bundle_path, 'w') as f:
            f.write(bundle_js)

        logger.info(f"Wrote bundle: {bundle_path}")

    def update_file(self, user_id: int, app_id: str, filename: str, content: str) -> None:
        """
        Update a specific app file.

        Args:
            user_id: User ID who owns the app
            app_id: App identifier
            filename: Name of file to update (frontend.tsx, backend.py, manifest.json)
            content: New file content

        Raises:
            FileNotFoundError: If app directory doesn't exist
            ValueError: If filename is not allowed
        """
        allowed_files = ["frontend.tsx", "backend.py", "manifest.json"]
        if filename not in allowed_files:
            raise ValueError(f"Cannot update file '{filename}'. Allowed: {allowed_files}")

        app_dir = self.get_app_dir(user_id, app_id)
        if not app_dir.exists():
            raise FileNotFoundError(f"App directory not found: {app_dir}")

        file_path = app_dir / filename

        # For manifest.json, validate it's valid JSON before writing
        if filename == "manifest.json":
            try:
                json.loads(content)  # Validate JSON
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON content: {e}")

        with open(file_path, 'w') as f:
            f.write(content)

        logger.info(f"Updated file: {file_path}")

    def write_claude_context(self, user_id: int, app_id: str, manifest: Dict[str, Any]) -> None:
        """
        Write CLAUDE.md file with app context for Claude Code SDK.

        This file is automatically loaded by Claude Code SDK when editing the app.
        """
        app_dir = self.get_app_dir(user_id, app_id)
        claude_md_path = app_dir / "CLAUDE.md"

        # Generate context based on manifest
        app_name = manifest.get("name", app_id)
        description = manifest.get("description", "")

        # Try to load comprehensive guide
        guide_path = Path(__file__).parent.parent.parent.parent / "CLAUDE_AGENT_SYSTEM_PROMPT.md"
        try:
            with open(guide_path, 'r') as f:
                platform_guide = f.read()
        except FileNotFoundError:
            logger.warning(f"Platform guide not found at {guide_path}, using minimal context")
            platform_guide = self._get_minimal_guide()

        context = f"""# {app_name}

{description}

## App Structure

This is a Krilin platform app with the following files:

- **manifest.json**: App metadata and configuration
- **frontend.tsx**: React component (UI)
- **backend.py**: Python actions and logic
- **preview.html**: Preview wrapper with Krilin SDK

---

## COMPLETE KRILIN PLATFORM GUIDE

{platform_guide}

---

## Current App Configuration

**Database Tables:**
{self._format_database_tables(manifest)}

**Actions:**
{self._format_actions(manifest)}

## Guidelines for Editing This App

- Always use RetroUI components (Card, Button, Input, Badge, Checkbox)
- Always use CSS variables for colors (bg-[var(--primary)], etc.)
- Always use thick borders (border-2 or border-4)
- Always use retro shadows (shadow-[4px_4px_0_0_var(--border)])
- Keep frontend.tsx as a single React component with default export
- Backend actions must be async functions with ctx: PlatformContext parameter
- Update manifest.json when adding new actions or database tables
- Test changes using the preview
"""

        with open(claude_md_path, 'w') as f:
            f.write(context)

        logger.info(f"Wrote Claude context: {claude_md_path}")

    def _format_database_tables(self, manifest: Dict[str, Any]) -> str:
        """Format database tables section for CLAUDE.md."""
        tables = manifest.get("database", {}).get("tables", [])
        if not tables:
            return "None"

        formatted = []
        for table in tables:
            name = table.get("name", "unknown")
            desc = table.get("description", "")
            schema = table.get("schema", {})
            formatted.append(f"- `{name}`: {desc}")
            for field, field_type in schema.items():
                formatted.append(f"  - {field}: {field_type}")

        return "\n".join(formatted)

    def _format_actions(self, manifest: Dict[str, Any]) -> str:
        """Format actions section for CLAUDE.md."""
        actions = manifest.get("actions", [])
        if not actions:
            return "None"

        formatted = []
        for action in actions:
            action_id = action.get("id", "unknown")
            desc = action.get("description", "")
            params = action.get("parameters", {})
            formatted.append(f"- `{action_id}`: {desc}")
            if params:
                formatted.append(f"  Parameters: {', '.join(params.keys())}")

        return "\n".join(formatted)

    def _get_minimal_guide(self) -> str:
        """Get minimal platform guide if full guide is not found."""
        return """## Krilin RetroUI Components

**IMPORTANT: Always use these themed components!**

```typescript
// Card
<Card><Card.Header><Card.Title>Title</Card.Title></Card.Header><Card.Content>Content</Card.Content></Card>

// Button
<Button>Click</Button>
<Button variant="destructive">Delete</Button>

// Input
<Input placeholder="Text..." />

// Badge
<Badge>Label</Badge>
```

**Styling:**
- Use `bg-[var(--primary)]`, `text-[var(--foreground)]`, `border-[var(--border)]`
- Shadows: `shadow-[4px_4px_0_0_var(--border)]`
- Always use thick borders: `border-2 border-[var(--border)]`

## Platform APIs

**Frontend:**
- `window.krilin.actions.call(name, params)` - Call backend actions
- `window.krilin.storage.query/insert/update/delete` - Data operations

**Backend:**
- `ctx: PlatformContext` parameter in all actions
- `ctx.storage.query/insert/update/delete` - Database operations
- `ctx.integrations.*` - External service access
"""

    def read_manifest(self, user_id: int, app_id: str) -> Dict[str, Any]:
        """Read and parse manifest.json."""
        app_dir = self.get_app_dir(user_id, app_id)
        manifest_path = app_dir / "manifest.json"

        if not manifest_path.exists():
            raise FileNotFoundError(f"Manifest not found: {manifest_path}")

        with open(manifest_path, 'r') as f:
            return json.load(f)

    def read_frontend(self, user_id: int, app_id: str) -> str:
        """Read frontend.tsx file."""
        app_dir = self.get_app_dir(user_id, app_id)
        frontend_path = app_dir / "frontend.tsx"

        if not frontend_path.exists():
            raise FileNotFoundError(f"Frontend not found: {frontend_path}")

        with open(frontend_path, 'r') as f:
            return f.read()

    def read_backend(self, user_id: int, app_id: str) -> str:
        """Read backend.py file."""
        app_dir = self.get_app_dir(user_id, app_id)
        backend_path = app_dir / "backend.py"

        if not backend_path.exists():
            raise FileNotFoundError(f"Backend not found: {backend_path}")

        with open(backend_path, 'r') as f:
            return f.read()

    def read_preview_html(self, user_id: int, app_id: str) -> str:
        """Read preview.html file."""
        app_dir = self.get_app_dir(user_id, app_id)
        preview_path = app_dir / "preview.html"

        if not preview_path.exists():
            raise FileNotFoundError(f"Preview HTML not found: {preview_path}")

        with open(preview_path, 'r') as f:
            return f.read()

    def read_bundle(self, user_id: int, app_id: str) -> Optional[str]:
        """Read app.bundle.js file if it exists."""
        app_dir = self.get_app_dir(user_id, app_id)
        bundle_path = app_dir / "app.bundle.js"

        if not bundle_path.exists():
            return None

        with open(bundle_path, 'r') as f:
            return f.read()

    def app_exists(self, user_id: int, app_id: str) -> bool:
        """Check if an app directory exists."""
        return self.get_app_dir(user_id, app_id).exists()

    def list_user_apps(self, user_id: int) -> List[str]:
        """List all app IDs for a user."""
        user_dir = self.get_user_apps_dir(user_id)

        if not user_dir.exists():
            return []

        return [
            d.name for d in user_dir.iterdir()
            if d.is_dir() and (d / "manifest.json").exists()
        ]

    def delete_app(self, user_id: int, app_id: str) -> None:
        """Delete an app directory and all its files."""
        app_dir = self.get_app_dir(user_id, app_id)

        if not app_dir.exists():
            raise FileNotFoundError(f"App directory not found: {app_dir}")

        shutil.rmtree(app_dir)
        logger.info(f"Deleted app directory: {app_dir}")

    def get_app_path(self, user_id: int, app_id: str) -> str:
        """
        Get the full path to an app directory.

        Returns absolute path as string for storing in database.
        """
        return str(self.get_app_dir(user_id, app_id).absolute())

    def update_file(self, user_id: int, app_id: str, filename: str, content: str) -> None:
        """
        Update a specific file in the app directory.

        Args:
            user_id: User ID
            app_id: App ID
            filename: Name of file to update (e.g., "frontend.tsx", "backend.py")
            content: New file content
        """
        app_dir = self.get_app_dir(user_id, app_id)
        file_path = app_dir / filename

        # Validate filename for security
        if not file_path.resolve().is_relative_to(app_dir.resolve()):
            raise ValueError(f"Invalid filename: {filename}")

        with open(file_path, 'w') as f:
            f.write(content)

        logger.info(f"Updated {filename} in {app_id}")


# Global instance
_user_app_manager: Optional[UserAppManager] = None


def get_user_app_manager() -> UserAppManager:
    """Get the global UserAppManager instance."""
    global _user_app_manager
    if _user_app_manager is None:
        _user_app_manager = UserAppManager()
    return _user_app_manager
