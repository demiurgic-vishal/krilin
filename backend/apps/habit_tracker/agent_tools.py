"""
Habit Tracker Agent Tools

Custom tools for the Habit Tracker's Claude agent.
These tools allow the agent to interact with habit data.
"""
from typing import Dict, Any, List
from app.core.platform_context import PlatformContext
from . import backend


# Tool definitions
# Each tool needs: name, description, parameters
TOOLS = [
    {
        "name": "view_habits",
        "description": "View all user's active habits with their current streaks",
        "parameters": {}
    },
    {
        "name": "create_new_habit",
        "description": "Create a new habit for the user",
        "parameters": {
            "name": {
                "type": "string",
                "description": "Name of the habit",
                "required": True
            },
            "description": {
                "type": "string",
                "description": "Description of the habit",
                "required": False
            },
            "frequency": {
                "type": "string",
                "description": "Frequency: daily, weekly, or custom",
                "required": False
            },
            "category": {
                "type": "string",
                "description": "Category: health, productivity, learning, social, etc.",
                "required": False
            }
        }
    },
    {
        "name": "log_habit_completion",
        "description": "Log that a habit was completed",
        "parameters": {
            "habit_id": {
                "type": "string",
                "description": "ID of the habit to log",
                "required": True
            },
            "notes": {
                "type": "string",
                "description": "Optional notes about the completion",
                "required": False
            },
            "mood": {
                "type": "string",
                "description": "How you felt: great, good, okay, or difficult",
                "required": False
            }
        }
    },
    {
        "name": "get_habit_stats",
        "description": "Get statistics and insights about habit performance",
        "parameters": {
            "period": {
                "type": "string",
                "description": "Time period: week, month, or year",
                "required": False
            }
        }
    },
    {
        "name": "view_habit_history",
        "description": "View completion history for a specific habit",
        "parameters": {
            "habit_id": {
                "type": "string",
                "description": "ID of the habit",
                "required": True
            },
            "limit": {
                "type": "integer",
                "description": "Number of recent entries to show",
                "required": False
            }
        }
    }
]


# Tool implementations

async def view_habits(ctx: PlatformContext) -> Dict[str, Any]:
    """
    View all user's active habits with their current streaks.

    Args:
        ctx: Platform context

    Returns:
        Dict with habits list and summary
    """
    habits = await backend.get_habits(ctx, include_archived=False)

    # Format for agent
    habit_list = []
    for habit in habits:
        habit_list.append({
            "id": habit["id"],
            "name": habit["name"],
            "description": habit.get("description", ""),
            "frequency": habit.get("frequency", "daily"),
            "category": habit.get("category", "general"),
            "current_streak": habit.get("current_streak", 0),
            "icon": habit.get("icon", "target"),
            "color": habit.get("color", "#3B82F6")
        })

    return {
        "success": True,
        "total_habits": len(habit_list),
        "habits": habit_list
    }


async def create_new_habit(
    ctx: PlatformContext,
    name: str,
    description: str = "",
    frequency: str = "daily",
    category: str = "general"
) -> Dict[str, Any]:
    """
    Create a new habit for the user.

    Args:
        ctx: Platform context
        name: Habit name
        description: Habit description
        frequency: Frequency (daily, weekly, custom)
        category: Category

    Returns:
        Created habit info
    """
    try:
        habit = await backend.create_habit(
            ctx,
            name=name,
            description=description,
            frequency=frequency,
            category=category
        )

        return {
            "success": True,
            "message": f"Created habit: {name}",
            "habit": {
                "id": habit["id"],
                "name": habit["name"],
                "frequency": habit["frequency"],
                "category": habit["category"]
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


async def log_habit_completion(
    ctx: PlatformContext,
    habit_id: str,
    notes: str = "",
    mood: str = None
) -> Dict[str, Any]:
    """
    Log that a habit was completed.

    Args:
        ctx: Platform context
        habit_id: Habit ID
        notes: Optional notes
        mood: How the user felt

    Returns:
        Log result with updated streak
    """
    try:
        log = await backend.log_habit(
            ctx,
            habit_id=habit_id,
            notes=notes,
            mood=mood
        )

        # Get updated streak
        streak = await backend.calculate_streak(ctx, habit_id)

        # Get habit name
        habit = await ctx.storage.find_one("habits", {"id": habit_id})

        return {
            "success": True,
            "message": f"Logged completion of {habit['name']}! 🎉",
            "current_streak": streak,
            "log_id": log["id"]
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


async def get_habit_stats(
    ctx: PlatformContext,
    period: str = "week"
) -> Dict[str, Any]:
    """
    Get statistics and insights about habit performance.

    Args:
        ctx: Platform context
        period: Time period (week, month, year)

    Returns:
        Statistics dictionary
    """
    try:
        stats = await backend.get_stats(ctx, period=period)

        return {
            "success": True,
            "period": stats["period"],
            "total_habits": stats["total_habits"],
            "total_completions": stats["total_completions"],
            "completion_rate": stats["completion_rate"],
            "completed_today": stats["completed_today"],
            "pending_today": stats["pending_today"]
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


async def view_habit_history(
    ctx: PlatformContext,
    habit_id: str,
    limit: int = 10
) -> Dict[str, Any]:
    """
    View completion history for a specific habit.

    Args:
        ctx: Platform context
        habit_id: Habit ID
        limit: Number of recent entries

    Returns:
        History list
    """
    try:
        logs = await backend.get_logs_for_habit(
            ctx,
            habit_id=habit_id,
            limit=limit
        )

        # Get habit name
        habit = await ctx.storage.find_one("habits", {"id": habit_id})

        if not habit:
            return {
                "success": False,
                "error": "Habit not found"
            }

        # Format logs
        history = []
        for log in logs:
            history.append({
                "completed_at": log["completed_at"],
                "notes": log.get("notes", ""),
                "mood": log.get("mood", "")
            })

        return {
            "success": True,
            "habit_name": habit["name"],
            "total_entries": len(history),
            "history": history
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
