"""
App Generator Service - Generates apps using Claude Code SDK.

This service:
- Takes user prompts and generates complete Krilin apps
- Uses Claude Code SDK for AI-powered code generation
- Creates frontend (React), backend (Python), and manifest files
- Generates preview HTML with Krilin SDK integration
"""
import os
import json
import logging
import re
from typing import Dict, Any, Optional
from pathlib import Path

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

from app.services.user_app_manager import UserAppManager, get_user_app_manager
from app.services.code_validator import validate_app_code
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.error_report import ErrorReport

logger = logging.getLogger(__name__)


class AppGeneratorService:
    """
    Generates Krilin apps using Claude Code SDK.

    Uses continuous conversation with Claude to generate:
    - manifest.json (app metadata)
    - frontend.tsx (React component)
    - backend.py (Python actions)
    - preview.html (preview wrapper)
    - CLAUDE.md (context for future edits)
    """

    def __init__(
        self,
        user_app_manager: Optional[UserAppManager] = None
    ):
        """
        Initialize AppGeneratorService.

        Args:
            user_app_manager: UserAppManager instance (or use global)
        """
        self.user_app_manager = user_app_manager or get_user_app_manager()

    async def generate_app(
        self,
        user_id: int,
        app_id: str,
        prompt: str,
        app_name: Optional[str] = None,
        category: str = "productivity",
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Generate a complete app from a user prompt.

        Args:
            user_id: User ID who is creating the app
            app_id: App identifier (e.g., "my-habit-tracker")
            prompt: User's description of the app
            app_name: Display name (defaults to formatted app_id)
            category: App category

        Returns:
            Dictionary containing:
                - app_directory: Path to created app
                - manifest: App manifest
                - files: Dict of generated files

        Raises:
            Exception: If generation fails
        """
        logger.info(f"[APP GENERATOR] Generating app '{app_id}' for user {user_id}")
        logger.info(f"[APP GENERATOR] Prompt: {prompt}")

        # Create app directory
        app_dir = self.user_app_manager.get_app_dir(user_id, app_id)
        app_dir.mkdir(parents=True, exist_ok=True)

        # Generate display name if not provided
        if not app_name:
            app_name = app_id.replace('-', ' ').replace('_', ' ').title()

        # Create Claude SDK client with app directory as working directory
        options = ClaudeAgentOptions(
            cwd=str(app_dir),
            setting_sources=["project"],  # Will load CLAUDE.md if exists
            allowed_tools=["Write", "Read", "Edit"],
            permission_mode="acceptEdits"
        )

        client = ClaudeSDKClient(options=options)

        try:
            # Generate app files using Claude
            logger.info("[APP GENERATOR] Starting Claude conversation...")

            # Step 1: Generate app structure
            generation_prompt = self._build_generation_prompt(
                app_id=app_id,
                app_name=app_name,
                category=category,
                user_prompt=prompt
            )

            # Connect and send prompt
            async with client:
                await client.query(generation_prompt)

                # Wait for response and file generation
                async for message in client.receive_response():
                    logger.info(f"[APP GENERATOR] Received message: {type(message).__name__}")

            logger.info(f"[APP GENERATOR] Claude conversation completed")

            # The Claude Code SDK should have written the files directly
            # Let's verify they exist and read them

            # Read generated files
            manifest = self._read_or_create_manifest(
                app_dir, app_id, app_name, category, prompt
            )
            frontend_code = self._read_or_create_frontend(app_dir, app_name)
            backend_code = self._read_or_create_backend(app_dir)
            preview_html = self._read_or_create_preview(app_dir, app_id, app_name)

            # ===== VALIDATION PHASE =====
            logger.info("[APP GENERATOR] Validating generated code...")
            is_valid, validation_errors, validation_summary = validate_app_code(
                backend_code=backend_code,
                frontend_code=frontend_code,
                metadata=manifest
            )

            logger.info(f"[APP GENERATOR] Validation result: {validation_summary}")

            # Store validation errors in database if db session provided
            if db and validation_errors:
                await self._save_validation_errors(
                    db=db,
                    user_id=user_id,
                    app_id=app_id,
                    errors=validation_errors
                )

            # If validation failed with critical errors, raise exception
            if not is_valid:
                error_count = len([e for e in validation_errors if e.severity == "error"])
                logger.error(
                    f"[APP GENERATOR] Validation failed with {error_count} error(s)"
                )
                raise Exception(
                    f"Generated app has validation errors:\n{validation_summary}"
                )

            # Ensure all files are written
            self.user_app_manager.write_manifest(user_id, app_id, manifest)
            self.user_app_manager.write_frontend(user_id, app_id, frontend_code)
            self.user_app_manager.write_backend(user_id, app_id, backend_code)
            self.user_app_manager.write_preview_html(user_id, app_id, preview_html)
            self.user_app_manager.write_claude_context(user_id, app_id, manifest)

            logger.info(f"[APP GENERATOR] App '{app_id}' generated successfully")

            return {
                "app_directory": str(app_dir),
                "manifest": manifest,
                "files": {
                    "frontend": frontend_code,
                    "backend": backend_code,
                    "preview_html": preview_html
                }
            }

        except Exception as e:
            logger.error(f"[APP GENERATOR] Failed to generate app: {e}")
            # Clean up if generation failed
            if app_dir.exists():
                import shutil
                shutil.rmtree(app_dir)
            raise

    async def _save_validation_errors(
        self,
        db: AsyncSession,
        user_id: int,
        app_id: str,
        errors: list
    ):
        """Save validation errors to the database."""
        from datetime import datetime
        import hashlib

        for error in errors:
            # Create error hash for grouping similar errors
            error_content = f"{error.category}:{error.message}:{error.file}"
            error_hash = hashlib.sha256(error_content.encode()).hexdigest()

            # Create error report
            error_report = ErrorReport(
                user_id=user_id,
                app_id=app_id,
                error_type="validation",
                severity=error.severity,
                category=error.category,
                message=error.message,
                file=error.file,
                line=error.line,
                suggestion=error.suggestion,
                context={
                    "validation_error": error.to_dict()
                },
                error_hash=error_hash,
                status="new",
                created_at=datetime.utcnow()
            )

            db.add(error_report)

        await db.commit()
        logger.info(f"[APP GENERATOR] Saved {len(errors)} validation errors to database")

    def _build_generation_prompt(
        self,
        app_id: str,
        app_name: str,
        category: str,
        user_prompt: str
    ) -> str:
        """Build the prompt for Claude to generate the app."""

        # Load comprehensive platform guide
        guide_path = Path(__file__).parent.parent.parent.parent / "CLAUDE_AGENT_SYSTEM_PROMPT.md"
        try:
            with open(guide_path, 'r') as f:
                platform_guide = f.read()
        except FileNotFoundError:
            logger.warning(f"Platform guide not found at {guide_path}, using minimal context")
            platform_guide = "Use RetroUI components and Krilin platform APIs."

        return f"""You are an expert Krilin app developer. Generate a complete, production-ready Krilin platform app.

**USER REQUEST:** {user_prompt}

**APP DETAILS:**
- ID: {app_id}
- Name: {app_name}
- Category: {category}

**COMPLETE PLATFORM REFERENCE:**

{platform_guide}

**YOUR TASK:**

Create a complete, working app with these files:

1. **manifest.json** - Complete metadata, actions, database schema
2. **frontend.tsx** - React component using RetroUI components
3. **backend.py** - Python actions using PlatformContext
4. **preview.html** - Preview wrapper (use standard template)

**CRITICAL REQUIREMENTS:**

1. **MUST use RetroUI components** - NEVER use plain HTML
   - Import and use: Card, Button, Input, Badge, Checkbox
   - Example: `<Card><Card.Header className="bg-[var(--primary)]"><Card.Title>Title</Card.Title></Card.Header></Card>`

2. **MUST use CSS variables** for all colors
   - bg-[var(--primary)], text-[var(--foreground)], border-[var(--border)]
   - NEVER use Tailwind color names like bg-blue-500

3. **MUST use retro styling**
   - Thick borders: border-2 or border-4
   - Retro shadows: shadow-[4px_4px_0_0_var(--border)]
   - Uppercase text for labels: className="uppercase"

4. **MUST follow platform APIs**
   - Frontend: window.krilin.actions.call(), window.krilin.storage.*
   - Backend: async def with ctx: PlatformContext parameter

**QUALITY STANDARDS:**

- Beautiful, retro-themed UI matching platform aesthetic
- Clean, well-commented code
- Proper error handling
- Loading states with Loader2 spinner
- Responsive design
- Complete CRUD operations if needed

**EXAMPLE FILES:**

**Required Files:**

1. **manifest.json** - Complete app configuration (includes outputs for other apps):
```json
{{
  "id": "{app_id}",
  "name": "{app_name}",
  "version": "1.0.0",
  "description": "App description based on user request",
  "author": "User Generated",
  "icon": "app",
  "category": "{category}",
  "database": {{
    "tables": [
      {{
        "name": "table_name",
        "description": "Table description",
        "schema": {{
          "field_name": "string|number|boolean|object"
        }}
      }}
    ]
  }},
  "actions": [
    {{
      "id": "action_name",
      "description": "Action description",
      "parameters": {{}}
    }}
  ],
  "outputs": [
    {{
      "id": "output_name",
      "description": "Data this app exports (if other apps will use it)",
      "access_level": "public"
    }}
  ],
  "dependencies": {{
    "required_apps": [],
    "optional_apps": []
  }},
  "ui": {{
    "widgets": ["main"],
    "pages": [],
    "settings": []
  }},
  "agent_config": {{
    "system_prompt": "You are a helpful assistant for this app.",
    "tools": []
  }}
}}
```

**Note**: If app provides data to other apps, implement get_output_* functions in backend.py

2. **frontend.tsx** - React component using Krilin SDK:
```tsx
import React, {{ useState, useEffect }} from 'react';

export default function {app_name.replace(' ', '')}App() {{
  const [data, setData] = useState([]);

  useEffect(() => {{
    loadData();
  }}, []);

  const loadData = async () => {{
    try {{
      const result = await window.krilin.storage.query('table_name');
      setData(result);
    }} catch (error) {{
      console.error('Failed to load data:', error);
    }}
  }};

  const handleAction = async () => {{
    try {{
      await window.krilin.actions.call('action_name', {{ param: 'value' }});
      loadData(); // Refresh data
    }} catch (error) {{
      console.error('Action failed:', error);
    }}
  }};

  return (
    <div className="p-6 space-y-4">
      {{/* Your UI components */}}
    </div>
  );
}}
```

3. **backend.py** - Python actions:
```python
from typing import Dict, Any
from app.core.platform_context import PlatformContext

async def action_name(ctx: PlatformContext, **params) -> Dict[str, Any]:
    \"\"\"Action description.\"\"\"
    # Access storage
    items = await ctx.storage.query('table_name', filters={{}})

    # Perform logic
    result = {{"status": "success"}}

    return result
```

4. **preview.html** - Preview wrapper with Krilin SDK:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{app_name} Preview</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>

    <script>
        // Krilin SDK (injected by platform)
        window.krilin = {{
            actions: {{
                call: async (name, params) => {{
                    const response = await fetch(`/api/v1/apps/{app_id}/actions/${{name}}`, {{
                        method: 'POST',
                        headers: {{'Content-Type': 'application/json'}},
                        body: JSON.stringify(params)
                    }});
                    return response.json();
                }}
            }},
            storage: {{
                query: async (table, filters) => {{
                    const response = await fetch(`/api/v1/apps/{app_id}/storage/${{table}}/query`, {{
                        method: 'POST',
                        headers: {{'Content-Type': 'application/json'}},
                        body: JSON.stringify(filters || {{}})
                    }});
                    return response.json();
                }},
                insert: async (table, data) => {{
                    const response = await fetch(`/api/v1/apps/{app_id}/storage/${{table}}`, {{
                        method: 'POST',
                        headers: {{'Content-Type': 'application/json'}},
                        body: JSON.stringify(data)
                    }});
                    return response.json();
                }}
            }}
        }};
    </script>

    <script src="./app.bundle.js"></script>
</body>
</html>
```

**Important Guidelines:**
- Make the app functional and complete based on the user's request
- Use Tailwind CSS for styling
- Include proper error handling
- Follow React best practices
- Make backend actions async
- Use the platform's storage API for data persistence

Please create all four files with complete, working code that fulfills the user's request."""

    def _read_or_create_manifest(
        self,
        app_dir: Path,
        app_id: str,
        app_name: str,
        category: str,
        description: str
    ) -> Dict[str, Any]:
        """Read manifest.json or create a default one."""
        manifest_path = app_dir / "manifest.json"

        if manifest_path.exists():
            try:
                with open(manifest_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to read generated manifest: {e}")

        # Create default manifest
        return {
            "id": app_id,
            "name": app_name,
            "version": "1.0.0",
            "description": description,
            "author": "User Generated",
            "icon": "app",
            "category": category,
            "database": {
                "tables": []
            },
            "actions": [],
            "ui": {
                "widgets": ["main"],
                "pages": [],
                "settings": []
            },
            "agent_config": {
                "system_prompt": f"You are a helpful assistant for {app_name}.",
                "tools": []
            }
        }

    def _read_or_create_frontend(self, app_dir: Path, app_name: str) -> str:
        """Read frontend.tsx or create a default one."""
        frontend_path = app_dir / "frontend.tsx"

        if frontend_path.exists():
            try:
                with open(frontend_path, 'r') as f:
                    return f.read()
            except Exception as e:
                logger.warning(f"Failed to read generated frontend: {e}")

        # Create default frontend
        component_name = app_name.replace(' ', '').replace('-', '')
        return f"""import React from 'react';

export default function {component_name}App() {{
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{app_name}</h1>
      <p className="text-gray-600 mt-2">Your app is ready to be customized!</p>
    </div>
  );
}}
"""

    def _read_or_create_backend(self, app_dir: Path) -> str:
        """Read backend.py or create a default one."""
        backend_path = app_dir / "backend.py"

        if backend_path.exists():
            try:
                with open(backend_path, 'r') as f:
                    return f.read()
            except Exception as e:
                logger.warning(f"Failed to read generated backend: {e}")

        # Create default backend
        return """from typing import Dict, Any
from app.core.platform_context import PlatformContext

async def hello_world(ctx: PlatformContext) -> Dict[str, Any]:
    \"\"\"Example action.\"\"\"
    return {"message": "Hello from your app!"}
"""

    def _read_or_create_preview(
        self,
        app_dir: Path,
        app_id: str,
        app_name: str
    ) -> str:
        """Read preview.html or create a default one."""
        preview_path = app_dir / "preview.html"

        if preview_path.exists():
            try:
                with open(preview_path, 'r') as f:
                    return f.read()
            except Exception as e:
                logger.warning(f"Failed to read generated preview: {e}")

        # Create default preview HTML with inline TSX compilation
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{app_name} Preview</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>

    <script>
        // Krilin SDK
        window.krilin = {{
            actions: {{
                call: async (name, params) => {{
                    const response = await fetch(`/api/v1/apps/{app_id}/actions/${{name}}`, {{
                        method: 'POST',
                        headers: {{'Content-Type': 'application/json'}},
                        credentials: 'include',
                        body: JSON.stringify(params)
                    }});
                    return response.json();
                }}
            }},
            storage: {{
                query: async (table, filters) => {{
                    const response = await fetch(`/api/v1/apps/{app_id}/storage/${{table}}/query`, {{
                        method: 'POST',
                        headers: {{'Content-Type': 'application/json'}},
                        credentials: 'include',
                        body: JSON.stringify(filters || {{}})
                    }});
                    return response.json();
                }},
                insert: async (table, data) => {{
                    const response = await fetch(`/api/v1/apps/{app_id}/storage/${{table}}`, {{
                        method: 'POST',
                        headers: {{'Content-Type': 'application/json'}},
                        credentials: 'include',
                        body: JSON.stringify(data)
                    }});
                    return response.json();
                }}
            }}
        }};
    </script>

    <!-- Load and compile TSX component inline -->
    <script type="text/babel">
        const {{ useState, useEffect, useRef, useMemo, useCallback }} = React;

        // Get auth token (injected by backend)
        const authToken = typeof __KRILIN_AUTH_TOKEN__ !== 'undefined' ? __KRILIN_AUTH_TOKEN__ : '';

        // Fetch and render component
        fetch(`/api/v1/apps/{app_id}/files/frontend.tsx?token=${{authToken}}`)
            .then(res => res.text())
            .then(code => {{
                // Remove import and export statements
                code = code.replace(/import\\s+.*?from\\s+['"].*?['"]\\s*;?\\n?/g, '');
                code = code.replace(/export\\s+default\\s+/g, '');

                // Execute the code to define the component in this scope
                eval(Babel.transform(code, {{ presets: ['react'] }}).code);

                // Get the component (look for common function names)
                const App = typeof app1App !== 'undefined' ? app1App :
                           typeof App !== 'undefined' ? App :
                           typeof AppComponent !== 'undefined' ? AppComponent : null;

                if (App) {{
                    const root = ReactDOM.createRoot(document.getElementById('root'));
                    root.render(<App />);
                }} else {{
                    console.error('Component not found after eval');
                    document.getElementById('root').innerHTML = '<div style="padding: 20px; color: red;">Error: Component not found</div>';
                }}
            }})
            .catch(err => {{
                console.error('Failed to load component:', err);
                document.getElementById('root').innerHTML = '<div style="padding: 20px; color: red;">Error: ' + err.message + '</div>';
            }});
    </script>
</body>
</html>
"""


# Global instance
_app_generator: Optional[AppGeneratorService] = None


def get_app_generator() -> AppGeneratorService:
    """Get the global AppGeneratorService instance."""
    global _app_generator
    if _app_generator is None:
        _app_generator = AppGeneratorService()
    return _app_generator
