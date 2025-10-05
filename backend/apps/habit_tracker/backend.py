"""
Habit Tracker App - Backend Logic

All app actions receive a PlatformContext (ctx) which provides:
- ctx.storage - Database operations (auto-scoped to user)
- ctx.user - User information
- ctx.apps - Access to other installed apps
- ctx.integrations - Access to external services
- ctx.streams - Real-time event publishing
- ctx.schedule - Schedule tasks
- ctx.notifications - Send notifications
- ctx.files - File operations
- ctx.ai - AI/LLM capabilities
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import logging

from app.core.platform_context import PlatformContext

logger = logging.getLogger(__name__)


async def get_habits(
    ctx: PlatformContext,
    include_archived: bool = False
) -> List[Dict[str, Any]]:
    """
    Get all habits for the user.

    Args:
        ctx: Platform context
        include_archived: Whether to include archived habits

    Returns:
        List of habit records
    """
    where = {}
    if not include_archived:
        where["active"] = True

    habits = await ctx.storage.query(
        "habits",
        where=where,
        order_by={"created_at": "desc"}
    )

    # Enrich with streak data
    for habit in habits:
        streak = await calculate_streak(ctx, habit["id"])
        habit["current_streak"] = streak

    logger.info(f"[HABIT TRACKER] Retrieved {len(habits)} habits for user {ctx.user_id}")

    return habits


async def create_habit(
    ctx: PlatformContext,
    name: str,
    frequency: str = "daily",
    description: str = "",
    target_count: int = 1,
    category: str = "general",
    color: str = "#3B82F6",
    icon: str = "target"
) -> Dict[str, Any]:
    """
    Create a new habit.

    Args:
        ctx: Platform context
        name: Habit name
        frequency: Frequency (daily, weekly, custom)
        description: Habit description
        target_count: Target count per period
        category: Category
        color: Color code
        icon: Icon name

    Returns:
        Created habit record
    """
    habit = await ctx.storage.insert("habits", {
        "name": name,
        "description": description,
        "frequency": frequency,
        "target_count": target_count,
        "category": category,
        "color": color,
        "icon": icon,
        "active": True,
        "archived_at": None
    })

    logger.info(f"[HABIT TRACKER] Created habit: {name} (id: {habit['id']})")

    # Publish event
    await ctx.streams.publish("habit_created", {
        "habit_id": habit["id"],
        "habit_name": name
    })

    return habit


async def update_habit(
    ctx: PlatformContext,
    habit_id: str,
    **updates
) -> Dict[str, Any]:
    """
    Update a habit.

    Args:
        ctx: Platform context
        habit_id: Habit ID
        **updates: Fields to update

    Returns:
        Updated habit record
    """
    # Verify habit exists and belongs to user
    habit = await ctx.storage.find_one("habits", {"id": habit_id})

    if not habit:
        raise ValueError(f"Habit {habit_id} not found")

    # Update habit
    updated = await ctx.storage.update(
        "habits",
        habit_id,
        updates
    )

    logger.info(f"[HABIT TRACKER] Updated habit: {habit_id}")

    return updated


async def archive_habit(
    ctx: PlatformContext,
    habit_id: str
) -> Dict[str, Any]:
    """
    Archive a habit.

    Args:
        ctx: Platform context
        habit_id: Habit ID

    Returns:
        Archived habit record
    """
    return await update_habit(
        ctx,
        habit_id,
        active=False,
        archived_at=ctx.now().isoformat()
    )


async def log_habit(
    ctx: PlatformContext,
    habit_id: str,
    notes: str = "",
    mood: Optional[str] = None,
    duration_minutes: Optional[int] = None
) -> Dict[str, Any]:
    """
    Log completion of a habit.

    Args:
        ctx: Platform context
        habit_id: Habit ID
        notes: Optional notes
        mood: Mood after completing
        duration_minutes: Duration in minutes

    Returns:
        Created log record
    """
    # Verify habit exists
    habit = await ctx.storage.find_one("habits", {"id": habit_id})

    if not habit:
        raise ValueError(f"Habit {habit_id} not found")

    # Create log entry
    log = await ctx.storage.insert("habit_logs", {
        "habit_id": habit_id,
        "completed_at": ctx.now().isoformat(),
        "notes": notes,
        "mood": mood,
        "duration_minutes": duration_minutes
    })

    logger.info(f"[HABIT TRACKER] Logged habit: {habit['name']} (id: {habit_id})")

    # Calculate new streak
    streak = await calculate_streak(ctx, habit_id)

    # Publish event
    await ctx.streams.publish("habit_completed", {
        "habit_id": habit_id,
        "habit_name": habit["name"],
        "streak": streak,
        "log_id": log["id"]
    })

    # Send notification if it's a milestone
    if streak > 0 and streak % 7 == 0:
        await ctx.notifications.send({
            "title": f"🎉 {streak}-day streak!",
            "message": f"Congrats on {streak} days of {habit['name']}!",
            "type": "celebration"
        })

    return log


async def calculate_streak(
    ctx: PlatformContext,
    habit_id: str
) -> int:
    """
    Calculate current streak for a habit.

    Counts consecutive days with at least one completion.

    Args:
        ctx: Platform context
        habit_id: Habit ID

    Returns:
        Current streak count (number of consecutive days)
    """
    # Get habit to check frequency
    habit = await ctx.storage.find_one("habits", {"id": habit_id})

    if not habit:
        return 0

    # Get all logs for this habit, ordered by completion time (desc)
    logs = await ctx.storage.query(
        "habit_logs",
        where={"habit_id": habit_id},
        order_by={"completed_at": "desc"}
    )

    if not logs:
        return 0

    # For daily habits, calculate consecutive days
    if habit.get("frequency") == "daily":
        streak = 0
        current_date = datetime.utcnow().date()

        # Check if completed today or yesterday (to start streak)
        last_completed = datetime.fromisoformat(logs[0]["completed_at"]).date()
        days_diff = (current_date - last_completed).days

        if days_diff > 1:
            # Streak broken
            return 0

        # Count backwards from today
        check_date = current_date
        log_index = 0

        while log_index < len(logs):
            log_date = datetime.fromisoformat(logs[log_index]["completed_at"]).date()

            if log_date == check_date:
                streak += 1
                log_index += 1
                check_date -= timedelta(days=1)
            elif log_date < check_date:
                # Gap found, streak broken
                break
            else:
                # Shouldn't happen with desc order, but safety check
                log_index += 1

        return streak

    # For weekly habits, count consecutive weeks
    # (Simplified for MVP)
    return len(logs)


async def get_stats(
    ctx: PlatformContext,
    period: str = "week"
) -> Dict[str, Any]:
    """
    Get habit statistics for a time period.

    Args:
        ctx: Platform context
        period: Time period (week, month, year)

    Returns:
        Statistics dictionary
    """
    # Get all active habits
    habits = await ctx.storage.query(
        "habits",
        where={"active": True}
    )

    # Calculate date range
    now = ctx.now()

    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=7)

    # Get logs in period
    all_logs = []
    for habit in habits:
        logs = await ctx.storage.query(
            "habit_logs",
            where={"habit_id": habit["id"]}
        )
        all_logs.extend(logs)

    # Filter logs by date
    period_logs = [
        log for log in all_logs
        if datetime.fromisoformat(log["completed_at"]) >= start_date
    ]

    # Calculate stats
    total_habits = len(habits)
    total_completions = len(period_logs)

    # Completions per day
    days_in_period = (now - start_date).days
    expected_completions = total_habits * days_in_period

    completion_rate = (
        (total_completions / expected_completions * 100)
        if expected_completions > 0
        else 0
    )

    # Completed today
    today_logs = [
        log for log in all_logs
        if datetime.fromisoformat(log["completed_at"]).date() == now.date()
    ]
    completed_today = len(set(log["habit_id"] for log in today_logs))

    stats = {
        "period": period,
        "total_habits": total_habits,
        "total_completions": total_completions,
        "completion_rate": round(completion_rate, 1),
        "completed_today": completed_today,
        "pending_today": total_habits - completed_today,
        "start_date": start_date.isoformat(),
        "end_date": now.isoformat()
    }

    logger.info(f"[HABIT TRACKER] Calculated stats for period: {period}")

    return stats


async def get_logs_for_habit(
    ctx: PlatformContext,
    habit_id: str,
    limit: int = 30
) -> List[Dict[str, Any]]:
    """
    Get recent logs for a habit.

    Args:
        ctx: Platform context
        habit_id: Habit ID
        limit: Number of logs to return

    Returns:
        List of log records
    """
    logs = await ctx.storage.query(
        "habit_logs",
        where={"habit_id": habit_id},
        order_by={"completed_at": "desc"},
        limit=limit
    )

    return logs


# Output functions (for other apps to consume)

async def get_output_daily_streaks(ctx: PlatformContext) -> List[Dict[str, Any]]:
    """
    Output function: Get current streaks for all active habits.

    This output can be consumed by other apps (e.g., Analytics Dashboard).

    Returns:
        List of habit streaks
    """
    habits = await get_habits(ctx, include_archived=False)

    streaks = []
    for habit in habits:
        streak = await calculate_streak(ctx, habit["id"])

        # Get last completed date
        logs = await ctx.storage.query(
            "habit_logs",
            where={"habit_id": habit["id"]},
            order_by={"completed_at": "desc"},
            limit=1
        )

        last_completed = logs[0]["completed_at"] if logs else None

        streaks.append({
            "habit_id": habit["id"],
            "habit_name": habit["name"],
            "streak": streak,
            "last_completed": last_completed
        })

    return streaks


async def get_output_completion_stats(ctx: PlatformContext) -> Dict[str, Any]:
    """
    Output function: Get overall completion statistics.

    Returns:
        Completion stats dictionary
    """
    stats = await get_stats(ctx, period="week")

    return {
        "total_habits": stats["total_habits"],
        "completed_today": stats["completed_today"],
        "completion_rate": stats["completion_rate"]
    }


# App initialization (called on first install)

async def initialize_app(ctx: PlatformContext):
    """
    Initialize the app for a new user.

    Creates sample habits for demo purposes.

    Args:
        ctx: Platform context
    """
    logger.info(f"[HABIT TRACKER] Initializing app for user {ctx.user_id}")

    # Create sample habits
    sample_habits = [
        {
            "name": "Morning Exercise",
            "description": "30 minutes of exercise to start the day",
            "frequency": "daily",
            "category": "health",
            "color": "#EF4444",
            "icon": "dumbbell"
        },
        {
            "name": "Read for 20 minutes",
            "description": "Read books to expand knowledge",
            "frequency": "daily",
            "category": "learning",
            "color": "#8B5CF6",
            "icon": "book"
        },
        {
            "name": "Drink 8 glasses of water",
            "description": "Stay hydrated throughout the day",
            "frequency": "daily",
            "category": "health",
            "color": "#3B82F6",
            "icon": "droplet"
        }
    ]

    for sample in sample_habits:
        await create_habit(ctx, **sample)

    logger.info(f"[HABIT TRACKER] Created {len(sample_habits)} sample habits")
