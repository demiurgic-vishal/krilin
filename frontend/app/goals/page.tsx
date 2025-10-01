"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useGoals } from "@/lib/hooks/useGoals"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import KrilinPowerMeter from "@/components/krilin-power-meter"
import { Plus, Target, TrendingUp, CheckCircle, Clock } from "lucide-react"

export default function GoalsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const { goals, loading: goalsLoading } = useGoals(
    filter === 'all' ? {} : { status: filter }
  )

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
        </div>
      </div>
    )
  }

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')
  const pendingGoals = goals.filter(g => g.status === 'pending')

  const displayedGoals = filter === 'all'
    ? goals
    : filter === 'active'
    ? activeGoals
    : completedGoals

  return (
    <KrilinPageLayout
      title="GOAL TRAINING CENTER"
      subtitle="Track your journey to power level 9000!"
      showBackButton={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Goals" }
      ]}
    >
      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <KrilinCardEnhanced title="TOTAL" variant="default" headerColor="#ff6b35">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{goals.length}</div>
            <div className="text-sm text-[#594a4e]">GOALS</div>
          </div>
        </KrilinCardEnhanced>

        <KrilinCardEnhanced title="ACTIVE" variant="default" headerColor="#4ecdc4">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{activeGoals.length}</div>
            <div className="text-sm text-[#594a4e]">IN PROGRESS</div>
          </div>
        </KrilinCardEnhanced>

        <KrilinCardEnhanced title="COMPLETED" variant="default" headerColor="#95e1d3">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{completedGoals.length}</div>
            <div className="text-sm text-[#594a4e]">ACHIEVED</div>
          </div>
        </KrilinCardEnhanced>

        <KrilinCardEnhanced title="SUCCESS RATE" variant="default" headerColor="#ffc15e">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">
              {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
            </div>
            <div className="text-sm text-[#594a4e]">COMPLETION</div>
          </div>
        </KrilinCardEnhanced>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-bold border-2 border-[#33272a] transition-colors ${
              filter === 'all'
                ? 'bg-[#ff6b35] text-white'
                : 'bg-white text-[#33272a] hover:bg-[#fef6e4]'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 font-bold border-2 border-[#33272a] transition-colors ${
              filter === 'active'
                ? 'bg-[#4ecdc4] text-white'
                : 'bg-white text-[#33272a] hover:bg-[#fef6e4]'
            }`}
          >
            ACTIVE
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 font-bold border-2 border-[#33272a] transition-colors ${
              filter === 'completed'
                ? 'bg-[#95e1d3] text-white'
                : 'bg-white text-[#33272a] hover:bg-[#fef6e4]'
            }`}
          >
            COMPLETED
          </button>
        </div>

        <Link href="/goals/new">
          <KrilinButtonEnhanced variant="primary" className="gap-2">
            <Plus size={20} />
            CREATE NEW GOAL
          </KrilinButtonEnhanced>
        </Link>
      </div>

      {/* Goals List */}
      {goalsLoading ? (
        <div className="text-center py-12">
          <div className="text-xl text-[#594a4e]">LOADING GOALS...</div>
        </div>
      ) : displayedGoals.length === 0 ? (
        <KrilinCardEnhanced title="NO GOALS FOUND" variant="default" headerColor="#ff6b35">
          <div className="text-center py-12">
            <Target size={64} className="mx-auto mb-4 text-[#594a4e]" />
            <p className="text-[#594a4e] mb-6">
              {filter === 'all'
                ? "You haven't created any goals yet. Start your training!"
                : `No ${filter} goals found. Try a different filter.`}
            </p>
            <Link href="/goals/new">
              <KrilinButtonEnhanced variant="primary" className="gap-2">
                <Plus size={20} />
                CREATE YOUR FIRST GOAL
              </KrilinButtonEnhanced>
            </Link>
          </div>
        </KrilinCardEnhanced>
      ) : (
        <div className="grid gap-6">
          {displayedGoals.map((goal) => (
            <Link href={`/goals/${goal.id}`} key={goal.id}>
              <KrilinCardEnhanced
                title={goal.title}
                variant="default"
                headerColor={
                  goal.status === 'completed'
                    ? '#95e1d3'
                    : goal.priority >= 8
                    ? '#ff6b35'
                    : '#4ecdc4'
                }
              >
                <div className="space-y-4">
                  {/* Goal Info */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="px-3 py-1 bg-[#33272a] text-white text-xs font-bold">
                      {goal.category.toUpperCase()}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-bold ${
                        goal.priority >= 8
                          ? 'bg-[#ff6b35] text-white'
                          : goal.priority >= 5
                          ? 'bg-[#ffc15e] text-[#33272a]'
                          : 'bg-[#95e1d3] text-[#33272a]'
                      }`}
                    >
                      {goal.priority >= 8 ? 'HIGH' : goal.priority >= 5 ? 'MEDIUM' : 'LOW'} PRIORITY
                    </span>
                    {goal.status === 'completed' && (
                      <span className="px-3 py-1 bg-[#95e1d3] text-[#33272a] text-xs font-bold flex items-center gap-1">
                        <CheckCircle size={12} />
                        COMPLETED
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {goal.description && (
                    <p className="text-sm text-[#594a4e]">{goal.description}</p>
                  )}

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span>PROGRESS</span>
                      <span className="font-bold">{goal.current_progress}%</span>
                    </div>
                    <KrilinPowerMeter value={goal.current_progress} label="" />
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-[#594a4e]">
                    {goal.target_date && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {goal.created_by_agent && (
                      <div className="flex items-center gap-1">
                        <TrendingUp size={12} />
                        <span>Created by: {goal.created_by_agent}</span>
                      </div>
                    )}
                    <div>
                      Created: {new Date(goal.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Resources Preview */}
                  {goal.resources && goal.resources.length > 0 && (
                    <div className="pt-2 border-t-2 border-[#33272a]/20">
                      <div className="text-xs font-bold mb-1">RESOURCES AVAILABLE:</div>
                      <div className="flex gap-1 flex-wrap">
                        {goal.resources.slice(0, 3).map((resource: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-[#fef6e4] border border-[#33272a] text-xs"
                          >
                            {resource.title || resource.name || `Resource ${idx + 1}`}
                          </span>
                        ))}
                        {goal.resources.length > 3 && (
                          <span className="px-2 py-1 text-xs text-[#594a4e]">
                            +{goal.resources.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </KrilinCardEnhanced>
            </Link>
          ))}
        </div>
      )}
    </KrilinPageLayout>
  )
}
