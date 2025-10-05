"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useConversations } from "@/lib/hooks/useChat"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Home, Plus, Loader2 } from "lucide-react"

export default function ChatIndexPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { conversations, loading: conversationsLoading } = useConversations({ limit: 1 })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // If user has conversations, redirect to the latest one
  useEffect(() => {
    if (!conversationsLoading && conversations.length > 0) {
      router.push(`/chat/${conversations[0].id}`)
    }
  }, [conversationsLoading, conversations, router])

  const handleCreateNewConversation = async () => {
    setCreating(true)
    try {
      const { apiClient } = await import('@/lib/api/client')
      const conversation = await apiClient.createConversation({
        title: 'New Conversation',
        agent_type: 'general_assistant'
      })
      router.push(`/chat/${conversation.id}`)
    } catch (error) {
      console.error('Failed to create conversation:', error)
      setCreating(false)
    }
  }

  if (authLoading || !user || conversationsLoading) {
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

  // If redirecting to existing conversation, show loading
  if (conversations.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="text-3xl font-[var(--font-head)] mb-4 uppercase">Loading Chat...</div>
        </div>
      </div>
    )
  }

  // Show new conversation page if no conversations exist
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <Home size={24} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
                Chat
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">AI-powered conversations</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <Card.Header className="bg-[var(--primary)]">
            <Card.Title>Start a New Conversation</Card.Title>
            <Card.Description>Create a new chat with your AI assistant</Card.Description>
          </Card.Header>
          <Card.Content className="p-12 text-center space-y-6">
            <div className="text-7xl font-[var(--font-head)] uppercase text-outlined mb-6">
              Chat
            </div>
            <p className="text-lg text-[var(--muted-foreground)] mb-8">
              Start chatting with Krilin AI - your personal assistant for goals, productivity, and more.
            </p>
            <Button
              onClick={handleCreateNewConversation}
              disabled={creating}
              size="lg"
              className="w-full sm:w-auto"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={20} />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={20} className="mr-2" />
                  Start New Chat
                </>
              )}
            </Button>
          </Card.Content>
        </Card>
      </main>
    </div>
  )
}
