"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { useGoals } from "@/lib/hooks/useGoals"
import { useConversations } from "@/lib/hooks/useChat"
import { Card } from "@/components/retroui/Card"
import { Button } from "@/components/retroui/Button"
import { MessageSquare, Target, Zap, Settings, TrendingUp, Activity, Home } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { goals, loading: goalsLoading } = useGoals({ status: 'active' })
  const { conversations, loading: conversationsLoading } = useConversations({ limit: 3 })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

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

  // Calculate stats from real data
  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <Home size={24} />
                </Button>
              </Link>
              <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--muted-foreground)]">
                {user.email}
              </span>
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings size={16} className="mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="border-2 border-[var(--border)] bg-[var(--primary)] p-6 shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold mb-1">{activeGoals.length}</div>
                <div className="text-sm uppercase font-medium">Active Goals</div>
              </div>
              <Target size={48} className="opacity-50" />
            </div>
          </div>

          <div className="border-2 border-[var(--border)] bg-[var(--success)] p-6 shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold mb-1">{completedGoals.length}</div>
                <div className="text-sm uppercase font-medium">Completed</div>
              </div>
              <TrendingUp size={48} className="opacity-50" />
            </div>
          </div>

          <div className="border-2 border-[var(--border)] bg-[var(--accent)] p-6 shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold mb-1">{conversations.length}</div>
                <div className="text-sm uppercase font-medium">Conversations</div>
              </div>
              <Activity size={48} className="opacity-50" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-[var(--font-head)] mb-6 uppercase">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/chat">
              <Button variant="default" className="w-full h-16">
                <MessageSquare size={20} className="mr-2" />
                Chat
              </Button>
            </Link>
            <Link href="/goals">
              <Button variant="success" className="w-full h-16">
                <Target size={20} className="mr-2" />
                Goals
              </Button>
            </Link>
            <Link href="/workflows">
              <Button variant="accent" className="w-full h-16">
                <Zap size={20} className="mr-2" />
                Workflows
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="secondary" className="w-full h-16">
                <Settings size={20} className="mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Active Goals */}
          <Card>
            <Card.Header>
              <Card.Title>Active Goals</Card.Title>
              <Card.Description>Track your progress</Card.Description>
            </Card.Header>
            <Card.Content>
              {goalsLoading ? (
                <div className="text-center py-8 text-[var(--muted-foreground)]">Loading...</div>
              ) : activeGoals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[var(--muted-foreground)] mb-4">No active goals yet</p>
                  <Link href="/goals">
                    <Button>Create Goal</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeGoals.slice(0, 3).map((goal) => (
                    <Link href={`/goals/${goal.id}`} key={goal.id}>
                      <div className="p-4 border-2 border-[var(--border)] hover:shadow-[4px_4px_0_0_var(--border)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] cursor-pointer">
                        <div className="font-bold mb-2">{goal.title}</div>
                        <div className="flex justify-between items-center text-sm text-[var(--muted-foreground)]">
                          <span>{goal.current_progress}% complete</span>
                          {goal.target_date && (
                            <span>{new Date(goal.target_date).toLocaleDateString()}</span>
                          )}
                        </div>
                        <div className="mt-2 h-2 bg-[var(--muted)] border-2 border-[var(--border)]">
                          <div
                            className="h-full bg-[var(--success)]"
                            style={{ width: `${goal.current_progress}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                  {activeGoals.length > 3 && (
                    <Link href="/goals">
                      <Button variant="outline" className="w-full">View All Goals</Button>
                    </Link>
                  )}
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Recent Conversations */}
          <Card>
            <Card.Header>
              <Card.Title>Recent Chats</Card.Title>
              <Card.Description>Continue your conversations</Card.Description>
            </Card.Header>
            <Card.Content>
              {conversationsLoading ? (
                <div className="text-center py-8 text-[var(--muted-foreground)]">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[var(--muted-foreground)] mb-4">No conversations yet</p>
                  <Link href="/chat">
                    <Button>Start Chatting</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((convo) => (
                    <Link href={`/chat/${convo.id}`} key={convo.id}>
                      <div className="p-4 border-2 border-[var(--border)] hover:shadow-[4px_4px_0_0_var(--border)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] cursor-pointer">
                        <div className="font-bold mb-2">{convo.title}</div>
                        <div className="text-sm text-[var(--muted-foreground)] truncate">
                          {convo.messages.length > 0
                            ? convo.messages[convo.messages.length - 1].content.substring(0, 100) + '...'
                            : 'No messages yet'}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-2">
                          {convo.last_message_at
                            ? new Date(convo.last_message_at).toLocaleDateString()
                            : 'No messages'}
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Link href="/chat">
                    <Button variant="outline" className="w-full">View All Chats</Button>
                  </Link>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </main>
    </div>
  )
}
