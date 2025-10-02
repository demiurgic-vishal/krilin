"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useGoals } from "@/lib/hooks/useGoals"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Plus, Target, TrendingUp, CheckCircle, Clock, Home } from "lucide-react"

export default function GoalsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const { goals, loading: goalsLoading } = useGoals(
    filter === 'all' ? {} : { status: filter }
  )

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

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  const displayedGoals = filter === 'all'
    ? goals
    : filter === 'active'
    ? activeGoals
    : completedGoals

  return (
    <div className="min-h-screen bg-[var(--background)]">
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
                Goals
              </h1>
            </div>
            <Link href="/goals/new">
              <Button size="sm">
                <Plus size={16} className="mr-2" />
                New Goal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="border-2 border-[var(--border)] bg-[var(--primary)] p-6 shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold mb-1">{goals.length}</div>
                <div className="text-sm uppercase font-medium">Total</div>
              </div>
              <Target size={48} className="opacity-50" />
            </div>
          </div>

          <div className="border-2 border-[var(--border)] bg-[var(--success)] p-6 shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold mb-1">{activeGoals.length}</div>
                <div className="text-sm uppercase font-medium">Active</div>
              </div>
              <TrendingUp size={48} className="opacity-50" />
            </div>
          </div>

          <div className="border-2 border-[var(--border)] bg-[var(--info)] p-6 shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold mb-1">{completedGoals.length}</div>
                <div className="text-sm uppercase font-medium">Completed</div>
              </div>
              <CheckCircle size={48} className="opacity-50" />
            </div>
          </div>

          <div className="border-2 border-[var(--border)] bg-[var(--accent)] p-6 shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold mb-1">
                  {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
                </div>
                <div className="text-sm uppercase font-medium">Success</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
          >
            All
          </Button>
          <Button
            onClick={() => setFilter('active')}
            variant={filter === 'active' ? 'success' : 'outline'}
            size="sm"
          >
            Active
          </Button>
          <Button
            onClick={() => setFilter('completed')}
            variant={filter === 'completed' ? 'info' : 'outline'}
            size="sm"
          >
            Completed
          </Button>
        </div>

        {goalsLoading ? (
          <div className="text-center py-12">
            <div className="text-xl text-[var(--muted-foreground)]">Loading goals...</div>
          </div>
        ) : displayedGoals.length === 0 ? (
          <Card>
            <Card.Content className="py-16">
              <div className="text-center">
                <Target size={64} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
                <h3 className="text-xl font-bold mb-2">No Goals Found</h3>
                <p className="text-[var(--muted-foreground)] mb-6">
                  {filter === 'all'
                    ? "You haven't created any goals yet. Get started!"
                    : `No ${filter} goals found. Try a different filter.`}
                </p>
                <Link href="/goals/new">
                  <Button>
                    <Plus size={20} className="mr-2" />
                    Create Your First Goal
                  </Button>
                </Link>
              </div>
            </Card.Content>
          </Card>
        ) : (
          <div className="grid gap-6">
            {displayedGoals.map((goal) => (
              <Link href={`/goals/${goal.id}`} key={goal.id}>
                <Card className="transition-all hover:shadow-[8px_8px_0_0_var(--border)] hover:translate-x-[-4px] hover:translate-y-[-4px] cursor-pointer">
                  <Card.Header className={goal.status === 'completed' ? 'bg-[var(--info)]' : 'bg-[var(--primary)]'}>
                    <div className="flex justify-between items-start">
                      <Card.Title>{goal.title}</Card.Title>
                      {goal.status === 'completed' && (
                        <CheckCircle size={24} />
                      )}
                    </div>
                  </Card.Header>
                  <Card.Content className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] text-xs font-bold uppercase border-2 border-[var(--border)]">
                        {goal.category}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-bold uppercase border-2 border-[var(--border)] ${
                          goal.priority >= 8
                            ? 'bg-[var(--destructive)] text-[var(--destructive-foreground)]'
                            : goal.priority >= 5
                            ? 'bg-[var(--warning)] text-[var(--warning-foreground)]'
                            : 'bg-[var(--success)] text-[var(--success-foreground)]'
                        }`}
                      >
                        {goal.priority >= 8 ? 'High' : goal.priority >= 5 ? 'Med' : 'Low'} Priority
                      </span>
                    </div>

                    {goal.description && (
                      <p className="text-sm text-[var(--muted-foreground)]">{goal.description}</p>
                    )}

                    <div>
                      <div className="flex justify-between mb-2 text-sm font-bold">
                        <span className="uppercase">Progress</span>
                        <span>{goal.current_progress}%</span>
                      </div>
                      <div className="h-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                        <div
                          className="h-full bg-[var(--success)] transition-all"
                          style={{ width: `${goal.current_progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
                      {goal.target_date && (
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>Due: {new Date(goal.target_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div>
                        Created: {new Date(goal.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
