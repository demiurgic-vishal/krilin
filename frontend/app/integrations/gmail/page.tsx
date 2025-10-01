"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { apiClient } from "@/lib/api/client"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import { Mail, RefreshCw, User, Calendar } from "lucide-react"

interface Email {
  id: number
  external_id: string
  data: {
    subject: string
    from: string
    to: string
    date: string
    snippet: string
    body: string
    labels: string[]
  }
  record_type: string
  record_date: string
  created_at: string
}

export default function GmailPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [dataSourceId, setDataSourceId] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchEmails()
    }
  }, [user, authLoading, router])

  const fetchEmails = async () => {
    setLoading(true)
    try {
      // Get Gmail data source
      const sources = await apiClient.listDataSources({ source_type: 'gmail' })
      const gmailSource = sources.find((s: any) => s.source_type === 'gmail' && s.is_active)

      if (!gmailSource) {
        setEmails([])
        setLoading(false)
        return
      }

      setDataSourceId(gmailSource.id)

      // Fetch data records
      const response = await apiClient.client.get(`/data-sources/sources/${gmailSource.id}/records`)
      setEmails(response.data)
    } catch (error: any) {
      console.error('Failed to fetch emails:', error)
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
        fetchEmails()
        setSyncing(false)
      }, 3000)
    } catch (error: any) {
      console.error('Sync failed:', error)
      setSyncing(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  const extractEmail = (emailString: string) => {
    const match = emailString.match(/<(.+)>/)
    return match ? match[1] : emailString
  }

  const extractName = (emailString: string) => {
    const match = emailString.match(/^(.+)\s*</)
    return match ? match[1].trim() : emailString.split('@')[0]
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
      title="GMAIL MESSAGES"
      subtitle="Your synced Gmail emails"
      showBackButton={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Integrations", href: "/integrations" },
        { label: "Gmail" }
      ]}
    >
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#33272a] font-pixel">
            {emails.length} EMAILS SYNCED
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
          <div className="text-xl text-[#594a4e]">LOADING EMAILS...</div>
        </div>
      ) : !dataSourceId ? (
        <KrilinCardEnhanced title="NO GMAIL CONNECTED" variant="default" headerColor="#ff6b35">
          <div className="text-center py-12">
            <Mail size={64} className="mx-auto mb-4 text-[#594a4e]" />
            <p className="text-[#594a4e] mb-6">
              You haven't connected Gmail yet.
            </p>
            <KrilinButtonEnhanced
              variant="primary"
              onClick={() => router.push('/integrations')}
            >
              GO TO INTEGRATIONS
            </KrilinButtonEnhanced>
          </div>
        </KrilinCardEnhanced>
      ) : emails.length === 0 ? (
        <KrilinCardEnhanced title="NO EMAILS FOUND" variant="default" headerColor="#4ecdc4">
          <div className="text-center py-12">
            <Mail size={64} className="mx-auto mb-4 text-[#594a4e]" />
            <p className="text-[#594a4e] mb-6">
              No emails found. Try syncing to fetch your messages.
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
          {emails.map((email) => (
            <KrilinCardEnhanced
              key={email.id}
              title={email.data.subject || "(No Subject)"}
              variant="default"
              headerColor="#ff6b35"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <User size={16} className="mt-1 text-[#ff6b35] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">
                      {extractName(email.data.from)}
                    </div>
                    <div className="text-xs text-[#594a4e] truncate">
                      {extractEmail(email.data.from)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar size={16} className="mt-1 text-[#ff6b35] flex-shrink-0" />
                  <div className="text-sm text-[#594a4e]">
                    {formatDate(email.data.date)}
                  </div>
                </div>

                {email.data.snippet && (
                  <div className="text-sm text-[#594a4e] bg-[#fef6e4] p-3 rounded border-2 border-[#33272a]">
                    {email.data.snippet}
                  </div>
                )}

                {email.data.body && email.data.body.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-[#ff6b35] font-bold hover:underline">
                      VIEW FULL MESSAGE
                    </summary>
                    <div className="mt-2 text-[#594a4e] whitespace-pre-wrap max-h-96 overflow-y-auto bg-[#fef6e4] p-3 rounded border-2 border-[#33272a]">
                      {email.data.body}
                    </div>
                  </details>
                )}

                {email.data.labels && email.data.labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {email.data.labels
                      .filter(label => !label.startsWith('CATEGORY_'))
                      .slice(0, 5)
                      .map((label, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs font-bold bg-[#95e1d3] text-[#33272a] rounded"
                        >
                          {label.replace('LABEL_', '')}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </KrilinCardEnhanced>
          ))}
        </div>
      )}
    </KrilinPageLayout>
  )
}
