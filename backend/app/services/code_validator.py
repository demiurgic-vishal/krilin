"""
Code Validator - Phase 1: Pre-Deployment Validation Layer

Validates generated app code before deployment to catch errors early.
Checks syntax, API usage, common patterns, and potential runtime issues.
"""
import ast
import re
import logging
from typing import Dict, List, Optional, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)


class ValidationError:
    """Represents a validation error or warning."""

    def __init__(
        self,
        severity: str,  # "error", "warning", "info"
        category: str,  # "syntax", "api_usage", "pattern", "runtime"
        message: str,
        file: str,
        line: Optional[int] = None,
        suggestion: Optional[str] = None
    ):
        self.severity = severity
        self.category = category
        self.message = message
        self.file = file
        self.line = line
        self.suggestion = suggestion

    def __repr__(self):
        location = f"{self.file}:{self.line}" if self.line else self.file
        return f"[{self.severity.upper()}] {location} - {self.message}"

    def to_dict(self):
        return {
            "severity": self.severity,
            "category": self.category,
            "message": self.message,
            "file": self.file,
            "line": self.line,
            "suggestion": self.suggestion
        }


class CodeValidator:
    """
    Validates generated app code for common errors and issues.

    Validation checks:
    - Python syntax errors
    - TypeScript/React syntax errors
    - ctx API usage mistakes
    - Missing required methods
    - Common runtime patterns
    - Integration usage errors
    """

    def __init__(self):
        self.errors: List[ValidationError] = []
        self.warnings: List[ValidationError] = []

    def validate_app(
        self,
        backend_code: str,
        frontend_code: str,
        metadata: Dict
    ) -> Tuple[bool, List[ValidationError]]:
        """
        Validate complete app code.

        Args:
            backend_code: Python backend code
            frontend_code: TypeScript/React frontend code
            metadata: App metadata

        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        self.errors = []
        self.warnings = []

        # Validate backend
        self._validate_python_syntax(backend_code, "backend.py")
        self._validate_backend_structure(backend_code)
        self._validate_ctx_api_usage(backend_code)
        self._validate_integration_usage(backend_code)

        # Validate frontend
        self._validate_typescript_syntax(frontend_code, "frontend.tsx")
        self._validate_frontend_structure(frontend_code)
        self._validate_krilin_api_usage(frontend_code)

        # Validate metadata
        self._validate_metadata(metadata)

        # Combine errors and warnings
        all_issues = self.errors + self.warnings
        is_valid = len(self.errors) == 0

        logger.info(
            f"Validation complete: {len(self.errors)} errors, "
            f"{len(self.warnings)} warnings"
        )

        return is_valid, all_issues

    def _validate_python_syntax(self, code: str, filename: str):
        """Check Python syntax errors."""
        try:
            ast.parse(code)
        except SyntaxError as e:
            self.errors.append(ValidationError(
                severity="error",
                category="syntax",
                message=f"Python syntax error: {e.msg}",
                file=filename,
                line=e.lineno,
                suggestion="Fix the syntax error before deploying"
            ))

    def _validate_backend_structure(self, code: str):
        """Validate backend.py structure."""
        # Check for register_actions function
        if "def register_actions" not in code:
            self.errors.append(ValidationError(
                severity="error",
                category="pattern",
                message="Missing register_actions() function",
                file="backend.py",
                suggestion="Add: def register_actions(ctx):"
            ))

        # Check for ctx parameter
        if "def register_actions(ctx)" not in code:
            self.warnings.append(ValidationError(
                severity="warning",
                category="pattern",
                message="register_actions() should accept 'ctx' parameter",
                file="backend.py",
                suggestion="Change to: def register_actions(ctx):"
            ))

        # Check if actions are registered
        if "@ctx.action" not in code and "ctx.action(" not in code:
            self.warnings.append(ValidationError(
                severity="warning",
                category="pattern",
                message="No actions registered in backend",
                file="backend.py",
                suggestion="Register at least one action with @ctx.action"
            ))

    def _validate_ctx_api_usage(self, code: str):
        """Validate ctx API method calls."""
        lines = code.split("\n")

        # Common API mistakes
        mistakes = [
            # Storage API
            (r"ctx\.storage\.get\([^,]+,\s*\{",
             "ctx.storage.get() takes key only, not metadata dict",
             "Use: await ctx.storage.get(key)"),

            # Files API - missing filename
            (r"ctx\.files\.upload\([^,)]+\)",
             "ctx.files.upload() requires filename parameter",
             "Use: await ctx.files.upload(file_data, filename)"),

            # Integrations API - wrong table parameter
            (r"ctx\.integrations\.query\([^,]+,\s*['\"]data_type['\"]",
             "Use 'table' parameter, not 'data_type'",
             "Use: await ctx.integrations.query(integration_id, table='events')"),

            # Missing await
            (r"(?<!await\s)ctx\.(storage|db|integrations|files|notifications|ai)\.",
             "ctx API methods are async and require 'await'",
             "Add: await ctx.storage.get(...)"),
        ]

        for i, line in enumerate(lines, 1):
            for pattern, message, suggestion in mistakes:
                if re.search(pattern, line):
                    self.errors.append(ValidationError(
                        severity="error",
                        category="api_usage",
                        message=message,
                        file="backend.py",
                        line=i,
                        suggestion=suggestion
                    ))

    def _validate_integration_usage(self, code: str):
        """Validate integration API usage patterns."""
        lines = code.split("\n")

        for i, line in enumerate(lines, 1):
            # Check for is_connected before using integration
            if "ctx.integrations.query(" in line or "ctx.integrations.action(" in line:
                # Look back for is_connected check
                preceding_lines = "\n".join(lines[max(0, i-10):i])
                if "is_connected" not in preceding_lines:
                    self.warnings.append(ValidationError(
                        severity="warning",
                        category="runtime",
                        message="Using integration without checking is_connected()",
                        file="backend.py",
                        line=i,
                        suggestion="Add: if await ctx.integrations.is_connected(integration_id):"
                    ))

            # Check for proper error handling
            if "ctx.integrations" in line:
                # Check if inside try-except block
                indent = len(line) - len(line.lstrip())
                # Look for try block
                found_try = False
                for j in range(i-1, max(0, i-20), -1):
                    prev_line = lines[j]
                    prev_indent = len(prev_line) - len(prev_line.lstrip())
                    if prev_indent < indent and "try:" in prev_line:
                        found_try = True
                        break

                if not found_try:
                    self.warnings.append(ValidationError(
                        severity="warning",
                        category="runtime",
                        message="Integration call not wrapped in try-except",
                        file="backend.py",
                        line=i,
                        suggestion="Wrap in try-except to handle integration errors"
                    ))

    def _validate_typescript_syntax(self, code: str, filename: str):
        """Basic TypeScript syntax checks."""
        # Check for common syntax errors
        errors = [
            (r"import\s+{[^}]*}\s+from\s+['\"][^'\"]+['\"];?(?!\n|$)",
             "Import statement should end with semicolon or newline"),

            (r"}\s*else\s*{", None),  # Valid
            (r"}\s*else[^{]", "else should be followed by {"),

            # Check for missing return types in async functions
            (r"async\s+\w+\([^)]*\)\s*{",
             "Consider adding return type to async function"),
        ]

        lines = code.split("\n")
        for i, line in enumerate(lines, 1):
            # Check for console.log in production
            if "console.log" in line and "// debug" not in line.lower():
                self.warnings.append(ValidationError(
                    severity="warning",
                    category="pattern",
                    message="console.log() found in code",
                    file=filename,
                    line=i,
                    suggestion="Remove console.log() or use proper logging"
                ))

    def _validate_frontend_structure(self, code: str):
        """Validate frontend.tsx structure."""
        # Check for default export
        if "export default" not in code:
            self.errors.append(ValidationError(
                severity="error",
                category="pattern",
                message="Missing default export in frontend.tsx",
                file="frontend.tsx",
                suggestion="Add: export default function App() { ... }"
            ))

        # Check for React imports
        if "import" in code and "react" not in code.lower():
            self.warnings.append(ValidationError(
                severity="warning",
                category="pattern",
                message="React import might be missing",
                file="frontend.tsx",
                suggestion="Add: import { useState, useEffect } from 'react'"
            ))

    def _validate_krilin_api_usage(self, code: str):
        """Validate window.krilin API usage."""
        lines = code.split("\n")

        for i, line in enumerate(lines, 1):
            # Check for proper API response handling
            if "window.krilin.actions.call" in line:
                # Check if result is handled properly
                indent = len(line) - len(line.lstrip())
                next_lines = "\n".join(lines[i:min(i+5, len(lines))])

                # Check for response envelope unwrapping
                if ".result" not in next_lines and "response.result" not in next_lines:
                    self.warnings.append(ValidationError(
                        severity="warning",
                        category="api_usage",
                        message="API response may need unwrapping",
                        file="frontend.tsx",
                        line=i,
                        suggestion="Use: const result = response.result || response"
                    ))

                # Check for error handling
                if ".catch" not in next_lines and "try" not in "\n".join(lines[max(0, i-3):i]):
                    self.warnings.append(ValidationError(
                        severity="warning",
                        category="runtime",
                        message="API call lacks error handling",
                        file="frontend.tsx",
                        line=i,
                        suggestion="Add .catch() or wrap in try-catch"
                    ))

    def _validate_metadata(self, metadata: Dict):
        """Validate app metadata."""
        required_fields = ["name", "description"]

        for field in required_fields:
            if field not in metadata or not metadata[field]:
                self.errors.append(ValidationError(
                    severity="error",
                    category="pattern",
                    message=f"Missing required metadata field: {field}",
                    file="metadata",
                    suggestion=f"Add {field} to app metadata"
                ))

        # Validate name format
        if "name" in metadata:
            name = metadata["name"]
            if not re.match(r"^[a-zA-Z0-9\s\-_]+$", name):
                self.warnings.append(ValidationError(
                    severity="warning",
                    category="pattern",
                    message="App name contains special characters",
                    file="metadata",
                    suggestion="Use only letters, numbers, spaces, hyphens, and underscores"
                ))

    def get_error_summary(self) -> str:
        """Get human-readable error summary."""
        if not self.errors and not self.warnings:
            return "✅ Validation passed with no issues"

        summary = []

        if self.errors:
            summary.append(f"❌ {len(self.errors)} error(s):")
            for error in self.errors:
                summary.append(f"  - {error}")

        if self.warnings:
            summary.append(f"⚠️  {len(self.warnings)} warning(s):")
            for warning in self.warnings:
                summary.append(f"  - {warning}")

        return "\n".join(summary)


# Convenience function
def validate_app_code(
    backend_code: str,
    frontend_code: str,
    metadata: Dict
) -> Tuple[bool, List[ValidationError], str]:
    """
    Validate app code and return results.

    Returns:
        Tuple of (is_valid, errors, summary_text)
    """
    validator = CodeValidator()
    is_valid, errors = validator.validate_app(backend_code, frontend_code, metadata)
    summary = validator.get_error_summary()

    return is_valid, errors, summary
