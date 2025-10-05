"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { useGoals } from "@/lib/hooks/useGoals"
import { useConversations } from "@/lib/hooks/useChat"
import { Card } from "@/components/retroui/Card"
import { Button } from "@/components/retroui/Button"
import { MessageSquare, Target, Zap, Settings, TrendingUp, Activity, Home, Sparkles, Users, Globe, Database } from "lucide-react"
import ReactMarkdown from "react-markdown"

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
              <div>
                <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
                  Dashboard
                </h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">Your command center</p>
              </div>
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

          <div className="border-2 border-[var(--border)] bg-[var(--warning)] p-6 shadow-[4px_4px_0_0_var(--border)]">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <Link href="/apps">
              <Button variant="warning" className="w-full h-16">
                <Sparkles size={20} className="mr-2" />
                Apps
              </Button>
            </Link>
            <Link href="/data-sources">
              <Button variant="info" className="w-full h-16">
                <Database size={20} className="mr-2" />
                Data Sources
              </Button>
            </Link>
            <Link href="/integrations">
              <Button variant="accent" className="w-full h-16">
                <Globe size={20} className="mr-2" />
                Integrations
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full h-16">
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
                <div className="space-y-6">
                  {conversations.map((convo) => (
                    <Link href={`/chat/${convo.id}`} key={convo.id}>
                      <div className="p-5 border-2 border-[var(--border)] bg-[var(--card)] hover:shadow-[6px_6px_0_0_var(--border)] transition-all hover:translate-x-[-3px] hover:translate-y-[-3px] cursor-pointer group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="font-bold text-base">
                            {convo.title}
                          </div>
                          <MessageSquare size={18} className="opacity-40 group-hover:opacity-100 group-hover:text-[var(--primary)] transition-all flex-shrink-0 ml-2" />
                        </div>
                        <div className="text-sm text-[var(--muted-foreground)] line-clamp-2 prose prose-sm max-w-none mb-3 leading-relaxed">
                          {convo.messages.length > 0 ? (
                            <ReactMarkdown
                              components={{
                                code: ({ children }) => <code className="bg-[var(--muted)] px-1 border border-[var(--border)] text-xs">{children}</code>,
                                p: ({ children }) => <span>{children}</span>,
                                ul: ({ children }) => <span>{children}</span>,
                                ol: ({ children }) => <span>{children}</span>,
                                li: ({ children }) => <span>{children} </span>,
                                h1: ({ children }) => <span className="font-bold">{children}</span>,
                                h2: ({ children }) => <span className="font-bold">{children}</span>,
                                h3: ({ children }) => <span className="font-bold">{children}</span>,
                                strong: ({ children }) => <strong>{children}</strong>,
                                em: ({ children }) => <em>{children}</em>,
                                a: ({ children }) => <span>{children}</span>,
                                blockquote: ({ children }) => <span>{children}</span>,
                              }}
                            >
                              {convo.messages[convo.messages.length - 1].content.substring(0, 150)}
                            </ReactMarkdown>
                          ) : (
                            <span className="italic">No messages yet</span>
                          )}
                        </div>
                        {convo.last_message_at && (
                          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                            <span className="uppercase font-medium">
                              {new Date(convo.last_message_at).toLocaleDateString()}
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                              →
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                  <Link href="/chat">
                    <Button variant="outline" className="w-full mt-4">View All Chats</Button>
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
