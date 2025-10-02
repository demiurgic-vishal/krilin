"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { apiClient } from "@/lib/api/client"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Calendar, Clock, MapPin, Users, RefreshCw, ArrowLeft } from "lucide-react"

interface CalendarEvent {
  id: number
  external_id: string
  data: {
    title: string
    description?: string
    start_time: string
    end_time: string
    is_all_day: boolean
    location?: string
    attendees?: Array<{ email: string; response_status: string }>
    organizer?: string
    html_link?: string
    status: string
  }
  record_type: string
  record_date: string
  created_at: string
}

export default function CalendarEventsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [dataSourceId, setDataSourceId] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchCalendarEvents()
    }
  }, [user, authLoading, router])

  const fetchCalendarEvents = async () => {
    setLoading(true)
    try {
      // First, get the Google Calendar data source
      const sources = await apiClient.listDataSources({ source_type: 'google_calendar' })
      const calendarSource = sources.find((s: any) => s.source_type === 'google_calendar' && s.is_active)

      if (!calendarSource) {
        setEvents([])
        setLoading(false)
        return
      }

      setDataSourceId(calendarSource.id)

      // Fetch data records for this source
      const response = await apiClient.client.get(`/data-sources/sources/${calendarSource.id}/records`)
      setEvents(response.data)
    } catch (error: any) {
      console.error('Failed to fetch calendar events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!dataSourceId) return

    setSyncing(true)
    try {
      await apiClient.triggerSync(dataSourceId, true)
      setTimeout(() => {
        fetchCalendarEvents()
        setSyncing(false)
      }, 3000)
    } catch (error: any) {
      console.error('Sync failed:', error)
      setSyncing(false)
    }
  }

  const formatDateTime = (dateString: string, isAllDay: boolean) => {
    if (isAllDay) {
      return new Date(dateString).toLocaleDateString()
    }
    return new Date(dateString).toLocaleString()
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="text-3xl font-[var(--font-head)] mb-4 uppercase">Loading...</div>
          <div className="w-32 h-4 bg-[var(--muted)] mx-auto border-2 border-[var(--border)]">
            <div className="h-full bg-[var(--primary)] pixel-pulse w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/integrations">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
                Calendar Events
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Your synced Google Calendar events</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold font-[var(--font-head)] uppercase">
              {events.length} Events Synced
            </h2>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncing || !dataSourceId}
            className="gap-2"
          >
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync Now"}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-[var(--muted-foreground)] uppercase">Loading events...</div>
          </div>
        ) : !dataSourceId ? (
          <Card>
            <Card.Header className="bg-[var(--primary)]">
              <Card.Title>No Calendar Connected</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-12">
              <Calendar size={64} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
              <p className="text-[var(--muted-foreground)] mb-6">
                You haven't connected Google Calendar yet.
              </p>
              <Button onClick={() => router.push('/integrations')}>
                Go to Integrations
              </Button>
            </Card.Content>
          </Card>
        ) : events.length === 0 ? (
          <Card>
            <Card.Header className="bg-[var(--success)]">
              <Card.Title>No Events Found</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-12">
              <Calendar size={64} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
              <p className="text-[var(--muted-foreground)] mb-6">
                No calendar events found. Try syncing to fetch your events.
              </p>
              <Button onClick={handleSync} disabled={syncing} className="gap-2">
                <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                Sync Now
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id}>
                <Card.Header className={event.data.is_all_day ? "bg-[var(--success)]" : "bg-[var(--primary)]"}>
                  <Card.Title>{event.data.title || "Untitled Event"}</Card.Title>
                </Card.Header>
                <Card.Content className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Clock size={16} className="mt-1 text-[var(--primary)]" />
                    <div className="flex-1">
                      <div className="text-sm font-bold">
                        {formatDateTime(event.data.start_time, event.data.is_all_day)}
                      </div>
                      {!event.data.is_all_day && (
                        <div className="text-xs text-[var(--muted-foreground)]">
                          to {formatDateTime(event.data.end_time, event.data.is_all_day)}
                        </div>
                      )}
                    </div>
                    {event.data.is_all_day && (
                      <span className="px-2 py-1 text-xs font-bold bg-[var(--success)] text-white rounded">
                        All Day
                      </span>
                    )}
                  </div>

                  {event.data.description && (
                    <div className="text-sm text-[var(--muted-foreground)]">
                      {event.data.description}
                    </div>
                  )}

                  {event.data.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-[var(--primary)]" />
                      <span className="text-[var(--muted-foreground)]">{event.data.location}</span>
                    </div>
                  )}

                  {event.data.attendees && event.data.attendees.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <Users size={16} className="mt-1 text-[var(--primary)]" />
                      <div className="flex-1">
                        <div className="font-bold mb-1">{event.data.attendees.length} Attendees</div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {event.data.attendees.slice(0, 3).map((a, i) => (
                            <div key={i}>
                              {a.email} - {a.response_status}
                            </div>
                          ))}
                          {event.data.attendees.length > 3 && (
                            <div>+{event.data.attendees.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {event.data.html_link && (
                    <div className="pt-2">
                      <a
                        href={event.data.html_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--primary)] hover:underline"
                      >
                        View in Google Calendar →
                      </a>
                    </div>
                  )}
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
