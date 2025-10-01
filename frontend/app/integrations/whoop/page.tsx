"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { useDataSources } from "@/lib/hooks/useDataSources"
import { apiClient } from "@/lib/api/client"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import { Activity, RefreshCw, TrendingUp, Moon, Zap, Calendar } from "lucide-react"

interface WhoopRecord {
  id: number
  external_id: string
  record_type: string
  data: any
  record_date: string
  created_at: string
  updated_at: string
}

// Whoop sport ID mapping - based on Whoop API documentation
const WHOOP_SPORT_NAMES: Record<number, string> = {
  [-1]: 'Auto-Detected Activity',
  0: 'Activity',
  1: 'Running',
  16: 'Baseball',
  17: 'Basketball',
  18: 'Rowing',
  22: 'Golf',
  24: 'Ice Hockey',
  27: 'Rugby',
  30: 'Soccer',
  33: 'Swimming',
  34: 'Tennis',
  36: 'Volleyball',
  39: 'Boxing',
  42: 'Dance',
  43: 'Pilates',
  44: 'Yoga',
  45: 'Weightlifting',
  48: 'Functional Fitness',
  52: 'Hiking/Rucking',
  57: 'Mountain Biking',
  59: 'Powerlifting',
  60: 'Rock Climbing',
  62: 'Triathlon',
  63: 'Walking',
  64: 'Surfing',
  65: 'Elliptical',
  66: 'Stairmaster',
  70: 'Meditation',
  71: 'Other',
  96: 'HIIT',
  97: 'Spin',
  98: 'Jiu Jitsu',
  101: 'Pickleball',
  127: 'Kickboxing',
  128: 'Stretching'
}

const getSportName = (sportId: number): string => {
  return WHOOP_SPORT_NAMES[sportId] || `Sport ${sportId}`
}

