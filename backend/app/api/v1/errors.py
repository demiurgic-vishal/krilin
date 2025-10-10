"""
Error Reporting API Endpoints

Provides endpoints for:
- Reporting frontend/runtime errors
- Retrieving error reports
- Analyzing errors
- Attempting auto-fixes
- Error analytics
"""
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel

from app.database import get_db
from app.models.error_report import ErrorReport, ErrorPattern
from app.models.user import User
from app.dependencies import CurrentUserDep
from app.services.error_analyzer import get_error_analyzer
from app.services.app_executor import get_app_executor
from app.services.app_test_runner import get_app_test_runner

router = APIRouter(prefix="/errors", tags=["errors"])


# ===== Request/Response Models =====

class ErrorReportCreate(BaseModel):
    app_id: str
    error_type: str  # validation, runtime, integration, generation
    severity: str  # info, warning, error, critical
    category: str
    message: str
    file: Optional[str] = None
    line: Optional[int] = None
    suggestion: Optional[str] = None
    context: dict = {}
    stack_trace: Optional[str] = None


class ErrorReportResponse(BaseModel):
    id: int
    user_id: int
    app_id: str
    error_type: str
    severity: str
    category: str
    message: str
    file: Optional[str]
    line: Optional[int]
    suggestion: Optional[str]
    status: str
    auto_fix_attempted: bool
    auto_fix_successful: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ErrorAnalysisResponse(BaseModel):
    error_id: int
    similar_errors_count: int
    matched_patterns: List[dict]
    fix_suggestions: List[dict]
    can_auto_fix: bool


class AutoFixResponse(BaseModel):
    success: bool
    pattern: Optional[dict] = None
    changes: Optional[str] = None
    message: str


class TestExecutionRequest(BaseModel):
    app_id: str
    test_scenarios: Optional[List[dict]] = None


class ActionExecutionRequest(BaseModel):
    app_id: str
    action_name: str
    params: dict = {}


# ===== Endpoints =====

@router.post("/report", response_model=dict)
async def report_error(
    error: ErrorReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUserDep = None
):
    """
    Report a new error from frontend or backend.

    This is called by ErrorBoundary and other error handlers.
    """
    import hashlib

    # Create error hash for grouping
    error_content = f"{error.category}:{error.message}:{error.file or 'unknown'}"
    error_hash = hashlib.sha256(error_content.encode()).hexdigest()

    # Check if similar error exists
    stmt = select(ErrorReport).where(
        ErrorReport.error_hash == error_hash,
        ErrorReport.app_id == error.app_id,
        ErrorReport.user_id == current_user.id
    ).order_by(desc(ErrorReport.created_at)).limit(1)

    result = await db.execute(stmt)
    existing_error = result.scalar_one_or_none()

    if existing_error and existing_error.status != "fixed":
        # Update occurrence count
        existing_error.occurrence_count += 1
        existing_error.last_seen = datetime.utcnow()
        await db.commit()

        return {
            "error_id": existing_error.id,
            "status": "updated_existing",
            "occurrence_count": existing_error.occurrence_count
        }

    # Create new error report
    error_report = ErrorReport(
        user_id=current_user.id,
        app_id=error.app_id,
        error_type=error.error_type,
        severity=error.severity,
        category=error.category,
        message=error.message,
        file=error.file,
        line=error.line,
        suggestion=error.suggestion,
        context=error.context,
        stack_trace=error.stack_trace,
        error_hash=error_hash,
        status="new",
        created_at=datetime.utcnow()
    )

    db.add(error_report)
    await db.commit()
    await db.refresh(error_report)

    return {
        "error_id": error_report.id,
        "status": "created",
        "occurrence_count": 1
    }


@router.get("/app/{app_id}", response_model=List[ErrorReportResponse])
async def get_app_errors(
    app_id: str,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUserDep = None
):
    """Get all errors for a specific app."""
    stmt = select(ErrorReport).where(
        ErrorReport.app_id == app_id,
        ErrorReport.user_id == current_user.id
    )

    if status:
        stmt = stmt.where(ErrorReport.status == status)

    if severity:
        stmt = stmt.where(ErrorReport.severity == severity)

    stmt = stmt.order_by(desc(ErrorReport.created_at)).limit(limit)

    result = await db.execute(stmt)
    errors = result.scalars().all()

    return errors


@router.get("/{error_id}", response_model=ErrorReportResponse)
async def get_error(
    error_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUserDep = None
):
    """Get a specific error by ID."""
    stmt = select(ErrorReport).where(
        ErrorReport.id == error_id,
        ErrorReport.user_id == current_user.id
    )

    result = await db.execute(stmt)
    error = result.scalar_one_or_none()

    if not error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Error not found"
        )

    return error


