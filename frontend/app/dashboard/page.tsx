"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { useGoals } from "@/lib/hooks/useGoals"
import { useConversations } from "@/lib/hooks/useChat"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import KrilinPowerMeter from "@/components/krilin-power-meter"
import { Calendar, MessageSquare, FileText, Clock, Target } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center bg-[#fef6e4]">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#33272a] font-pixel mb-4">LOADING...</div>
          <div className="w-16 h-2 bg-[#33272a] mx-auto">
            <div className="h-full bg-[#ff6b35] animate-pulse" style={{ width: '50%' }} />
          </div>
        </div>
      </div>
    )
  }

  // Calculate stats from real data
  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')
  const averageProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.current_progress, 0) / activeGoals.length)
    : 0

  return (
    <KrilinPageLayout
      title="COMMAND CENTER"
      showBackButton={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Dashboard" }
      ]}
    >
      {/* Welcome Banner */}
      <div className="mb-8 border-4 border-[#33272a] bg-gradient-to-r from-[#ff6b35] to-[#ffc15e] p-6">
        <h2 className="text-2xl font-bold text-white font-pixel mb-2">
          WELCOME BACK, {user.full_name?.toUpperCase() || 'WARRIOR'}!
        </h2>
        <p className="text-white/90">Ready to power up your day?</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <KrilinCardEnhanced 
          title="POWER STATS"
          variant="default"
          headerColor="#ff6b35"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">ACTIVE GOALS</span>
                <span className="text-sm font-bold">{activeGoals.length}</span>
              </div>
              <KrilinPowerMeter value={Math.min((activeGoals.length / 10) * 100, 100)} label="POWER" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">GOALS COMPLETED</span>
                <span className="text-sm font-bold">{completedGoals.length}/{goals.length}</span>
              </div>
              <KrilinPowerMeter 
                value={goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0} 
                label="COMPLETION" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">AVERAGE PROGRESS</span>
                <span className="text-sm font-bold">{averageProgress}%</span>
              </div>
              <KrilinPowerMeter value={averageProgress} label="EFFICIENCY" />
            </div>
          </div>
        </KrilinCardEnhanced>

        <KrilinCardEnhanced 
          title="QUICK ACTIONS"
          variant="default"
          headerColor="#4ecdc4"
        >
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Link href="/chat">
              <KrilinButtonEnhanced 
                variant="secondary" 
                className="w-full h-auto py-3 flex flex-col items-center gap-2"
              >
                <MessageSquare size={20} />
                <span>NEW CHAT</span>
              </KrilinButtonEnhanced>
            </Link>
            <Link href="/goals">
              <KrilinButtonEnhanced 
                variant="secondary" 
                className="w-full h-auto py-3 flex flex-col items-center gap-2"
              >
                <Target size={20} />
                <span>GOALS</span>
              </KrilinButtonEnhanced>
            </Link>
            <Link href="/workflows">
              <KrilinButtonEnhanced 
                variant="secondary" 
                className="w-full h-auto py-3 flex flex-col items-center gap-2"
              >
                <FileText size={20} />
                <span>WORKFLOWS</span>
              </KrilinButtonEnhanced>
            </Link>
            <Link href="/settings">
              <KrilinButtonEnhanced 
                variant="secondary" 
                className="w-full h-auto py-3 flex flex-col items-center gap-2"
              >
                <Clock size={20} />
                <span>SETTINGS</span>
              </KrilinButtonEnhanced>
            </Link>
          </div>
        </KrilinCardEnhanced>
      </div>

      {/* Active Goals and Recent Conversations Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <KrilinCardEnhanced 
          title="ACTIVE MISSIONS"
          variant="default"
          headerColor="#ff6b35"
        >
          {goalsLoading ? (
            <div className="text-center py-8">
              <div className="text-sm text-[#594a4e]">LOADING GOALS...</div>
            </div>
          ) : activeGoals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#594a4e] mb-4">NO ACTIVE GOALS YET</p>
              <Link href="/goals">
                <KrilinButtonEnhanced variant="primary">
                  CREATE YOUR FIRST GOAL
                </KrilinButtonEnhanced>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeGoals.slice(0, 4).map((goal) => (
                <Link href={`/goals/${goal.id}`} key={goal.id}>
                  <div className="border-2 border-[#33272a] p-3 hover-lift cursor-pointer">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-bold">{goal.title}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs ${
                          goal.priority >= 8 ? "bg-[#ff6b35] text-white" : "bg-[#ffc15e] text-[#33272a]"
                        }`}
                      >
                        {goal.priority >= 8 ? 'HIGH' : goal.priority >= 5 ? 'MEDIUM' : 'LOW'}
                      </span>
                    </div>
                    {goal.target_date && (
                      <p className="text-xs mb-2">
                        Target: {new Date(goal.target_date).toLocaleDateString()}
                      </p>
                    )}
                    <KrilinPowerMeter value={goal.current_progress} label="PROGRESS" />
                  </div>
                </Link>
              ))}
              {activeGoals.length > 4 && (
                <Link href="/goals">
                  <KrilinButtonEnhanced variant="primary" className="w-full">
                    VIEW ALL GOALS
                  </KrilinButtonEnhanced>
                </Link>
              )}
            </div>
          )}
        </KrilinCardEnhanced>

        <KrilinCardEnhanced 
          title="RECENT COMMUNICATIONS"
          variant="default"
          headerColor="#ffc15e"
        >
          {conversationsLoading ? (
            <div className="text-center py-8">
              <div className="text-sm text-[#594a4e]">LOADING CONVERSATIONS...</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#594a4e] mb-4">NO CONVERSATIONS YET</p>
              <Link href="/chat">
                <KrilinButtonEnhanced variant="primary">
                  START CHATTING
                </KrilinButtonEnhanced>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((convo) => (
                <Link href={`/chat/${convo.id}`} key={convo.id}>
                  <div className="border-2 border-[#33272a] p-3 cursor-pointer hover-lift">
                    <div className="flex justify-between mb-1">
                      <h3 className="font-bold">{convo.title}</h3>
                      <span className="text-xs">
                        {convo.last_message_at 
                          ? new Date(convo.last_message_at).toLocaleDateString()
                          : 'No messages'}
                      </span>
                    </div>
                    <p className="text-xs text-[#594a4e]">
                      Agent: {convo.agent_type}
                    </p>
                  </div>
                </Link>
              ))}
              <Link href="/chat">
                <KrilinButtonEnhanced variant="primary" className="w-full">
                  VIEW ALL CONVERSATIONS
                </KrilinButtonEnhanced>
              </Link>
            </div>
          )}
        </KrilinCardEnhanced>
      </div>
    </KrilinPageLayout>
  )
}
