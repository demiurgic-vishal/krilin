"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { useDataSources } from "@/lib/hooks/useDataSources"
import { apiClient } from "@/lib/api/client"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import { Activity, RefreshCw, TrendingUp, Award, MapPin } from "lucide-react"

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
      setTimeout(fetchRecords, 2000) // Wait for sync to complete
      alert('Sync started!')
    } catch (error: any) {
      alert(`Sync failed: ${error.message}`)
    } finally {
      setSyncing(false)
    }
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

  if (!stravaSource) {
    return (
      <KrilinPageLayout
        title="STRAVA ACTIVITIES"
        subtitle="Your training data"
        showBackButton={true}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Integrations", href: "/integrations" },
          { label: "Strava" }
        ]}
      >
        <KrilinCardEnhanced title="NOT CONNECTED" variant="default" headerColor="#fc4c02">
          <div className="text-center py-12">
            <Activity size={64} className="mx-auto mb-4 text-[#594a4e]" />
            <p className="text-[#594a4e] mb-6">
              You haven't connected your Strava account yet. Connect it to track your runs, rides, and activities!
            </p>
            <KrilinButtonEnhanced
              variant="primary"
              onClick={() => router.push('/integrations')}
            >
              CONNECT STRAVA
            </KrilinButtonEnhanced>
          </div>
        </KrilinCardEnhanced>
      </KrilinPageLayout>
    )
  }

  // Calculate statistics
  const totalActivities = records.length
  const totalDistance = records.reduce((sum, r) => sum + (r.data.distance || 0), 0) / 1000 // km
  const totalMovingTime = records.reduce((sum, r) => sum + (r.data.moving_time || 0), 0) / 3600 // hours
  const totalCalories = records.reduce((sum, r) => sum + (r.data.calories || 0), 0)

  return (
    <KrilinPageLayout
      title="STRAVA ACTIVITIES"
      subtitle="Your training data"
      showBackButton={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Integrations", href: "/integrations" },
        { label: "Strava" }
      ]}
    >
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-[#594a4e]">
          {stravaSource.last_sync_at && (
            <>Last synced: {new Date(stravaSource.last_sync_at).toLocaleString()}</>
          )}
        </div>
        <KrilinButtonEnhanced
          variant="secondary"
          className="gap-2"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'SYNCING...' : 'SYNC NOW'}
        </KrilinButtonEnhanced>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <KrilinCardEnhanced title="ACTIVITIES" variant="default" headerColor="#fc4c02">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{totalActivities}</div>
            <div className="text-sm text-[#594a4e]">TOTAL</div>
          </div>
        </KrilinCardEnhanced>

        <KrilinCardEnhanced title="DISTANCE" variant="default" headerColor="#fc4c02">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{totalDistance.toFixed(1)}</div>
            <div className="text-sm text-[#594a4e]">KM</div>
          </div>
        </KrilinCardEnhanced>

        <KrilinCardEnhanced title="TIME" variant="default" headerColor="#fc4c02">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{totalMovingTime.toFixed(1)}</div>
            <div className="text-sm text-[#594a4e]">HOURS</div>
          </div>
        </KrilinCardEnhanced>

        <KrilinCardEnhanced title="CALORIES" variant="default" headerColor="#fc4c02">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{Math.round(totalCalories)}</div>
            <div className="text-sm text-[#594a4e]">KCAL</div>
          </div>
        </KrilinCardEnhanced>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-xl text-[#594a4e]">LOADING ACTIVITIES...</div>
        </div>
      ) : records.length === 0 ? (
        <KrilinCardEnhanced title="NO ACTIVITIES YET" variant="default" headerColor="#fc4c02">
          <div className="text-center py-12">
            <Activity size={64} className="mx-auto mb-4 text-[#594a4e]" />
            <p className="text-[#594a4e] mb-6">
              No Strava activities found. Click "SYNC NOW" to fetch your latest activities!
            </p>
          </div>
        </KrilinCardEnhanced>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-[#33272a] font-pixel mb-4 flex items-center gap-2">
            <TrendingUp size={24} />
            RECENT ACTIVITIES
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {records.map((record) => {
              const duration = record.data.moving_time ? Math.round(record.data.moving_time / 60) : null
              const distance = record.data.distance ? (record.data.distance / 1000).toFixed(2) : null
              const pace = record.data.average_speed ? (1000 / 60 / record.data.average_speed).toFixed(2) : null

              return (
                <KrilinCardEnhanced
                  key={record.id}
                  title={record.data.name || record.data.type || 'Activity'}
                  variant="default"
                  headerColor="#fc4c02"
                >
                  <div className="space-y-2">
                    <div className="text-xs text-[#594a4e] mb-2">
                      {new Date(record.data.start_date_local || record.record_date).toLocaleString()}
                      {duration && ` • ${duration} min`}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block px-2 py-1 bg-[#fc4c02] text-white text-xs rounded">
                        {record.data.sport_type || record.data.type}
                      </span>
                      {record.data.achievement_count > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#ffc15e] text-[#33272a] text-xs rounded">
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
                  </div>
                </KrilinCardEnhanced>
              )
            })}
          </div>
        </div>
      )}
    </KrilinPageLayout>
  )
}
