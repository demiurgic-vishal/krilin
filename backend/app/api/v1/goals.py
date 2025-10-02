"""
Goal tracking and management API endpoints.
Core to the adaptive AI system from ideas.txt where users say
"I want to be more social" and AI creates comprehensive plans.
"""
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUserDep, DatabaseDep
from app.models.goal import Goal, GoalCategory, GoalStatus, ProgressEntry
from app.schemas.goal import (
    GoalCreate,
    GoalGenerationRequest,
    GoalGenerationResponse,
    GoalResponse,
    GoalUpdate,
    GoalWithProgress,
    ProgressEntryCreate,
    ProgressEntryResponse,
)
from app.services.claude_agent_service import get_agent_by_type
from app.api.v1.chat import determine_agent_from_message

router = APIRouter()


@router.get("/", response_model=list[GoalResponse])
async def list_goals(
    current_user: CurrentUserDep,
    db: DatabaseDep,
    status: Optional[GoalStatus] = None,
    category: Optional[GoalCategory] = None,
    limit: int = 50,
    offset: int = 0
) -> Any:
    """
    List user's goals with optional filtering.

    Args:
        current_user: Current authenticated user
        db: Database session
        status: Optional filter by goal status
        category: Optional filter by category
        limit: Number of goals to return
        offset: Number of goals to skip

    Returns:
        list[GoalResponse]: List of user's goals
    """
    query = select(Goal).where(
        Goal.user_id == current_user.id
    ).order_by(Goal.created_at.desc())

    if status:
        query = query.where(Goal.status == status)

    if category:
        query = query.where(Goal.category == category)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    goals = result.scalars().all()

    return [GoalResponse.from_orm(goal) for goal in goals]


@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_data: GoalCreate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Create a new goal manually.

    Args:
        goal_data: Goal creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        GoalResponse: Created goal
    """
    goal = Goal(
        user_id=current_user.id,
        title=goal_data.title,
        description=goal_data.description,
        category=goal_data.category,
        priority=goal_data.priority,
        target_date=goal_data.target_date,
        created_by_agent="manual",
        started_at=datetime.utcnow()
    )

    db.add(goal)
    await db.commit()
    await db.refresh(goal)

    return GoalResponse.from_orm(goal)


@router.post("/generate", response_model=GoalGenerationResponse, status_code=status.HTTP_201_CREATED)
async def generate_goal_with_ai(
    request: GoalGenerationRequest,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Generate a goal with AI-powered plan, resources, and exercises.
    This is the core feature where users say "I want to be more social"
    and get a comprehensive action plan.

    Args:
        request: Goal generation request with user's goal statement
        current_user: Current authenticated user
        db: Database session

    Returns:
        GoalGenerationResponse: Generated goal with complete plan
    """
    # Determine which AI agent to use
    agent_type = determine_agent_from_message(request.goal_statement)
    agent = get_agent_by_type(agent_type)

    # Build context
    context = {
        "user_id": current_user.id,
        "user_preferences": current_user.preferences,
        "is_goal_setting": True,
        "message_intent": "goal_creation"
    }

    try:
        # Generate comprehensive response from AI
        ai_response = await agent.process_goal_message(
            message=request.goal_statement,
            context=context
        )

        # Parse AI response (in a real implementation, we'd use structured output)
        # For now, we'll create a basic structure
        goal_title = request.goal_statement[:255]  # Truncate if needed

        # Determine category from goal statement
        category = _determine_category(request.goal_statement)

        # Create the goal with AI-generated content
        goal = Goal(
            user_id=current_user.id,
            title=goal_title,
            description=ai_response.content[:500],  # First part as description
            category=category,
            priority=3,
            ai_plan={"content": ai_response.content},
            resources=ai_response.resources_found or [],
            exercises=[],
            progress_metrics={},
            created_by_agent=agent_type,
            started_at=datetime.utcnow()
        )

        db.add(goal)
        await db.commit()
        await db.refresh(goal)

        return GoalGenerationResponse(
            goal=GoalResponse.from_orm(goal),
            plan=goal.ai_plan,
            resources=goal.resources,
            exercises=goal.exercises,
            timeline={},
            tracking_metrics=[]
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating goal: {str(e)}"
        )


