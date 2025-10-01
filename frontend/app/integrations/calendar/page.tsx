"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { apiClient } from "@/lib/api/client"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import { Calendar, Clock, MapPin, Users, RefreshCw } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center bg-[#fef6e4]">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#33272a] font-pixel mb-4">LOADING...</div>
        </div>
      </div>
    )
  }

  return (
    <KrilinPageLayout
      title="CALENDAR EVENTS"
      subtitle="Your synced Google Calendar events"
      showBackButton={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Integrations", href: "/integrations" },
        { label: "Calendar Events" }
      ]}
    >
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#33272a] font-pixel">
            {events.length} EVENTS SYNCED
          </h2>
        </div>
        <KrilinButtonEnhanced
          variant="primary"
          onClick={handleSync}
          disabled={syncing || !dataSourceId}
          className="gap-2"
        >
          <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
          {syncing ? "SYNCING..." : "SYNC NOW"}
        </KrilinButtonEnhanced>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-xl text-[#594a4e]">LOADING EVENTS...</div>
        </div>
      ) : !dataSourceId ? (
        <KrilinCardEnhanced title="NO CALENDAR CONNECTED" variant="default" headerColor="#ff6b35">
          <div className="text-center py-12">
            <Calendar size={64} className="mx-auto mb-4 text-[#594a4e]" />
            <p className="text-[#594a4e] mb-6">
              You haven't connected Google Calendar yet.
            </p>
            <KrilinButtonEnhanced
              variant="primary"
              onClick={() => router.push('/integrations')}
            >
              GO TO INTEGRATIONS
            </KrilinButtonEnhanced>
          </div>
        </KrilinCardEnhanced>
      ) : events.length === 0 ? (
        <KrilinCardEnhanced title="NO EVENTS FOUND" variant="default" headerColor="#4ecdc4">
          <div className="text-center py-12">
            <Calendar size={64} className="mx-auto mb-4 text-[#594a4e]" />
            <p className="text-[#594a4e] mb-6">
              No calendar events found. Try syncing to fetch your events.
            </p>
            <KrilinButtonEnhanced
              variant="primary"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
              SYNC NOW
            </KrilinButtonEnhanced>
          </div>
        </KrilinCardEnhanced>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <KrilinCardEnhanced
              key={event.id}
              title={event.data.title || "Untitled Event"}
              variant="default"
              headerColor={event.data.is_all_day ? "#95e1d3" : "#4ecdc4"}
            >
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Clock size={16} className="mt-1 text-[#ff6b35]" />
                  <div className="flex-1">
                    <div className="text-sm font-bold">
                      {formatDateTime(event.data.start_time, event.data.is_all_day)}
                    </div>
                    {!event.data.is_all_day && (
                      <div className="text-xs text-[#594a4e]">
                        to {formatDateTime(event.data.end_time, event.data.is_all_day)}
                      </div>
                    )}
                  </div>
                  {event.data.is_all_day && (
                    <span className="px-2 py-1 text-xs font-bold bg-[#95e1d3] text-[#33272a] rounded">
                      ALL DAY
                    </span>
                  )}
                </div>

                {event.data.description && (
                  <div className="text-sm text-[#594a4e]">
                    {event.data.description}
                  </div>
                )}

                {event.data.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={16} className="text-[#ff6b35]" />
                    <span className="text-[#594a4e]">{event.data.location}</span>
                  </div>
                )}

                {event.data.attendees && event.data.attendees.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Users size={16} className="mt-1 text-[#ff6b35]" />
                    <div className="flex-1">
                      <div className="font-bold mb-1">{event.data.attendees.length} Attendees</div>
                      <div className="text-xs text-[#594a4e]">
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

                <div className="flex gap-2 pt-2">
                  {event.data.html_link && (
                    <a
                      href={event.data.html_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#ff6b35] hover:underline"
                    >
                      VIEW IN GOOGLE CALENDAR →
                    </a>
                  )}
                </div>
              </div>
            </KrilinCardEnhanced>
          ))}
        </div>
      )}
    </KrilinPageLayout>
  )
}
