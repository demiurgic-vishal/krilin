"""
App Refinement Service - Refines apps using Claude Code SDK.

This service:
- Takes user's natural language refinement requests
- Uses Claude Code SDK to understand and modify app files
- Maintains app functionality and platform compatibility
- Provides conversational app editing experience
"""
import logging
from typing import Dict, Any, Optional
from pathlib import Path

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

from app.services.user_app_manager import UserAppManager, get_user_app_manager
from app.services.code_validator import validate_app_code
from app.services.error_analyzer import get_error_analyzer
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.error_report import ErrorReport
from sqlalchemy import select

logger = logging.getLogger(__name__)


class AppRefinementService:
    """
    Refines Krilin apps using Claude Code SDK.

    Provides conversational interface for users to request changes to their apps.
    Claude understands the app structure, platform APIs, and user intent.
    """

    def __init__(
        self,
        user_app_manager: Optional[UserAppManager] = None
    ):
        """
        Initialize AppRefinementService.

        Args:
            user_app_manager: UserAppManager instance (or use global)
        """
        self.user_app_manager = user_app_manager or get_user_app_manager()

    async def refine_app_stream(
        self,
        user_id: int,
        app_id: str,
        user_message: str,
        conversation_history: Optional[list] = None,
        db: Optional[AsyncSession] = None
    ):
        """
        Refine an app based on user's natural language request (streaming).

        Yields events as Claude works on the app.

        Args:
            user_id: User ID who owns the app
            app_id: App identifier
            user_message: User's refinement request
            conversation_history: Previous messages in this session
            db: Database session for error tracking

        Yields:
            Dict events with type and content
        """
        logger.info(f"[APP REFINEMENT] Refining app '{app_id}' for user {user_id}")
        logger.info(f"[APP REFINEMENT] Request: {user_message}")

        # Get app directory
        app_dir = self.user_app_manager.get_app_dir(user_id, app_id)

        if not app_dir.exists():
            raise FileNotFoundError(f"App directory not found: {app_dir}")

        # Read current app state
        try:
            manifest = self.user_app_manager.read_manifest(user_id, app_id)
            frontend_code = self.user_app_manager.read_frontend(user_id, app_id)
            backend_code = self.user_app_manager.read_backend(user_id, app_id)
        except FileNotFoundError as e:
            logger.error(f"[APP REFINEMENT] Failed to read app files: {e}")
            raise

        # Build refinement prompt with full context
        refinement_prompt = await self._build_refinement_prompt(
            app_id=app_id,
            app_name=manifest.get("name", app_id),
            user_message=user_message,
            manifest=manifest,
            frontend_code=frontend_code,
            backend_code=backend_code,
            conversation_history=conversation_history,
            db=db
        )

        # Create Claude SDK client
        options = ClaudeAgentOptions(
            cwd=str(app_dir),
            setting_sources=["project"],
            allowed_tools=["Read", "Write", "Edit", "Glob", "Grep"],
            permission_mode="acceptEdits"
        )

        client = ClaudeSDKClient(options=options)

        try:
            logger.info("[APP REFINEMENT] Starting Claude conversation...")
            yield {"type": "status", "content": "Starting refinement..."}

            response_text = ""

            async with client:
                await client.query(refinement_prompt)

                # Stream messages from Claude
                async for message in client.receive_response():
                    logger.info(f"[APP REFINEMENT] Received: {type(message).__name__}")

                    # Check if it's an AssistantMessage with text content
                    if hasattr(message, 'content'):
                        for block in message.content:
                            # Only process text blocks, ignore tool use blocks
                            if hasattr(block, 'type') and block.type == 'text':
                                if hasattr(block, 'text') and block.text:
                                    response_text += block.text
                                    logger.info(f"[APP REFINEMENT] Text: {block.text[:100]}")
                                    # Stream text to user
                                    yield {"type": "token", "content": block.text}
                            elif hasattr(block, 'text') and block.text and not hasattr(block, 'type'):
                                # Fallback for blocks without type attribute
                                response_text += block.text
                                logger.info(f"[APP REFINEMENT] Text (no type): {block.text[:100]}")
                                yield {"type": "token", "content": block.text}

            logger.info(f"[APP REFINEMENT] Claude conversation completed")
            yield {"type": "status", "content": "Checking for changes..."}

            # Read potentially modified files
            new_manifest = self.user_app_manager.read_manifest(user_id, app_id)
            new_frontend = self.user_app_manager.read_frontend(user_id, app_id)
            new_backend = self.user_app_manager.read_backend(user_id, app_id)

            # Detect what changed
            modified_files = []
            if new_frontend != frontend_code:
                modified_files.append("frontend.tsx")
            if new_backend != backend_code:
                modified_files.append("backend.py")
            if new_manifest != manifest:
                modified_files.append("manifest.json")

            logger.info(f"[APP REFINEMENT] Modified files: {modified_files}")

            # Send completion event
            yield {
                "type": "done",
                "message": response_text or "Changes applied successfully!",
                "modified_files": modified_files,
                "changes_summary": f"Modified {len(modified_files)} file(s): {', '.join(modified_files)}" if modified_files else "No files were modified"
            }

        except Exception as e:
            logger.error(f"[APP REFINEMENT] Failed to refine app: {e}")
            yield {"type": "error", "message": str(e)}
            raise

    async def refine_app(
        self,
        user_id: int,
        app_id: str,
        user_message: str,
        conversation_history: Optional[list] = None,
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Refine an app based on user's natural language request.

        Args:
            user_id: User ID who owns the app
            app_id: App identifier
            user_message: User's refinement request (e.g., "Make buttons bigger")
            conversation_history: Previous messages in this session

        Returns:
            Dictionary containing:
                - success: bool
                - message: str (response from Claude)
                - modified_files: list of files that were changed
                - changes_summary: str

        Raises:
            Exception: If refinement fails
        """
        logger.info(f"[APP REFINEMENT] Refining app '{app_id}' for user {user_id}")
        logger.info(f"[APP REFINEMENT] Request: {user_message}")

        # Get app directory
        app_dir = self.user_app_manager.get_app_dir(user_id, app_id)

        if not app_dir.exists():
            raise FileNotFoundError(f"App directory not found: {app_dir}")

        # Read current app state
        try:
            manifest = self.user_app_manager.read_manifest(user_id, app_id)
            frontend_code = self.user_app_manager.read_frontend(user_id, app_id)
            backend_code = self.user_app_manager.read_backend(user_id, app_id)
        except FileNotFoundError as e:
            logger.error(f"[APP REFINEMENT] Failed to read app files: {e}")
            raise

        # Build refinement prompt with full context
        refinement_prompt = await self._build_refinement_prompt(
            app_id=app_id,
            app_name=manifest.get("name", app_id),
            user_message=user_message,
            manifest=manifest,
            frontend_code=frontend_code,
            backend_code=backend_code,
            conversation_history=conversation_history,
            db=db
        )

        # Create Claude SDK client
        options = ClaudeAgentOptions(
            cwd=str(app_dir),
            setting_sources=["project"],  # Loads CLAUDE.md
            allowed_tools=["Read", "Write", "Edit", "Glob", "Grep"],
            permission_mode="acceptEdits"  # Auto-accept file edits
        )

        client = ClaudeSDKClient(options=options)

        try:
            # Send refinement request to Claude
            logger.info("[APP REFINEMENT] Starting Claude conversation...")

            response_text = ""
            modified_files = []

            async with client:
                await client.query(refinement_prompt)

                # Collect response and track modifications
                async for message in client.receive_response():
                    logger.info(f"[APP REFINEMENT] Received message type: {type(message).__name__}")

                    # Check if it's an AssistantMessage with text content
                    if hasattr(message, 'content'):
                        for block in message.content:
                            logger.info(f"[APP REFINEMENT] Content block type: {type(block).__name__}")
                            # Only process text blocks, ignore tool use blocks
                            if hasattr(block, 'type') and block.type == 'text':
                                if hasattr(block, 'text'):
                                    response_text += block.text
                                    logger.info(f"[APP REFINEMENT] Response text: {block.text[:200]}")
                            elif hasattr(block, 'text') and not hasattr(block, 'type'):
                                # Fallback for blocks without type attribute
                                response_text += block.text
                                logger.info(f"[APP REFINEMENT] Response text (no type): {block.text[:200]}")
                    elif hasattr(message, 'text') and message.text:
                        response_text += message.text
                        logger.info(f"[APP REFINEMENT] Direct text: {message.text[:200]}")

            logger.info(f"[APP REFINEMENT] Claude conversation completed")
            logger.info(f"[APP REFINEMENT] Total response text length: {len(response_text)}")

            # Read potentially modified files
            new_manifest = self.user_app_manager.read_manifest(user_id, app_id)
            new_frontend = self.user_app_manager.read_frontend(user_id, app_id)
            new_backend = self.user_app_manager.read_backend(user_id, app_id)

            # Detect what changed
            if new_frontend != frontend_code:
                modified_files.append("frontend.tsx")
            if new_backend != backend_code:
                modified_files.append("backend.py")
            if new_manifest != manifest:
                modified_files.append("manifest.json")

            logger.info(f"[APP REFINEMENT] Modified files: {modified_files}")

            # ===== VALIDATION PHASE =====
            if modified_files:
                logger.info("[APP REFINEMENT] Validating modified code...")
                is_valid, validation_errors, validation_summary = validate_app_code(
                    backend_code=new_backend,
                    frontend_code=new_frontend,
                    metadata=new_manifest
                )

                logger.info(f"[APP REFINEMENT] Validation result: {validation_summary}")

                # Store validation errors in database if db session provided
                if db and validation_errors:
                    await self._save_validation_errors(
                        db=db,
                        user_id=user_id,
                        app_id=app_id,
                        errors=validation_errors
                    )

                # If validation failed with critical errors, warn in response
                if not is_valid:
                    error_count = len([e for e in validation_errors if e.severity == "error"])
                    logger.warning(
                        f"[APP REFINEMENT] Validation found {error_count} error(s)"
                    )
                    return {
                        "success": False,
                        "message": response_text,
                        "modified_files": modified_files,
                        "changes_summary": f"Modified {len(modified_files)} file(s): {', '.join(modified_files)}",
                        "validation_errors": [e.to_dict() for e in validation_errors],
                        "validation_summary": validation_summary
                    }

            return {
                "success": True,
                "message": response_text or "Changes applied successfully!",
                "modified_files": modified_files,
                "changes_summary": f"Modified {len(modified_files)} file(s): {', '.join(modified_files)}" if modified_files else "No files were modified"
            }

        except Exception as e:
            logger.error(f"[APP REFINEMENT] Failed to refine app: {e}")
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
                    "validation_error": error.to_dict(),
                    "source": "refinement"
                },
                error_hash=error_hash,
                status="new",
                created_at=datetime.utcnow()
            )

            db.add(error_report)

        await db.commit()
        logger.info(f"[APP REFINEMENT] Saved {len(errors)} validation errors to database")

    async def _build_refinement_prompt(
        self,
        app_id: str,
        app_name: str,
        user_message: str,
        manifest: Dict[str, Any],
        frontend_code: str,
        backend_code: str,
        conversation_history: Optional[list] = None,
        db: Optional[AsyncSession] = None
    ) -> str:
        """Build comprehensive prompt for app refinement with error context."""

        # Load comprehensive platform guide
        guide_path = Path(__file__).parent.parent.parent.parent / "CLAUDE_AGENT_SYSTEM_PROMPT.md"
        try:
            with open(guide_path, 'r') as f:
                platform_guide = f.read()
        except FileNotFoundError:
            logger.warning(f"Platform guide not found at {guide_path}, using minimal context")
            platform_guide = "Use RetroUI components and Krilin platform APIs."

        # Build conversation context if exists
        history_context = ""
        if conversation_history:
            history_context = "\n\n**Previous Conversation:**\n"
            for msg in conversation_history[-5:]:  # Last 5 messages
                role = msg.get("role", "user")
                content = msg.get("content", "")
                history_context += f"{role.upper()}: {content}\n"

        # ===== ERROR FEEDBACK INTEGRATION =====
        # Get recent errors for this app
        error_context = ""
        if db:
            try:
                error_analyzer = get_error_analyzer()

                # Get recent unresolved errors
                stmt = select(ErrorReport).where(
                    ErrorReport.app_id == app_id,
                    ErrorReport.status.in_(["new", "acknowledged"])
                ).order_by(ErrorReport.created_at.desc()).limit(5)

                result = await db.execute(stmt)
                recent_errors = result.scalars().all()

                if recent_errors:
                    error_context = "\n\n**⚠️ RECENT ERRORS IN THIS APP:**\n\n"
                    error_context += "Claude, this app has encountered the following errors. Please review and fix them:\n\n"

                    for i, error in enumerate(recent_errors, 1):
                        error_context += f"{i}. **{error.severity.upper()} - {error.category}**\n"
                        error_context += f"   File: {error.file or 'unknown'}:{error.line or '?'}\n"
                        error_context += f"   Message: {error.message}\n"

                        if error.suggestion:
                            error_context += f"   Suggestion: {error.suggestion}\n"

                        if error.stack_trace:
                            # Include first few lines of stack trace
                            stack_lines = error.stack_trace.split('\n')[:3]
                            error_context += f"   Stack trace:\n"
                            for line in stack_lines:
                                error_context += f"     {line}\n"

                        # Get error analysis
                        analysis = await error_analyzer.analyze_error(db, error)
                        if analysis["matched_patterns"]:
                            pattern = analysis["matched_patterns"][0]
                            error_context += f"   Known Pattern: {pattern['description']} (confidence: {pattern['confidence']})\n"

                        error_context += "\n"

                    error_context += "**IMPORTANT:** Address these errors in your changes. Use the suggestions and patterns provided.\n"

            except Exception as e:
                logger.warning(f"Failed to load error context: {e}")
                error_context = ""

        prompt = f"""You are an expert Krilin app developer helping refine the app: "{app_name}".

**USER REQUEST:** {user_message}

{history_context}

{error_context}

**COMPLETE PLATFORM REFERENCE:**

{platform_guide}

**CURRENT APP FILES:**

Current directory contains:
- manifest.json
- frontend.tsx
- backend.py
- preview.html
- CLAUDE.md

**YOUR TASK:**

1. Understand what the user wants to change
2. Identify which files need modification
3. Make precise edits using the Edit tool
4. Ensure changes follow platform conventions (RetroUI, CSS variables, retro styling)
5. Explain what you changed and why

**CRITICAL REMINDERS:**

- Always use RetroUI components (Card, Button, Input, Badge, Checkbox)
- Always use CSS variables for colors (bg-[var(--primary)], text-[var(--foreground)])
- Always use thick borders (border-2 minimum)
- Always use retro shadows (shadow-[4px_4px_0_0_var(--border)])
- Follow platform API patterns (window.krilin.*, ctx.*)

**COMMON REFINEMENT PATTERNS:**

- "Make buttons bigger" → Update Button size prop or add larger Tailwind classes
- "Add dark mode" → Add theme toggle state and conditional styling
- "Add delete button" → Add Button in frontend, create delete action in backend, update manifest
- "Change colors" → Update CSS variable usage, not hard-coded colors
- "Add confirmation" → Add state for dialog, render modal with Card component

Now analyze the request and make the necessary changes

**CURRENT FILE CONTENTS:**

manifest.json:
```json
{manifest}
```

frontend.tsx:
```typescript
{frontend_code}
```

backend.py:
```python
{backend_code}
```

Now, please analyze the user's request and make the necessary changes to fulfill it. Use the Edit tool to modify files precisely. Explain what you're doing as you work.
"""

        return prompt


# Global instance
_app_refinement: Optional[AppRefinementService] = None


def get_app_refinement() -> AppRefinementService:
    """Get the global AppRefinementService instance."""
    global _app_refinement
    if _app_refinement is None:
        _app_refinement = AppRefinementService()
    return _app_refinement