@router.post("/{error_id}/analyze", response_model=ErrorAnalysisResponse)
async def analyze_error(
    error_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUserDep = None
):
    """Analyze an error and find matching patterns."""
    # Get error
    stmt = select(ErrorReport).where(
        ErrorReport.id == error_id,
        ErrorReport.user_id == current_user.id
    )

    result = await db.execute(stmt)
    error = result.scalar_one_or_none()

    if not error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Error not found"
        )

    # Analyze
    analyzer = get_error_analyzer()
    analysis = await analyzer.analyze_error(db, error)

    return analysis


@router.post("/{error_id}/auto-fix", response_model=AutoFixResponse)
async def auto_fix_error(
    error_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUserDep = None
):
    """Attempt to automatically fix an error."""
    # Get error
    stmt = select(ErrorReport).where(
        ErrorReport.id == error_id,
        ErrorReport.user_id == current_user.id
    )

    result = await db.execute(stmt)
    error = result.scalar_one_or_none()

    if not error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Error not found"
        )

    # Attempt auto-fix
    analyzer = get_error_analyzer()
    fix_result = await analyzer.attempt_auto_fix(
        db=db,
        user_id=current_user.id,
        app_id=error.app_id,
        error_report=error
    )

    return AutoFixResponse(**fix_result)


@router.post("/test-app", response_model=dict)
async def test_app(
    request: TestExecutionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUserDep = None
):
    """
    Run automated tests on an app.

    Executes all actions with mock data and reports errors.
    """
    test_runner = get_app_test_runner()

    try:
        results = await test_runner.test_app(
            user_id=current_user.id,
            app_id=request.app_id,
            db=db,
            test_scenarios=request.test_scenarios
        )

        return results

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Test execution failed: {str(e)}"
        )


@router.post("/execute-action", response_model=dict)
async def execute_action(
    request: ActionExecutionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUserDep = None
):
    """
    Execute a specific action for testing.

    Runs the action with provided parameters and captures errors.
    """
    executor = get_app_executor()

    try:
        result = await executor.execute_action(
            user_id=current_user.id,
            app_id=request.app_id,
            action_name=request.action_name,
            params=request.params,
            db=db,
            save_errors=True
        )

        return result.to_dict()

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Action execution failed: {str(e)}"
        )


@router.get("/analytics", response_model=dict)
async def get_error_analytics(
    app_id: Optional[str] = None,
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUserDep = None
):
    """Get error analytics for dashboard."""
    analyzer = get_error_analyzer()

    analytics = await analyzer.get_error_analytics(
        db=db,
        app_id=app_id,
        days=days
    )

    return analytics


@router.delete("/{error_id}")
async def delete_error(
    error_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUserDep = None
):
    """Delete an error report."""
    stmt = select(ErrorReport).where(
        ErrorReport.id == error_id,
        ErrorReport.user_id == current_user.id
    )

    result = await db.execute(stmt)
    error = result.scalar_one_or_none()

    if not error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Error not found"
        )

    await db.delete(error)
    await db.commit()

    return {"message": "Error deleted successfully"}


@router.patch("/{error_id}/status")
async def update_error_status(
    error_id: int,
    new_status: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUserDep = None
):
    """Update error status (new, acknowledged, fixed, wont_fix)."""
    stmt = select(ErrorReport).where(
        ErrorReport.id == error_id,
        ErrorReport.user_id == current_user.id
    )

    result = await db.execute(stmt)
    error = result.scalar_one_or_none()

    if not error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Error not found"
        )

    valid_statuses = ["new", "acknowledged", "fixed", "wont_fix"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    error.status = new_status

    if new_status == "fixed":
        error.resolved_at = datetime.utcnow()

    await db.commit()

    return {"message": f"Error status updated to {new_status}"}


# ===== Error Pattern Management =====

@router.get("/patterns", response_model=List[dict])
async def get_error_patterns(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUserDep = None
):
    """Get all error patterns."""
    stmt = select(ErrorPattern)

    if category:
        stmt = stmt.where(ErrorPattern.category == category)

    stmt = stmt.order_by(desc(ErrorPattern.confidence))

    result = await db.execute(stmt)
    patterns = result.scalars().all()

    return [
        {
            "id": p.id,
            "pattern": p.pattern,
            "category": p.category,
            "description": p.description,
            "fix_type": p.fix_type,
            "confidence": p.confidence,
            "times_applied": p.times_applied,
            "times_successful": p.times_successful,
            "success_rate": (
                p.times_successful / p.times_applied
                if p.times_applied > 0
                else 0
            )
        }
        for p in patterns
    ]
