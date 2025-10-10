"""
Error Analyzer - Pattern Matching and Auto-Fix

Analyzes errors, matches them to known patterns, and attempts automatic fixes.
Learns from past errors to improve Claude's code generation.
"""
import re
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
import hashlib

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.error_report import ErrorReport, ErrorPattern
from app.services.user_app_manager import UserAppManager, get_user_app_manager

logger = logging.getLogger(__name__)


class ErrorAnalyzer:
    """
    Analyzes errors and attempts automatic fixes based on known patterns.
    """

    def __init__(
        self,
        user_app_manager: Optional[UserAppManager] = None
    ):
        self.user_app_manager = user_app_manager or get_user_app_manager()
        self._load_builtin_patterns()

    def _load_builtin_patterns(self):
        """Load built-in error patterns."""
        self.builtin_patterns = [
            {
                "pattern": r"await.*ctx\.(storage|integrations|files|notifications|ai)",
                "category": "missing_await",
                "description": "Missing await on async ctx API call",
                "fix_type": "code_replacement",
                "fix_template": {
                    "action": "add_await",
                    "pattern": r"(ctx\.\w+\.\w+\()",
                    "replacement": r"await \1"
                },
                "confidence": 0.95
            },
            {
                "pattern": r"ctx\.files\.upload\([^,)]+\)",
                "category": "api_usage",
                "description": "ctx.files.upload missing filename parameter",
                "fix_type": "api_fix",
                "fix_template": {
                    "action": "add_parameter",
                    "parameter": "filename",
                    "position": 2
                },
                "confidence": 0.90
            },
            {
                "pattern": r"response\.result",
                "category": "api_usage",
                "description": "API response needs unwrapping",
                "fix_type": "code_replacement",
                "fix_template": {
                    "action": "add_unwrap",
                    "pattern": r"const\s+(\w+)\s+=\s+await\s+window\.krilin\.actions\.call",
                    "replacement": r"const response = await window.krilin.actions.call\nconst \1 = response.result || response"
                },
                "confidence": 0.85
            },
            {
                "pattern": r"module '(\w+)' has no attribute '(\w+)'",
                "category": "import_error",
                "description": "Import or attribute error",
                "fix_type": "import_fix",
                "confidence": 0.70
            },
            {
                "pattern": r"name '(\w+)' is not defined",
                "category": "undefined_variable",
                "description": "Variable or function not defined",
                "fix_type": "definition_fix",
                "confidence": 0.75
            }
        ]

    async def analyze_error(
        self,
        db: AsyncSession,
        error_report: ErrorReport
    ) -> Dict[str, Any]:
        """
        Analyze an error and find matching patterns.

        Args:
            db: Database session
            error_report: ErrorReport to analyze

        Returns:
            Analysis result with matched patterns and suggestions
        """
        logger.info(
            f"[ERROR ANALYZER] Analyzing error {error_report.id}: "
            f"{error_report.message}"
        )

        # Check for similar errors
        similar_errors = await self._find_similar_errors(db, error_report)

        # Match against patterns
        matched_patterns = await self._match_patterns(db, error_report)

        # Generate fix suggestions
        fix_suggestions = self._generate_fix_suggestions(
            error_report, matched_patterns
        )

        analysis = {
            "error_id": error_report.id,
            "similar_errors_count": len(similar_errors),
            "similar_errors": similar_errors[:5],  # Top 5
            "matched_patterns": matched_patterns,
            "fix_suggestions": fix_suggestions,
            "can_auto_fix": len(fix_suggestions) > 0 and matched_patterns[0]["confidence"] > 0.8 if matched_patterns else False
        }

        logger.info(
            f"[ERROR ANALYZER] Analysis complete: "
            f"{len(matched_patterns)} patterns matched, "
            f"can_auto_fix={analysis['can_auto_fix']}"
        )

        return analysis

    async def attempt_auto_fix(
        self,
        db: AsyncSession,
        user_id: int,
        app_id: str,
        error_report: ErrorReport
    ) -> Dict[str, Any]:
        """
        Attempt to automatically fix an error.

        Args:
            db: Database session
            user_id: User ID
            app_id: App ID
            error_report: ErrorReport to fix

        Returns:
            Result of auto-fix attempt
        """
        logger.info(
            f"[ERROR ANALYZER] Attempting auto-fix for error {error_report.id}"
        )

        # Analyze error
        analysis = await self.analyze_error(db, error_report)

        if not analysis["can_auto_fix"]:
            logger.info("[ERROR ANALYZER] Error cannot be auto-fixed")
            return {
                "success": False,
                "reason": "No high-confidence fix available",
                "analysis": analysis
            }

        # Get the best pattern match
        best_pattern = analysis["matched_patterns"][0]

        # Apply fix based on pattern
        try:
            fix_result = await self._apply_fix(
                user_id, app_id, error_report, best_pattern
            )

            if fix_result["success"]:
                # Update error report
                error_report.auto_fix_attempted = True
                error_report.auto_fix_successful = True
                error_report.auto_fix_details = {
                    "pattern_id": best_pattern.get("id"),
                    "fix_type": best_pattern["fix_type"],
                    "applied_at": datetime.utcnow().isoformat(),
                    "changes": fix_result.get("changes")
                }
                error_report.status = "fixed"
                error_report.resolved_at = datetime.utcnow()

                # Update pattern success count
                if "id" in best_pattern:
                    pattern_stmt = select(ErrorPattern).where(
                        ErrorPattern.id == best_pattern["id"]
                    )
                    result = await db.execute(pattern_stmt)
                    pattern = result.scalar_one_or_none()
                    if pattern:
                        pattern.times_applied += 1
                        pattern.times_successful += 1

                await db.commit()

                logger.info(
                    f"[ERROR ANALYZER] Auto-fix successful for error {error_report.id}"
                )

                return {
                    "success": True,
                    "pattern": best_pattern,
                    "changes": fix_result.get("changes"),
                    "message": "Fix applied successfully"
                }
            else:
                # Update error report (attempted but failed)
                error_report.auto_fix_attempted = True
                error_report.auto_fix_successful = False
                error_report.auto_fix_details = {
                    "pattern_id": best_pattern.get("id"),
                    "fix_type": best_pattern["fix_type"],
                    "attempted_at": datetime.utcnow().isoformat(),
                    "error": fix_result.get("error")
                }

                await db.commit()

                return {
                    "success": False,
                    "reason": "Fix application failed",
                    "error": fix_result.get("error")
                }

        except Exception as e:
            logger.error(f"[ERROR ANALYZER] Auto-fix failed: {e}")
            error_report.auto_fix_attempted = True
            error_report.auto_fix_successful = False
            await db.commit()

            return {
                "success": False,
                "reason": "Exception during fix",
                "error": str(e)
            }

    async def _find_similar_errors(
        self,
        db: AsyncSession,
        error_report: ErrorReport
    ) -> List[Dict]:
        """Find similar errors in the database."""
        # Find errors with same hash
        if error_report.error_hash:
            stmt = select(ErrorReport).where(
                ErrorReport.error_hash == error_report.error_hash,
                ErrorReport.id != error_report.id
            ).order_by(ErrorReport.created_at.desc()).limit(10)

            result = await db.execute(stmt)
            similar = result.scalars().all()

            return [
                {
                    "id": e.id,
                    "app_id": e.app_id,
                    "message": e.message,
                    "status": e.status,
                    "auto_fix_successful": e.auto_fix_successful
                }
                for e in similar
            ]

        return []

    async def _match_patterns(
        self,
        db: AsyncSession,
        error_report: ErrorReport
    ) -> List[Dict]:
        """Match error against known patterns."""
        matched = []

        # Check built-in patterns
        for pattern in self.builtin_patterns:
            if re.search(pattern["pattern"], error_report.message, re.IGNORECASE):
                matched.append({
                    "source": "builtin",
                    "pattern": pattern["pattern"],
                    "category": pattern["category"],
                    "description": pattern["description"],
                    "fix_type": pattern["fix_type"],
                    "fix_template": pattern["fix_template"],
                    "confidence": pattern["confidence"]
                })

        # Check database patterns
        stmt = select(ErrorPattern).where(
            ErrorPattern.category == error_report.category
        )
        result = await db.execute(stmt)
        db_patterns = result.scalars().all()

        for db_pattern in db_patterns:
            if re.search(db_pattern.pattern, error_report.message, re.IGNORECASE):
                matched.append({
                    "id": db_pattern.id,
                    "source": "database",
                    "pattern": db_pattern.pattern,
                    "category": db_pattern.category,
                    "description": db_pattern.description,
                    "fix_type": db_pattern.fix_type,
                    "fix_template": db_pattern.fix_template,
                    "confidence": db_pattern.confidence
                })

        # Sort by confidence
        matched.sort(key=lambda x: x["confidence"], reverse=True)

        return matched

    def _generate_fix_suggestions(
        self,
        error_report: ErrorReport,
        matched_patterns: List[Dict]
    ) -> List[Dict]:
        """Generate human-readable fix suggestions."""
        suggestions = []

        for pattern in matched_patterns:
            suggestion = {
                "description": pattern["description"],
                "confidence": pattern["confidence"],
                "fix_type": pattern["fix_type"]
            }

            # Add specific guidance based on fix type
            if pattern["fix_type"] == "code_replacement":
                suggestion["guidance"] = (
                    "Apply code replacement pattern to fix the issue"
                )
            elif pattern["fix_type"] == "api_fix":
                suggestion["guidance"] = (
                    "Update API call parameters or structure"
                )
            elif pattern["fix_type"] == "import_fix":
                suggestion["guidance"] = (
                    "Add or correct import statements"
                )

            suggestions.append(suggestion)

        return suggestions

    async def _apply_fix(
        self,
        user_id: int,
        app_id: str,
        error_report: ErrorReport,
        pattern: Dict
    ) -> Dict[str, Any]:
        """
        Apply a fix based on a matched pattern.

        This is a simplified implementation - real auto-fix would be more sophisticated.
        """
        try:
            file_to_fix = error_report.file or "backend.py"
            app_dir = self.user_app_manager.get_app_dir(user_id, app_id)
            file_path = app_dir / file_to_fix

            if not file_path.exists():
                return {
                    "success": False,
                    "error": f"File not found: {file_to_fix}"
                }

            # Read file
            content = file_path.read_text()

            # Apply fix based on fix_type
            fix_template = pattern["fix_template"]
            fix_type = pattern["fix_type"]

            if fix_type == "code_replacement":
                action = fix_template.get("action")
                if action == "add_await":
                    # Add await before async calls
                    pattern_regex = fix_template["pattern"]
                    replacement = fix_template["replacement"]
                    new_content = re.sub(pattern_regex, replacement, content)

                    if new_content != content:
                        file_path.write_text(new_content)
                        return {
                            "success": True,
                            "changes": "Added await to async call"
                        }

            # If no specific fix was applied
            return {
                "success": False,
                "error": f"Fix type '{fix_type}' not implemented yet"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def get_error_analytics(
        self,
        db: AsyncSession,
        app_id: Optional[str] = None,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Get error analytics for dashboard.

        Args:
            db: Database session
            app_id: Optional app ID filter
            days: Number of days to analyze

        Returns:
            Analytics dictionary
        """
        since = datetime.utcnow() - timedelta(days=days)

        # Build base query
        stmt = select(ErrorReport).where(
            ErrorReport.created_at >= since
        )

        if app_id:
            stmt = stmt.where(ErrorReport.app_id == app_id)

        result = await db.execute(stmt)
        errors = result.scalars().all()

        # Calculate metrics
        total_errors = len(errors)
        by_severity = {}
        by_category = {}
        by_status = {}
        auto_fix_attempts = 0
        auto_fix_successes = 0

        for error in errors:
            # By severity
            by_severity[error.severity] = by_severity.get(error.severity, 0) + 1

            # By category
            by_category[error.category] = by_category.get(error.category, 0) + 1

            # By status
            by_status[error.status] = by_status.get(error.status, 0) + 1

            # Auto-fix stats
            if error.auto_fix_attempted:
                auto_fix_attempts += 1
                if error.auto_fix_successful:
                    auto_fix_successes += 1

        return {
            "period_days": days,
            "total_errors": total_errors,
            "by_severity": by_severity,
            "by_category": by_category,
            "by_status": by_status,
            "auto_fix": {
                "attempts": auto_fix_attempts,
                "successes": auto_fix_successes,
                "success_rate": (
                    auto_fix_successes / auto_fix_attempts
                    if auto_fix_attempts > 0
                    else 0
                )
            }
        }


# Global instance
_error_analyzer: Optional[ErrorAnalyzer] = None


def get_error_analyzer() -> ErrorAnalyzer:
    """Get the global ErrorAnalyzer instance."""
    global _error_analyzer
    if _error_analyzer is None:
        _error_analyzer = ErrorAnalyzer()
    return _error_analyzer
