"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { useDataSources } from "@/lib/hooks/useDataSources"
import { apiClient } from "@/lib/api/client"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import { Link2, CheckCircle, XCircle, RefreshCw, Calendar, Mail, Activity, CreditCard, BookOpen } from "lucide-react"

const INTEGRATION_ICONS: Record<string, any> = {
  google_calendar: Calendar,
  gmail: Mail,
  whoop: Activity,
  apple_health: Activity,
  strava: Activity,
  credit_card: CreditCard,
  news_api: BookOpen,
}

const INTEGRATION_COLORS: Record<string, string> = {
  google_calendar: "#4285F4",
  gmail: "#EA4335",
  whoop: "#FF6B35",
  apple_health: "#FF6B35",
  strava: "#FC4C02",
  credit_card: "#4ECDC4",
  news_api: "#FFC15E",
}

export default function IntegrationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { dataSources, loading: sourcesLoading, refetch } = useDataSources()
  const [connecting, setConnecting] = useState(false)

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (code && state) {
      handleOAuthCallback(code, state)
    }
  }, [searchParams])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const handleGoogleCalendarConnect = async () => {
    try {
      setConnecting(true)
      const redirectUri = `${window.location.origin}/integrations`

      const result = await apiClient.initiateGoogleCalendarOAuth(redirectUri)

      // Store which service we're connecting
      localStorage.setItem('oauth_service', 'google_calendar')

      // Redirect to Google OAuth
      window.location.href = result.authorization_url
    } catch (error) {
      console.error('Failed to initiate OAuth:', error)
      alert('Failed to start Google Calendar connection. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  const handleGmailConnect = async () => {
    try {
      setConnecting(true)
      const redirectUri = `${window.location.origin}/integrations`

      const result = await apiClient.initiateGmailOAuth(redirectUri)

      // Store which service we're connecting
      localStorage.setItem('oauth_service', 'gmail')

      // Redirect to Google OAuth
      window.location.href = result.authorization_url
    } catch (error) {
      console.error('Failed to initiate OAuth:', error)
      alert('Failed to start Gmail connection. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  const handleWhoopConnect = async () => {
    try {
      setConnecting(true)
      const redirectUri = `${window.location.origin}/integrations`

      const result = await apiClient.initiateWhoopOAuth(redirectUri)

      // Store which service we're connecting
      localStorage.setItem('oauth_service', 'whoop')

      // Redirect to Whoop OAuth
      window.location.href = result.authorization_url
    } catch (error) {
      console.error('Failed to initiate OAuth:', error)
      alert('Failed to start Whoop connection. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  const handleStravaConnect = async () => {
    try {
      setConnecting(true)
      const redirectUri = `${window.location.origin}/integrations`

      const result = await apiClient.initiateStravaOAuth(redirectUri)

      // Store which service we're connecting
      localStorage.setItem('oauth_service', 'strava')

      // Redirect to Strava OAuth
      window.location.href = result.authorization_url
    } catch (error) {
      console.error('Failed to initiate OAuth:', error)
      alert('Failed to start Strava connection. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      const redirectUri = `${window.location.origin}/integrations`
      const service = localStorage.getItem('oauth_service')

      if (service === 'gmail') {
        await apiClient.completeGmailOAuth(code, state, redirectUri)
        alert('Gmail connected successfully!')
      } else if (service === 'google_calendar') {
        await apiClient.completeGoogleCalendarOAuth(code, state, redirectUri)
        alert('Google Calendar connected successfully!')
      } else if (service === 'whoop') {
        await apiClient.completeWhoopOAuth(code, state, redirectUri)
        alert('Whoop connected successfully!')
      } else if (service === 'strava') {
        await apiClient.completeStravaOAuth(code, state, redirectUri)
        alert('Strava connected successfully!')
      } else {
        throw new Error('Unknown OAuth service')
      }

      // Clean up
      localStorage.removeItem('oauth_service')

      // Refresh data sources
      await refetch()

      // Clean up URL
      router.replace('/integrations')
    } catch (error: any) {
      console.error('OAuth callback failed:', error)
      alert(`Failed to connect: ${error.message || 'Unknown error'}`)
      localStorage.removeItem('oauth_service')
      router.replace('/integrations')
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

  const connectedSources = dataSources.filter(s => s.is_active)
  const disconnectedSources = dataSources.filter(s => !s.is_active)

  return (
    <KrilinPageLayout
      title="DATA INTEGRATIONS"
      subtitle="Connect your power sources!"
      showBackButton={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Integrations" }
      ]}
    >
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <KrilinCardEnhanced title="CONNECTED" variant="default" headerColor="#4ecdc4">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{connectedSources.length}</div>
            <div className="text-sm text-[#594a4e]">ACTIVE SOURCES</div>
          </div>
        </KrilinCardEnhanced>

        <KrilinCardEnhanced title="AVAILABLE" variant="default" headerColor="#95e1d3">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{disconnectedSources.length}</div>
            <div className="text-sm text-[#594a4e]">TO CONNECT</div>
          </div>
        </KrilinCardEnhanced>
      </div>

      <h2 className="text-2xl font-bold text-[#33272a] font-pixel mb-6">CONNECTED SOURCES</h2>

      {sourcesLoading ? (
        <div className="text-center py-12">
          <div className="text-xl text-[#594a4e]">LOADING INTEGRATIONS...</div>
        </div>
      ) : connectedSources.length === 0 ? (
        <KrilinCardEnhanced title="NO CONNECTIONS YET" variant="default" headerColor="#ff6b35">
          <div className="text-center py-12">
            <Link2 size={64} className="mx-auto mb-4 text-[#594a4e]" />
            <p className="text-[#594a4e] mb-6">
              You haven't connected any data sources yet. Connect your apps to supercharge Krilin AI!
            </p>
          </div>
        </KrilinCardEnhanced>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {connectedSources.map((source) => {
            const Icon = INTEGRATION_ICONS[source.source_type] || Link2
            const color = INTEGRATION_COLORS[source.source_type] || "#ff6b35"

            return (
              <KrilinCardEnhanced
                key={source.id}
                title={source.source_type.replace(/_/g, ' ').toUpperCase()}
                variant="default"
                headerColor={color}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: color }}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="font-bold text-sm">CONNECTED</span>
                      </div>
                      {source.last_sync_at && (
                        <p className="text-xs text-[#594a4e]">
                          Last synced: {new Date(source.last_sync_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {source.sync_status && (
                    <div className="text-xs">
                      <span className="font-bold">Status:</span> {source.sync_status}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <KrilinButtonEnhanced
                      variant="secondary"
                      className="flex-1 gap-2 text-xs py-2"
                      onClick={async () => {
                        try {
                          await apiClient.triggerSync(source.id, true)
                          await refetch()
                          alert('Sync started!')
                        } catch (error: any) {
                          alert(`Sync failed: ${error.message}`)
                        }
                      }}
                    >
                      <RefreshCw size={14} />
                      SYNC NOW
                    </KrilinButtonEnhanced>
                    <KrilinButtonEnhanced
                      variant="secondary"
                      className="flex-1 gap-2 text-xs py-2"
                      onClick={async () => {
                        if (confirm(`Disconnect ${source.source_type}?`)) {
                          try {
                            await apiClient.disconnectDataSource(source.id)
                            await refetch()
                            alert('Disconnected successfully!')
                          } catch (error: any) {
                            alert(`Failed to disconnect: ${error.message}`)
                          }
                        }
                      }}
                    >
                      <XCircle size={14} />
                      DISCONNECT
                    </KrilinButtonEnhanced>
                  </div>
                </div>
              </KrilinCardEnhanced>
            )
          })}
        </div>
      )}

      <h2 className="text-2xl font-bold text-[#33272a] font-pixel mb-6">AVAILABLE INTEGRATIONS</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {[
          { type: 'google_calendar', name: 'Google Calendar', description: 'Sync your calendar events' },
          { type: 'gmail', name: 'Gmail', description: 'Analyze emails and create tasks' },
          { type: 'whoop', name: 'Whoop', description: 'Track recovery and strain' },
          { type: 'apple_health', name: 'Apple Health', description: 'Sync health metrics' },
          { type: 'strava', name: 'Strava', description: 'Track workouts and activities' },
          { type: 'credit_card', name: 'Credit Card', description: 'Track expenses automatically' },
        ].map((integration) => {
          const isConnected = connectedSources.some(s => s.source_type === integration.type)
          if (isConnected) return null

          const Icon = INTEGRATION_ICONS[integration.type] || Link2
          const color = INTEGRATION_COLORS[integration.type] || "#ff6b35"

          return (
            <KrilinCardEnhanced
              key={integration.type}
              title={integration.name}
              variant="default"
              headerColor="#95e1d3"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center opacity-50" style={{ backgroundColor: color }}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#594a4e]">{integration.description}</p>
                  </div>
                </div>

                <KrilinButtonEnhanced
                  variant="primary"
                  className="w-full gap-2"
                  disabled={connecting}
                  onClick={async () => {
                    if (integration.type === 'google_calendar') {
                      await handleGoogleCalendarConnect()
                    } else if (integration.type === 'gmail') {
                      await handleGmailConnect()
                    } else if (integration.type === 'whoop') {
                      await handleWhoopConnect()
                    } else if (integration.type === 'strava') {
                      await handleStravaConnect()
                    } else {
                      alert(`OAuth flow for ${integration.name} coming soon!`)
                    }
                  }}
                >
                  <Link2 size={16} />
                  {connecting ? 'CONNECTING...' : 'CONNECT'}
                </KrilinButtonEnhanced>
              </div>
            </KrilinCardEnhanced>
          )
        })}
      </div>
    </KrilinPageLayout>
  )
}
