"""
Google Calendar Events App Backend.

Displays Google Calendar events in a nicely formatted view.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional


async def get_events(
    ctx: Any,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    max_results: int = 50
) -> dict[str, Any]:
    """
    Get calendar events for a date range.

    Args:
        ctx: Platform context
        start_date: Start date (ISO format)
        end_date: End date (ISO format)
        max_results: Maximum number of events

    Returns:
        Dict with events list
    """
    # Check if Google Calendar is connected
    is_connected = await ctx.integrations.is_connected("google_calendar")
    if not is_connected:
        return {
            "success": False,
            "error": "Google Calendar not connected. Please connect Google Calendar at /data-sources.",
            "events": []
        }

    # Parse dates
    if start_date:
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    else:
        start = datetime.now(timezone.utc)

    if end_date:
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    else:
        end = start + timedelta(days=7)

    # Query events from the integration using context
    try:
        # Use ctx.integrations.query() to get synced calendar events
        raw_events = await ctx.integrations.query(
            integration_id="google_calendar",
            table="events",
            where={
                "start": {"gte": start.isoformat()},
                "end": {"lte": end.isoformat()}
            },
            limit=max_results,
            order_by={"start": "asc"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": f"Failed to fetch events: {str(e)}",
            "events": []
        }

    # Format events for display
    events = []
    for event_data in raw_events:
        # Parse event data from Google Calendar API format
        start_info = event_data.get("start", {})
        end_info = event_data.get("end", {})

        events.append({
            "id": event_data.get("id"),
            "title": event_data.get("summary", "Untitled Event"),
            "description": event_data.get("description"),
            "start": start_info.get("dateTime") or start_info.get("date"),
            "end": end_info.get("dateTime") or end_info.get("date"),
            "location": event_data.get("location"),
            "attendees": [
                {
                    "email": attendee.get("email"),
                    "name": attendee.get("displayName"),
                    "status": attendee.get("responseStatus")
                }
                for attendee in event_data.get("attendees", [])
            ] if event_data.get("attendees") else [],
            "organizer": {
                "email": event_data.get("organizer", {}).get("email"),
                "name": event_data.get("organizer", {}).get("displayName"),
                "is_self": event_data.get("organizer", {}).get("self", False)
            } if event_data.get("organizer") else None,
            "html_link": event_data.get("htmlLink"),
            "status": event_data.get("status"),
            "color_id": event_data.get("colorId"),
            "is_all_day": "date" in start_info,
            "created": event_data.get("created"),
            "updated": event_data.get("updated"),
            "conference_data": event_data.get("conferenceData"),
            "hangout_link": event_data.get("hangoutLink")
        })

    return {
        "success": True,
        "events": events,
        "count": len(events),
        "start_date": start.isoformat(),
        "end_date": end.isoformat()
    }


async def get_today_events(ctx: Any) -> dict[str, Any]:
    """
    Get all events for today.

    Args:
        ctx: Platform context

    Returns:
        Dict with today's events
    """
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)

    return await get_events(
        ctx,
        start_date=today.isoformat(),
        end_date=tomorrow.isoformat(),
        max_results=100
    )


async def get_next_event(ctx: Any) -> dict[str, Any]:
    """
    Get the next upcoming event.

    Args:
        ctx: Platform context

    Returns:
        Dict with next event or None
    """
    now = datetime.now(timezone.utc)
    end = now + timedelta(days=30)

    result = await get_events(
        ctx,
        start_date=now.isoformat(),
        end_date=end.isoformat(),
        max_results=1
    )

    if result.get("success") and result.get("events"):
        return {
            "success": True,
            "event": result["events"][0]
        }

    return {
        "success": True,
        "event": None,
        "message": "No upcoming events found in the next 30 days"
    }


async def search_events(ctx: Any, query: str) -> dict[str, Any]:
    """
    Search for events by keyword.

    Args:
        ctx: Platform context
        query: Search query

    Returns:
        Dict with matching events
    """
    # Check if Google Calendar is connected
    calendar_integration = ctx.integrations.get("google_calendar")
    if not calendar_integration:
        return {
            "success": False,
            "error": "Google Calendar not connected",
            "events": []
        }

    # Search events using the integration
    try:
        raw_events = await calendar_integration.query(
            record_type="event",
            search=query,
            limit=50,
            order_by="record_date"
        )
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to search events: {str(e)}",
            "events": []
        }

    # Format events
    events = []
    for event in raw_events:
        event_data = event.get("data", {})
        start_info = event_data.get("start", {})
        end_info = event_data.get("end", {})

        events.append({
            "id": event_data.get("id"),
            "title": event_data.get("summary", "Untitled Event"),
            "description": event_data.get("description"),
            "start": start_info.get("dateTime") or start_info.get("date"),
            "end": end_info.get("dateTime") or end_info.get("date"),
            "location": event_data.get("location"),
            "is_all_day": "date" in start_info
        })

    return {
        "success": True,
        "events": events,
        "count": len(events),
        "query": query
    }


# Export action handlers
ACTIONS = {
    "get_events": get_events,
    "get_today_events": get_today_events,
    "get_next_event": get_next_event,
    "search_events": search_events
}
