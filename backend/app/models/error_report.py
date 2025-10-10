"""
Error Report model for tracking validation and runtime errors.
Part of the Claude Error Feedback Framework.
"""
from datetime import datetime
from typing import Literal, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, Boolean, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


ErrorType = Literal["validation", "runtime", "integration", "generation"]
ErrorSeverity = Literal["info", "warning", "error", "critical"]
ErrorStatus = Literal["new", "acknowledged", "fixed", "wont_fix"]


class ErrorReport(Base):
    """Tracks all errors from validation and runtime."""

    __tablename__ = "error_reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    app_id: Mapped[str] = mapped_column(String(255), index=True)

    # Error classification
    error_type: Mapped[ErrorType] = mapped_column(String(50), index=True)
    severity: Mapped[ErrorSeverity] = mapped_column(String(20), index=True)
    category: Mapped[str] = mapped_column(String(100))  # syntax, api_usage, runtime, etc.

    # Error details
    message: Mapped[str] = mapped_column(Text)
    file: Mapped[Optional[str]] = mapped_column(String(255))
    line: Mapped[Optional[int]] = mapped_column(Integer)
    suggestion: Mapped[Optional[str]] = mapped_column(Text)

    # Context (full error with stack trace, request data, etc.)
    context: Mapped[dict] = mapped_column(JSON, default=dict)

    # Stack trace for runtime errors
    stack_trace: Mapped[Optional[str]] = mapped_column(Text)

    # Status tracking
    status: Mapped[ErrorStatus] = mapped_column(String(20), default="new", index=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Auto-fix tracking
    auto_fix_attempted: Mapped[bool] = mapped_column(Boolean, default=False)
    auto_fix_successful: Mapped[bool] = mapped_column(Boolean, default=False)
    auto_fix_details: Mapped[Optional[dict]] = mapped_column(JSON)

    # Pattern matching (for grouping similar errors)
    error_hash: Mapped[Optional[str]] = mapped_column(String(64), index=True)  # SHA256 of normalized error
    occurrence_count: Mapped[int] = mapped_column(Integer, default=1)
    first_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="error_reports")

    def __repr__(self) -> str:
        return f"<ErrorReport(id={self.id}, type={self.error_type}, severity={self.severity}, app_id='{self.app_id}')>"


class ErrorPattern(Base):
    """Known error patterns for auto-fixing."""

    __tablename__ = "error_patterns"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Pattern matching
    pattern: Mapped[str] = mapped_column(Text)  # Regex pattern for error message
    category: Mapped[str] = mapped_column(String(100), index=True)
    description: Mapped[str] = mapped_column(Text)

    # Auto-fix information
    fix_type: Mapped[str] = mapped_column(String(50))  # code_replacement, api_fix, config_fix
    fix_template: Mapped[dict] = mapped_column(JSON)  # Template for fixing
    confidence: Mapped[float] = mapped_column()  # 0.0 to 1.0

    # Metadata
    example_errors: Mapped[list] = mapped_column(JSON, default=list)
    tags: Mapped[list] = mapped_column(JSON, default=list)

    # Success tracking
    times_applied: Mapped[int] = mapped_column(Integer, default=0)
    times_successful: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<ErrorPattern(id={self.id}, category='{self.category}', confidence={self.confidence})>"
