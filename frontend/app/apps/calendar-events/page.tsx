"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Home,
  RefreshCw,
  ChevronRight,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    status: string;
  }>;
  organizer?: {
    email: string;
    name?: string;
    is_self: boolean;
  };
  html_link?: string;
  status: string;
  is_all_day: boolean;
  hangout_link?: string;
  conference_data?: any;
}

interface EventsResponse {
  success: boolean;
  events: CalendarEvent[];
  count: number;
  error?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CalendarEventsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysAhead, setDaysAhead] = useState(7);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, daysAhead]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Not authenticated");

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);

      const response = await fetch(
        `${API_URL}/api/v1/apps/calendar-events/actions/get_events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            max_results: 100,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load events");
      }

      const data: EventsResponse = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to load events");
        setEvents([]);
      } else {
        setEvents(data.events || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const formatEventTime = (start: string, end: string, isAllDay: boolean) => {
    if (isAllDay) {
      return "All Day";
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const startTime = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const endTime = endDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${startTime} - ${endTime}`;
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  const groupEventsByDate = (events: CalendarEvent[]) => {
    const grouped: { [key: string]: CalendarEvent[] } = {};

    events.forEach((event) => {
      const dateKey = new Date(event.start).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="text-3xl font-[var(--font-head)] mb-4 uppercase">
            Loading...
          </div>
          <div className="w-32 h-4 bg-[var(--muted)] mx-auto border-2 border-[var(--border)]">
            <div className="h-full bg-[var(--primary)] pixel-pulse w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Object.keys(groupedEvents).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/apps">
                <Button variant="ghost" size="icon">
                  <Home size={24} />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[var(--primary)] border-2 border-[var(--border)]">
                  <Calendar size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
                    Calendar Events
                  </h1>
                  <p className="text-sm text-[var(--muted-foreground)] uppercase mt-1">
                    Your Google Calendar
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={daysAhead}
                onChange={(e) => setDaysAhead(Number(e.target.value))}
                className="px-4 py-2 border-2 border-[var(--border)] bg-[var(--card)] font-bold uppercase text-sm"
              >
                <option value={1}>Today</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
              </select>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <RefreshCw size={16} className="mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 p-4 border-2 border-[var(--border)] bg-[var(--destructive)] text-[var(--destructive-foreground)] shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {events.length === 0 && !error && (
          <Card>
            <Card.Content>
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-[var(--muted-foreground)] mb-4">
                  No events found for the selected period
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {daysAhead === 1
                    ? "You have no events scheduled for today"
                    : `No events in the next ${daysAhead} days`}
                </p>
              </div>
            </Card.Content>
          </Card>
        )}

        {events.length > 0 && (
          <div className="space-y-8">
            {sortedDates.map((dateKey) => (
              <div key={dateKey}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="px-4 py-2 bg-[var(--primary)] border-2 border-[var(--border)] shadow-[4px_4px_0_0_var(--border)]">
                    <h2 className="text-xl font-bold uppercase">
                      {formatEventDate(dateKey)}
                    </h2>
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] font-bold">
                    {groupedEvents[dateKey].length} events
                  </div>
                </div>

                <div className="space-y-4">
                  {groupedEvents[dateKey].map((event) => (
                    <div
                      key={event.id}
                      className="border-2 border-[var(--border)] bg-[var(--card)] p-6 shadow-[4px_4px_0_0_var(--border)] hover:shadow-[6px_6px_0_0_var(--border)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                    >
                      {/* Event Title and Time */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold uppercase mb-2">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                            <Clock size={16} />
                            <span className="text-sm font-bold">
                              {formatEventTime(
                                event.start,
                                event.end,
                                event.is_all_day
                              )}
                            </span>
                          </div>
                        </div>
                        {event.html_link && (
                          <a
                            href={event.html_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <ExternalLink size={16} />
                            </Button>
                          </a>
                        )}
                      </div>

                      {/* Description */}
                      {event.description && (
                        <div className="mb-4 p-3 bg-[var(--muted)] border-2 border-[var(--border)]">
                          <p className="text-sm">{event.description}</p>
                        </div>
                      )}

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin size={16} className="text-[var(--muted-foreground)]" />
                          <span className="text-sm">{event.location}</span>
                        </div>
                      )}

                      {/* Video Conference Link */}
                      {event.hangout_link && (
                        <div className="flex items-center gap-2 mb-3">
                          <Video size={16} className="text-[var(--primary)]" />
                          <a
                            href={event.hangout_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[var(--primary)] hover:underline font-bold"
                          >
                            Join Video Call
                          </a>
                        </div>
                      )}

                      {/* Attendees */}
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-start gap-2 pt-3 border-t-2 border-[var(--border)]">
                          <Users
                            size={16}
                            className="text-[var(--muted-foreground)] mt-1"
                          />
                          <div className="flex-1">
                            <div className="text-xs text-[var(--muted-foreground)] font-bold uppercase mb-2">
                              Attendees ({event.attendees.length})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {event.attendees.slice(0, 5).map((attendee, idx) => (
                                <div
                                  key={idx}
                                  className="px-2 py-1 bg-[var(--accent)] border-2 border-[var(--border)] text-xs"
                                >
                                  {attendee.name || attendee.email}
                                  {attendee.status === "declined" && (
                                    <span className="ml-1 text-[var(--destructive)]">
                                      ✗
                                    </span>
                                  )}
                                  {attendee.status === "accepted" && (
                                    <span className="ml-1 text-[var(--success)]">
                                      ✓
                                    </span>
                                  )}
                                </div>
                              ))}
                              {event.attendees.length > 5 && (
                                <div className="px-2 py-1 bg-[var(--muted)] border-2 border-[var(--border)] text-xs">
                                  +{event.attendees.length - 5} more
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
