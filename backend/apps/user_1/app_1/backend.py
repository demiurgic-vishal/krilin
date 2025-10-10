from typing import Dict, Any, List
from app.core.platform_context import PlatformContext

async def hello_world(ctx: PlatformContext) -> Dict[str, Any]:
    """Example action."""
    return {"message": "Hello from your app!"}

async def get_tomorrow_events(ctx: PlatformContext) -> Dict[str, Any]:
    """Get calendar events for the next week from connected calendar integrations."""
    from datetime import datetime, timedelta

    try:
        # Calculate next week's date range (next 7 days starting from tomorrow)
        tomorrow = datetime.now() + timedelta(days=1)
        start_of_day = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = tomorrow + timedelta(days=6)
        end_of_day = end_of_week.replace(hour=23, minute=59, second=59, microsecond=999999)

        events = []
        has_integration = False

        # Check if Google Calendar is connected
        if await ctx.integrations.is_connected('google_calendar'):
            has_integration = True

            try:
                # Query synced calendar events from data_records
                calendar_events = await ctx.integrations.query(
                    'google_calendar',
                    table='events',
                    where={
                        'start_time': {
                            'gte': start_of_day.isoformat(),
                            'lte': end_of_day.isoformat()
                        }
                    },
                    limit=50,
                    order_by={'start_time': 'asc'}
                )

                # Transform events to our format
                for idx, event in enumerate(calendar_events):
                    start_time = event.get('start_time', '')
                    end_time = event.get('end_time', '')

                    # Format time display with date
                    time_display = ""
                    date_display = ""
                    if start_time and end_time:
                        try:
                            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                            date_display = start_dt.strftime('%A, %b %d')
                            time_display = f"{start_dt.strftime('%I:%M %p')} - {end_dt.strftime('%I:%M %p')}"
                        except:
                            time_display = "All day"

                    events.append({
                        "id": event.get('id', f'event_{idx}'),
                        "title": event.get('title', event.get('summary', 'Untitled Event')),
                        "time": time_display,
                        "date": date_display,
                        "description": event.get('description', ''),
                        "type": "meeting" if 'meeting' in event.get('title', '').lower() else "event"
                    })

            except Exception as e:
                ctx.log(f"Error querying Google Calendar: {str(e)}", level="error")
                # If query fails, it might mean no data is synced yet
                pass

        # Check if Microsoft Calendar is connected
        if await ctx.integrations.is_connected('microsoft_calendar'):
            has_integration = True

            try:
                calendar_events = await ctx.integrations.query(
                    'microsoft_calendar',
                    table='events',
                    where={
                        'start_time': {
                            'gte': start_of_day.isoformat(),
                            'lte': end_of_day.isoformat()
                        }
                    },
                    limit=50,
                    order_by={'start_time': 'asc'}
                )

                # Transform Microsoft Calendar events to our format
                for idx, event in enumerate(calendar_events):
                    start_time = event.get('start_time', '')
                    end_time = event.get('end_time', '')

                    # Format time display with date
                    time_display = ""
                    date_display = ""
                    if start_time and end_time:
                        try:
                            start_dt = datetime.fromisoformat(start_time)
                            end_dt = datetime.fromisoformat(end_time)
                            date_display = start_dt.strftime('%A, %b %d')
                            time_display = f"{start_dt.strftime('%I:%M %p')} - {end_dt.strftime('%I:%M %p')}"
                        except:
                            time_display = "All day"

                    events.append({
                        "id": event.get('id', f'ms_event_{idx}'),
                        "title": event.get('subject', event.get('title', 'Untitled Event')),
                        "time": time_display,
                        "date": date_display,
                        "description": event.get('bodyPreview', event.get('description', '')),
                        "type": "meeting" if event.get('isOnlineMeeting') else "event"
                    })

            except Exception as e:
                ctx.log(f"Error querying Microsoft Calendar: {str(e)}", level="error")
                pass

        # Return results with appropriate source indicator
        source = "integration" if has_integration else "no_integration"
        return {"events": events, "source": source}

    except Exception as e:
        # If there's an error, return empty events with error message
        ctx.log(f"Error in get_tomorrow_events: {str(e)}", level="error")
        return {"events": [], "error": str(e), "source": "error"}