export default function WhoopDataPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { dataSources, loading: sourcesLoading, refetch: refetchSources } = useDataSources()
  const [records, setRecords] = useState<WhoopRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const whoopSource = dataSources.find(s => s.source_type === 'whoop' && s.is_active)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (whoopSource) {
      fetchRecords()
    } else {
      setLoading(false)
    }
  }, [whoopSource])

  const fetchRecords = async () => {
    if (!whoopSource) return

    setLoading(true)
    try {
      const data = await apiClient.getDataSourceRecords(whoopSource.id, 100)
      setRecords(data)
    } catch (error) {
      console.error('Failed to fetch Whoop data:', error)
      alert('Failed to load Whoop data')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!whoopSource) return

    setSyncing(true)
    try {
      await apiClient.triggerSync(whoopSource.id, true)
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

  if (!whoopSource) {
    return (
      <KrilinPageLayout
        title="WHOOP DATA"
        subtitle="Your fitness metrics"
        showBackButton={true}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Integrations", href: "/integrations" },
          { label: "Whoop" }
        ]}
      >
        <KrilinCardEnhanced title="NOT CONNECTED" variant="default" headerColor="#ff6b35">
          <div className="text-center py-12">
            <Activity size={64} className="mx-auto mb-4 text-[#594a4e]" />
            <p className="text-[#594a4e] mb-6">
              You haven't connected your Whoop account yet. Connect it to track your recovery, sleep, and workouts!
            </p>
            <KrilinButtonEnhanced
              variant="primary"
              onClick={() => router.push('/integrations')}
            >
              CONNECT WHOOP
            </KrilinButtonEnhanced>
          </div>
        </KrilinCardEnhanced>
      </KrilinPageLayout>
    )
  }

  const recoveryRecords = records.filter(r => r.record_type === 'whoop_recovery')
  const sleepRecords = records.filter(r => r.record_type === 'whoop_sleep')
  const workoutRecords = records.filter(r => r.record_type === 'whoop_workout')
  const cycleRecords = records.filter(r => r.record_type === 'whoop_cycle')

  return (
    <KrilinPageLayout
      title="WHOOP DATA"
      subtitle="Your fitness metrics"
      showBackButton={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Integrations", href: "/integrations" },
        { label: "Whoop" }
      ]}
    >
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-[#594a4e]">
          {whoopSource.last_sync_at && (
            <>Last synced: {new Date(whoopSource.last_sync_at).toLocaleString()}</>
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
        <KrilinCardEnhanced title="RECOVERY" variant="default" headerColor="#4ecdc4">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{recoveryRecords.length}</div>
            <div className="text-sm text-[#594a4e]">RECORDS</div>
          </div>
        </KrilinCardEnhanced>

        <KrilinCardEnhanced title="SLEEP" variant="default" headerColor="#95e1d3">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{sleepRecords.length}</div>
            <div className="text-sm text-[#594a4e]">RECORDS</div>
          </div>
        </KrilinCardEnhanced>

        <KrilinCardEnhanced title="WORKOUTS" variant="default" headerColor="#ff6b35">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{workoutRecords.length}</div>
            <div className="text-sm text-[#594a4e]">RECORDS</div>
          </div>
        </KrilinCardEnhanced>

        <KrilinCardEnhanced title="CYCLES" variant="default" headerColor="#ffc15e">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{cycleRecords.length}</div>
            <div className="text-sm text-[#594a4e]">RECORDS</div>
          </div>
        </KrilinCardEnhanced>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-xl text-[#594a4e]">LOADING WHOOP DATA...</div>
        </div>
      ) : records.length === 0 ? (
        <KrilinCardEnhanced title="NO DATA YET" variant="default" headerColor="#ff6b35">
          <div className="text-center py-12">
            <Activity size={64} className="mx-auto mb-4 text-[#594a4e]" />
            <p className="text-[#594a4e] mb-6">
              No Whoop data found. Click "SYNC NOW" to fetch your latest metrics!
            </p>
          </div>
        </KrilinCardEnhanced>
      ) : (
        <div className="space-y-8">
          {recoveryRecords.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-[#33272a] font-pixel mb-4 flex items-center gap-2">
                <TrendingUp size={24} />
                RECOVERY
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {recoveryRecords.map((record) => (
                  <KrilinCardEnhanced
                    key={record.id}
                    title={new Date(record.record_date).toLocaleDateString()}
                    variant="default"
                    headerColor="#4ecdc4"
                  >
                    <div className="space-y-2">
                      {record.data.score && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Recovery Score:</span>
                          <span className="text-sm">{record.data.score.recovery_score || 'N/A'}%</span>
                        </div>
                      )}
                      {record.data.score?.resting_heart_rate && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Resting HR:</span>
                          <span className="text-sm">{record.data.score.resting_heart_rate} bpm</span>
                        </div>
                      )}
                      {record.data.score?.hrv_rmssd_milli && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">HRV:</span>
                          <span className="text-sm">{record.data.score.hrv_rmssd_milli} ms</span>
                        </div>
                      )}
                    </div>
                  </KrilinCardEnhanced>
                ))}
              </div>
            </div>
          )}

          {sleepRecords.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-[#33272a] font-pixel mb-4 flex items-center gap-2">
                <Moon size={24} />
                SLEEP
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {sleepRecords.map((record) => (
                  <KrilinCardEnhanced
                    key={record.id}
                    title={new Date(record.record_date).toLocaleDateString()}
                    variant="default"
                    headerColor="#95e1d3"
                  >
                    <div className="space-y-2">
                      <div className="text-xs text-[#594a4e] mb-2">
                        {new Date(record.data.start).toLocaleString()} - {new Date(record.data.end).toLocaleTimeString()}
                      </div>

                      {record.data.score?.sleep_performance_percentage !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Sleep Performance:</span>
                          <span className="text-sm">{record.data.score.sleep_performance_percentage}%</span>
                        </div>
                      )}

                      {record.data.score?.sleep_efficiency_percentage !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Sleep Efficiency:</span>
                          <span className="text-sm">{Math.round(record.data.score.sleep_efficiency_percentage)}%</span>
                        </div>
                      )}

                      {record.data.score?.stage_summary?.total_in_bed_time_milli && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Time in Bed:</span>
                          <span className="text-sm">{Math.round(record.data.score.stage_summary.total_in_bed_time_milli / 1000 / 60 / 60 * 10) / 10}h</span>
                        </div>
                      )}

                      {record.data.score?.stage_summary?.total_awake_time_milli && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Awake Time:</span>
                          <span className="text-sm">{Math.round(record.data.score.stage_summary.total_awake_time_milli / 1000 / 60)}m</span>
                        </div>
                      )}

                      {record.data.score?.stage_summary?.total_rem_sleep_time_milli && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">REM Sleep:</span>
                          <span className="text-sm">{Math.round(record.data.score.stage_summary.total_rem_sleep_time_milli / 1000 / 60)}m</span>
                        </div>
                      )}

                      {record.data.score?.stage_summary?.total_slow_wave_sleep_time_milli && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Deep Sleep:</span>
                          <span className="text-sm">{Math.round(record.data.score.stage_summary.total_slow_wave_sleep_time_milli / 1000 / 60)}m</span>
                        </div>
                      )}

                      {record.data.score?.respiratory_rate && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Respiratory Rate:</span>
                          <span className="text-sm">{Math.round(record.data.score.respiratory_rate * 10) / 10} bpm</span>
                        </div>
                      )}
                    </div>
                  </KrilinCardEnhanced>
                ))}
              </div>
            </div>
          )}

          {workoutRecords.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-[#33272a] font-pixel mb-4 flex items-center gap-2">
                <Zap size={24} />
                WORKOUTS
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {workoutRecords.map((record) => {
                  const sportName = record.data.sport_id !== undefined ? getSportName(record.data.sport_id) : 'Workout'
                  const duration = record.data.start && record.data.end
                    ? Math.round((new Date(record.data.end).getTime() - new Date(record.data.start).getTime()) / 1000 / 60)
                    : null

                  return (
                    <KrilinCardEnhanced
                      key={record.id}
                      title={sportName}
                      variant="default"
                      headerColor="#ff6b35"
                    >
                      <div className="space-y-2">
                        <div className="text-xs text-[#594a4e] mb-2">
                          {new Date(record.data.start).toLocaleString()}
                          {duration && ` • ${duration} min`}
                        </div>

                        {record.data.score?.strain !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-sm font-bold">Strain:</span>
                            <span className="text-sm">{Math.round(record.data.score.strain * 10) / 10}</span>
                          </div>
                        )}

                        {record.data.score?.average_heart_rate && (
                          <div className="flex justify-between">
                            <span className="text-sm font-bold">Avg HR:</span>
                            <span className="text-sm">{record.data.score.average_heart_rate} bpm</span>
                          </div>
                        )}

                        {record.data.score?.max_heart_rate && (
                          <div className="flex justify-between">
                            <span className="text-sm font-bold">Max HR:</span>
                            <span className="text-sm">{record.data.score.max_heart_rate} bpm</span>
                          </div>
                        )}

                        {record.data.score?.kilojoule && (
                          <div className="flex justify-between">
                            <span className="text-sm font-bold">Calories:</span>
                            <span className="text-sm">{Math.round(record.data.score.kilojoule / 4.184)} kcal</span>
                          </div>
                        )}

                        {record.data.score?.distance_meter && (
                          <div className="flex justify-between">
                            <span className="text-sm font-bold">Distance:</span>
                            <span className="text-sm">{(record.data.score.distance_meter / 1000).toFixed(2)} km</span>
                          </div>
                        )}

                        {record.data.score?.altitude_gain_meter && (
                          <div className="flex justify-between">
                            <span className="text-sm font-bold">Elevation Gain:</span>
                            <span className="text-sm">{Math.round(record.data.score.altitude_gain_meter)} m</span>
                          </div>
                        )}
                      </div>
                    </KrilinCardEnhanced>
                  )
                })}
              </div>
            </div>
          )}

          {cycleRecords.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-[#33272a] font-pixel mb-4 flex items-center gap-2">
                <Calendar size={24} />
                CYCLES
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {cycleRecords.map((record) => (
                  <KrilinCardEnhanced
                    key={record.id}
                    title={new Date(record.record_date).toLocaleDateString()}
                    variant="default"
                    headerColor="#ffc15e"
                  >
                    <div className="space-y-2">
                      {record.data.score?.strain && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Strain:</span>
                          <span className="text-sm">{record.data.score.strain}</span>
                        </div>
                      )}
                      {record.data.score?.kilojoule && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Energy:</span>
                          <span className="text-sm">{Math.round(record.data.score.kilojoule / 4.184)} kcal</span>
                        </div>
                      )}
                      {record.data.score?.average_heart_rate && (
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Avg HR:</span>
                          <span className="text-sm">{record.data.score.average_heart_rate} bpm</span>
                        </div>
                      )}
                    </div>
                  </KrilinCardEnhanced>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </KrilinPageLayout>
  )
}