@router.get("/{goal_id}", response_model=GoalWithProgress)
async def get_goal(
    goal_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Get a specific goal with progress history.

    Args:
        goal_id: Goal ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        GoalWithProgress: Goal with progress entries

    Raises:
        HTTPException: If goal not found or unauthorized
    """
    result = await db.execute(
        select(Goal).where(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        ).options(selectinload(Goal.progress_entries))
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    return GoalWithProgress.from_orm(goal)


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Update a goal.

    Args:
        goal_id: Goal ID
        goal_update: Fields to update
        current_user: Current authenticated user
        db: Database session

    Returns:
        GoalResponse: Updated goal

    Raises:
        HTTPException: If goal not found or unauthorized
    """
    result = await db.execute(
        select(Goal).where(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        )
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    # Update fields
    update_data = goal_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    # If status changed to completed, set completed_at
    if goal_update.status == "completed" and not goal.completed_at:
        goal.completed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(goal)

    return GoalResponse.from_orm(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> None:
    """
    Delete a goal.

    Args:
        goal_id: Goal ID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If goal not found or unauthorized
    """
    result = await db.execute(
        select(Goal).where(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        )
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    await db.delete(goal)
    await db.commit()


@router.get("/{goal_id}/progress", response_model=list[ProgressEntryResponse])
async def get_goal_progress(
    goal_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep,
    limit: int = 100,
    offset: int = 0
) -> Any:
    """
    Get progress entries for a specific goal.

    Args:
        goal_id: Goal ID
        current_user: Current authenticated user
        db: Database session
        limit: Number of entries to return
        offset: Number of entries to skip

    Returns:
        list[ProgressEntryResponse]: Progress entries

    Raises:
        HTTPException: If goal not found or unauthorized
    """
    # Verify goal ownership
    result = await db.execute(
        select(Goal).where(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        )
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    # Get progress entries
    result = await db.execute(
        select(ProgressEntry).where(
            ProgressEntry.goal_id == goal_id
        ).order_by(ProgressEntry.date.desc())
        .limit(limit).offset(offset)
    )
    entries = result.scalars().all()

    return [ProgressEntryResponse.from_orm(entry) for entry in entries]


@router.post("/{goal_id}/progress", response_model=ProgressEntryResponse, status_code=status.HTTP_201_CREATED)
async def add_progress_entry(
    goal_id: int,
    entry_data: ProgressEntryCreate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Add a progress entry for a goal.

    Args:
        goal_id: Goal ID
        entry_data: Progress entry data
        current_user: Current authenticated user
        db: Database session

    Returns:
        ProgressEntryResponse: Created progress entry

    Raises:
        HTTPException: If goal not found or unauthorized
    """
    # Verify goal ownership
    result = await db.execute(
        select(Goal).where(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        )
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    # Create progress entry
    entry = ProgressEntry(
        goal_id=goal_id,
        value=entry_data.value,
        notes=entry_data.notes,
        entry_type=entry_data.entry_type,
        data_source=entry_data.data_source,
        date=entry_data.date
    )

    db.add(entry)

    # Update goal's current progress
    goal.current_progress = entry_data.value

    await db.commit()
    await db.refresh(entry)

    return ProgressEntryResponse.from_orm(entry)


def _determine_category(goal_statement: str) -> GoalCategory:
    """
    Determine goal category from statement.

    Args:
        goal_statement: User's goal statement

    Returns:
        GoalCategory: Determined category
    """
    statement_lower = goal_statement.lower()

    if any(word in statement_lower for word in ["social", "friend", "relationship", "communicate", "connect"]):
        return "social"
    if any(word in statement_lower for word in ["organized", "organize", "tidy", "system"]):
        return "organized"
    if any(word in statement_lower for word in ["learn", "study", "skill", "course", "education"]):
        return "learning"
    if any(word in statement_lower for word in ["healthy", "fit", "exercise", "workout", "wellness", "health"]):
        return "health"
    if any(word in statement_lower for word in ["money", "finance", "invest", "save", "budget", "wealth"]):
        return "finance"
    if any(word in statement_lower for word in ["career", "job", "profession", "work", "promotion"]):
        return "career"
    if any(word in statement_lower for word in ["productive", "efficiency", "time", "tasks"]):
        return "productivity"
    if any(word in statement_lower for word in ["wellness", "wellbeing", "mental", "mindful"]):
        return "wellness"

    # Default
    return "social"
