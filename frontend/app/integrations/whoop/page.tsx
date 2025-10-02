"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useDataSources } from "@/lib/hooks/useDataSources"
import { apiClient } from "@/lib/api/client"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Activity, RefreshCw, TrendingUp, Moon, Zap, Calendar, ArrowLeft } from "lucide-react"

interface WhoopRecord {
  id: number
  external_id: string
  record_type: string
  data: any
  record_date: string
  created_at: string
  updated_at: string
}

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

  if (!whoopSource) {
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
                  Whoop Data
                </h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">Your fitness metrics</p>
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
                You haven't connected your Whoop account yet. Connect it to track your recovery, sleep, and workouts!
              </p>
              <Button onClick={() => router.push('/integrations')}>
                Connect Whoop
              </Button>
            </Card.Content>
          </Card>
        </main>
      </div>
    )
  }

  const recoveryRecords = records.filter(r => r.record_type === 'whoop_recovery')
  const sleepRecords = records.filter(r => r.record_type === 'whoop_sleep')
  const workoutRecords = records.filter(r => r.record_type === 'whoop_workout')
  const cycleRecords = records.filter(r => r.record_type === 'whoop_cycle')

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
                Whoop Data
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Your fitness metrics</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-[var(--muted-foreground)]">
            {whoopSource.last_sync_at && (
              <>Last synced: {new Date(whoopSource.last_sync_at).toLocaleString()}</>
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
            <Card.Header className="bg-[var(--success)]">
              <Card.Title>Recovery</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-4">
              <div className="text-4xl font-bold">{recoveryRecords.length}</div>
              <div className="text-sm text-[var(--muted-foreground)] uppercase">Records</div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header className="bg-[var(--info)]">
              <Card.Title>Sleep</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-4">
              <div className="text-4xl font-bold">{sleepRecords.length}</div>
              <div className="text-sm text-[var(--muted-foreground)] uppercase">Records</div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header className="bg-[var(--primary)]">
              <Card.Title>Workouts</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-4">
              <div className="text-4xl font-bold">{workoutRecords.length}</div>
              <div className="text-sm text-[var(--muted-foreground)] uppercase">Records</div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header className="bg-[var(--warning)]">
              <Card.Title>Cycles</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-4">
              <div className="text-4xl font-bold">{cycleRecords.length}</div>
              <div className="text-sm text-[var(--muted-foreground)] uppercase">Records</div>
            </Card.Content>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-[var(--muted-foreground)] uppercase">Loading Whoop data...</div>
          </div>
        ) : records.length === 0 ? (
          <Card>
            <Card.Header className="bg-[var(--primary)]">
              <Card.Title>No Data Yet</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-12">
              <Activity size={64} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
              <p className="text-[var(--muted-foreground)] mb-6">
                No Whoop data found. Click "Sync Now" to fetch your latest metrics!
              </p>
            </Card.Content>
          </Card>
        ) : (
          <div className="space-y-8">
            {recoveryRecords.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold font-[var(--font-head)] mb-4 flex items-center gap-2 uppercase">
                  <TrendingUp size={24} />
                  Recovery
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {recoveryRecords.map((record) => (
                    <Card key={record.id}>
                      <Card.Header className="bg-[var(--success)]">
                        <Card.Title>{new Date(record.record_date).toLocaleDateString()}</Card.Title>
                      </Card.Header>
                      <Card.Content className="space-y-2">
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
                      </Card.Content>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {sleepRecords.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold font-[var(--font-head)] mb-4 flex items-center gap-2 uppercase">
                  <Moon size={24} />
                  Sleep
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {sleepRecords.map((record) => (
                    <Card key={record.id}>
                      <Card.Header className="bg-[var(--info)]">
                        <Card.Title>{new Date(record.record_date).toLocaleDateString()}</Card.Title>
                      </Card.Header>
                      <Card.Content className="space-y-2">
                        <div className="text-xs text-[var(--muted-foreground)] mb-2">
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
                      </Card.Content>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {workoutRecords.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold font-[var(--font-head)] mb-4 flex items-center gap-2 uppercase">
                  <Zap size={24} />
                  Workouts
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {workoutRecords.map((record) => {
                    const sportName = record.data.sport_id !== undefined ? getSportName(record.data.sport_id) : 'Workout'
                    const duration = record.data.start && record.data.end
                      ? Math.round((new Date(record.data.end).getTime() - new Date(record.data.start).getTime()) / 1000 / 60)
                      : null

                    return (
                      <Card key={record.id}>
                        <Card.Header className="bg-[var(--primary)]">
                          <Card.Title>{sportName}</Card.Title>
                        </Card.Header>
                        <Card.Content className="space-y-2">
                          <div className="text-xs text-[var(--muted-foreground)] mb-2">
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
                        </Card.Content>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {cycleRecords.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold font-[var(--font-head)] mb-4 flex items-center gap-2 uppercase">
                  <Calendar size={24} />
                  Cycles
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {cycleRecords.map((record) => (
                    <Card key={record.id}>
                      <Card.Header className="bg-[var(--warning)]">
                        <Card.Title>{new Date(record.record_date).toLocaleDateString()}</Card.Title>
                      </Card.Header>
                      <Card.Content className="space-y-2">
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
                      </Card.Content>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
