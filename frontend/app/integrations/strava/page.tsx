"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useDataSources } from "@/lib/hooks/useDataSources"
import { apiClient } from "@/lib/api/client"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Activity, RefreshCw, TrendingUp, Award, ArrowLeft } from "lucide-react"

interface StravaRecord {
  id: number
  external_id: string
  record_type: string
  data: any
  record_date: string
  created_at: string
  updated_at: string
}

export default function StravaDataPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { dataSources, loading: sourcesLoading, refetch: refetchSources } = useDataSources()
  const [records, setRecords] = useState<StravaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const stravaSource = dataSources.find(s => s.source_type === 'strava' && s.is_active)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (stravaSource) {
      fetchRecords()
    } else {
      setLoading(false)
    }
  }, [stravaSource])

  const fetchRecords = async () => {
    if (!stravaSource) return

    setLoading(true)
    try {
      const data = await apiClient.getDataSourceRecords(stravaSource.id, 100)
      setRecords(data)
    } catch (error) {
      console.error('Failed to fetch Strava data:', error)
      alert('Failed to load Strava data')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!stravaSource) return

    setSyncing(true)
    try {
      await apiClient.triggerSync(stravaSource.id, true)
      await refetchSources()
      setTimeout(fetchRecords, 2000)
      alert('Sync started!')
    } catch (error: any) {
      alert(`Sync failed: ${error.message}`)
    } finally {
      setSyncing(false)
    }
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

  if (!stravaSource) {
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
                  Strava Activities
                </h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">Your training data</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <Card.Header className="bg-[var(--primary)]">
              <Card.Title>Not Connected</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-12">
              <Activity size={64} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
              <p className="text-[var(--muted-foreground)] mb-6">
                You haven't connected your Strava account yet. Connect it to track your runs, rides, and activities!
              </p>
              <Button onClick={() => router.push('/integrations')}>
                Connect Strava
              </Button>
            </Card.Content>
          </Card>
        </main>
      </div>
    )
  }

  const totalActivities = records.length
  const totalDistance = records.reduce((sum, r) => sum + (r.data.distance || 0), 0) / 1000
  const totalMovingTime = records.reduce((sum, r) => sum + (r.data.moving_time || 0), 0) / 3600
  const totalCalories = records.reduce((sum, r) => sum + (r.data.calories || 0), 0)

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
                Strava Activities
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Your training data</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-[var(--muted-foreground)]">
            {stravaSource.last_sync_at && (
              <>Last synced: {new Date(stravaSource.last_sync_at).toLocaleString()}</>
            )}
          </div>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <Card.Header className="bg-[var(--primary)]">
              <Card.Title>Activities</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-4">
              <div className="text-4xl font-bold">{totalActivities}</div>
              <div className="text-sm text-[var(--muted-foreground)] uppercase">Total</div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header className="bg-[var(--primary)]">
              <Card.Title>Distance</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-4">
              <div className="text-4xl font-bold">{totalDistance.toFixed(1)}</div>
              <div className="text-sm text-[var(--muted-foreground)] uppercase">KM</div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header className="bg-[var(--primary)]">
              <Card.Title>Time</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-4">
              <div className="text-4xl font-bold">{totalMovingTime.toFixed(1)}</div>
              <div className="text-sm text-[var(--muted-foreground)] uppercase">Hours</div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header className="bg-[var(--primary)]">
              <Card.Title>Calories</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-4">
              <div className="text-4xl font-bold">{Math.round(totalCalories)}</div>
              <div className="text-sm text-[var(--muted-foreground)] uppercase">KCAL</div>
            </Card.Content>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-[var(--muted-foreground)] uppercase">Loading activities...</div>
          </div>
        ) : records.length === 0 ? (
          <Card>
            <Card.Header className="bg-[var(--primary)]">
              <Card.Title>No Activities Yet</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-12">
              <Activity size={64} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
              <p className="text-[var(--muted-foreground)] mb-6">
                No Strava activities found. Click "Sync Now" to fetch your latest activities!
              </p>
            </Card.Content>
          </Card>
        ) : (
          <div>
            <h2 className="text-2xl font-bold font-[var(--font-head)] mb-4 flex items-center gap-2 uppercase">
              <TrendingUp size={24} />
              Recent Activities
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {records.map((record) => {
                const duration = record.data.moving_time ? Math.round(record.data.moving_time / 60) : null
                const distance = record.data.distance ? (record.data.distance / 1000).toFixed(2) : null
                const pace = record.data.average_speed ? (1000 / 60 / record.data.average_speed).toFixed(2) : null

                return (
                  <Card key={record.id}>
                    <Card.Header className="bg-[var(--primary)]">
                      <Card.Title>{record.data.name || record.data.type || 'Activity'}</Card.Title>
                    </Card.Header>
                    <Card.Content className="space-y-2">
                      <div className="text-xs text-[var(--muted-foreground)] mb-2">
                        {new Date(record.data.start_date_local || record.record_date).toLocaleString()}
                        {duration && ` • ${duration} min`}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-2 py-1 bg-[var(--primary)] text-white text-xs rounded">
                          {record.data.sport_type || record.data.type}
                        </span>
                        {record.data.achievement_count > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--warning)] text-white text-xs rounded">
                            <Award size={12} />
                            {record.data.achievement_count}
                          </span>
                        )}
                      </div>

                      {distance && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Distance:</span>
                          <span className="text-sm">{distance} km</span>
                        </div>
                      )}

                      {record.data.total_elevation_gain && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Elevation:</span>
                          <span className="text-sm">{Math.round(record.data.total_elevation_gain)} m</span>
                        </div>
                      )}

                      {pace && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Pace:</span>
                          <span className="text-sm">{pace} min/km</span>
                        </div>
                      )}

                      {record.data.average_heartrate && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Avg HR:</span>
                          <span className="text-sm">{Math.round(record.data.average_heartrate)} bpm</span>
                        </div>
                      )}

                      {record.data.max_heartrate && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Max HR:</span>
                          <span className="text-sm">{Math.round(record.data.max_heartrate)} bpm</span>
                        </div>
                      )}

                      {record.data.average_watts && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Avg Power:</span>
                          <span className="text-sm">{Math.round(record.data.average_watts)} W</span>
                        </div>
                      )}

                      {record.data.calories && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Calories:</span>
                          <span className="text-sm">{Math.round(record.data.calories)} kcal</span>
                        </div>
                      )}

                      {record.data.kudos_count > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Kudos:</span>
                          <span className="text-sm">❤️ {record.data.kudos_count}</span>
                        </div>
                      )}
                    </Card.Content>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
