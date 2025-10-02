"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { apiClient } from "@/lib/api/client"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Mail, RefreshCw, User, Calendar, ArrowLeft } from "lucide-react"

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
                Gmail Messages
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Your synced Gmail emails</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold font-[var(--font-head)] uppercase">
              {emails.length} Emails Synced
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
            <div className="text-xl text-[var(--muted-foreground)] uppercase">Loading emails...</div>
          </div>
        ) : !dataSourceId ? (
          <Card>
            <Card.Header className="bg-[var(--primary)]">
              <Card.Title>No Gmail Connected</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-12">
              <Mail size={64} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
              <p className="text-[var(--muted-foreground)] mb-6">
                You haven't connected Gmail yet.
              </p>
              <Button onClick={() => router.push('/integrations')}>
                Go to Integrations
              </Button>
            </Card.Content>
          </Card>
        ) : emails.length === 0 ? (
          <Card>
            <Card.Header className="bg-[var(--success)]">
              <Card.Title>No Emails Found</Card.Title>
            </Card.Header>
            <Card.Content className="text-center py-12">
              <Mail size={64} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
              <p className="text-[var(--muted-foreground)] mb-6">
                No emails found. Try syncing to fetch your messages.
              </p>
              <Button onClick={handleSync} disabled={syncing} className="gap-2">
                <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                Sync Now
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <div className="space-y-4">
            {emails.map((email) => (
              <Card key={email.id}>
                <Card.Header className="bg-[var(--primary)]">
                  <Card.Title>{email.data.subject || "(No Subject)"}</Card.Title>
                </Card.Header>
                <Card.Content className="space-y-3">
                  <div className="flex items-start gap-2">
                    <User size={16} className="mt-1 text-[var(--primary)] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">
                        {extractName(email.data.from)}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)] truncate">
                        {extractEmail(email.data.from)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar size={16} className="mt-1 text-[var(--primary)] flex-shrink-0" />
                    <div className="text-sm text-[var(--muted-foreground)]">
                      {formatDate(email.data.date)}
                    </div>
                  </div>

                  {email.data.snippet && (
                    <div className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)] p-3 rounded border-2 border-[var(--border)]">
                      {email.data.snippet}
                    </div>
                  )}

                  {email.data.body && email.data.body.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-[var(--primary)] font-bold hover:underline uppercase">
                        View Full Message
                      </summary>
                      <div className="mt-2 text-[var(--muted-foreground)] whitespace-pre-wrap max-h-96 overflow-y-auto bg-[var(--muted)] p-3 rounded border-2 border-[var(--border)]">
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
                            className="px-2 py-1 text-xs font-bold bg-[var(--success)] text-white rounded"
                          >
                            {label.replace('LABEL_', '')}
                          </span>
                        ))}
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
