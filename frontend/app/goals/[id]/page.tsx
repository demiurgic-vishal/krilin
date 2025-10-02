"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useGoal, useGoalProgress, useAddProgress, useUpdateGoal, useDeleteGoal } from "@/lib/hooks/useGoals"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Input } from "@/components/retroui/Input"
import { Target, TrendingUp, Calendar, Edit, Trash2, Plus, CheckCircle, Home, ArrowLeft } from "lucide-react"

export default function GoalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const goalId = parseInt(params.id as string)
  const { user, loading: authLoading } = useAuth()
  const { goal, loading: goalLoading, refetch } = useGoal(goalId)
  const { progress, loading: progressLoading, refetch: refetchProgress } = useGoalProgress(goalId)
  const { addProgress, loading: addingProgress } = useAddProgress()
  const { updateGoal, loading: updating } = useUpdateGoal()
  const { deleteGoal, loading: deleting } = useDeleteGoal()

  const [editMode, setEditMode] = useState(false)
  const [editedGoal, setEditedGoal] = useState<any>({})
  const [showAddProgress, setShowAddProgress] = useState(false)
  const [progressValue, setProgressValue] = useState(0)
  const [progressNotes, setProgressNotes] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (goal) {
      setEditedGoal({
        title: goal.title,
        description: goal.description || '',
        status: goal.status,
        priority: goal.priority,
        target_date: goal.target_date || ''
      })
    }
  }, [goal])

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

  if (goalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="text-xl text-[var(--muted-foreground)]">Loading goal...</div>
        </div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
              Goal Not Found
            </h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <Card.Content className="py-16 text-center">
              <p className="text-[var(--muted-foreground)] mb-6">This goal could not be found.</p>
              <Link href="/goals">
                <Button>Back to Goals</Button>
              </Link>
            </Card.Content>
          </Card>
        </main>
      </div>
    )
  }

  const handleSave = async () => {
    try {
      await updateGoal(goalId, editedGoal)
      await refetch()
      setEditMode(false)
    } catch (error) {
      console.error('Failed to update goal:', error)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteGoal(goalId)
        router.push('/goals')
      } catch (error) {
        console.error('Failed to delete goal:', error)
      }
    }
  }

  const handleAddProgress = async () => {
    try {
      await addProgress(goalId, {
        value: progressValue,
        notes: progressNotes,
        date: new Date().toISOString()
      })
      await refetch()
      await refetchProgress()
      setShowAddProgress(false)
      setProgressValue(0)
      setProgressNotes('')
    } catch (error) {
      console.error('Failed to add progress:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/goals">
                <Button variant="ghost" size="icon">
                  <ArrowLeft size={24} />
                </Button>
              </Link>
              <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
                {editMode ? 'Edit Goal' : goal.title}
              </h1>
            </div>
            {!editMode && (
              <div className="flex gap-2">
                <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                  <Edit size={16} className="mr-2" />
                  Edit
                </Button>
                <Button onClick={handleDelete} disabled={deleting} variant="destructive" size="sm">
                  <Trash2 size={16} className="mr-2" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {/* Goal Details Card */}
          <Card>
            <Card.Header className={goal.status === 'completed' ? 'bg-[var(--info)]' : 'bg-[var(--primary)]'}>
              <Card.Title>Goal Details</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              {editMode ? (
                <>
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase">Title</label>
                    <Input
                      value={editedGoal.title}
                      onChange={(e) => setEditedGoal({ ...editedGoal, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase">Description</label>
                    <textarea
                      value={editedGoal.description}
                      onChange={(e) => setEditedGoal({ ...editedGoal, description: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[2px_2px_0_0_var(--border)] focus:outline-none focus:shadow-[4px_4px_0_0_var(--border)]"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSave} disabled={updating}>
                      {updating ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button onClick={() => setEditMode(false)} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] text-xs font-bold uppercase border-2 border-[var(--border)]">
                      {goal.category}
                    </span>
                    <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-[var(--border)] ${
                      goal.priority >= 8 ? 'bg-[var(--destructive)] text-[var(--destructive-foreground)]' : 'bg-[var(--warning)] text-[var(--warning-foreground)]'
                    }`}>
                      Priority: {goal.priority}/10
                    </span>
                    {goal.status === 'completed' && (
                      <span className="px-3 py-1 bg-[var(--info)] text-[var(--info-foreground)] text-xs font-bold uppercase border-2 border-[var(--border)] flex items-center gap-1">
                        <CheckCircle size={12} />
                        Completed
                      </span>
                    )}
                  </div>

                  {goal.description && (
                    <div>
                      <div className="text-sm font-bold mb-2 uppercase">Description</div>
                      <p className="text-sm text-[var(--muted-foreground)]">{goal.description}</p>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between mb-2 text-sm font-bold">
                      <span className="uppercase">Progress</span>
                      <span>{goal.current_progress}%</span>
                    </div>
                    <div className="h-6 bg-[var(--muted)] border-2 border-[var(--border)]">
                      <div
                        className="h-full bg-[var(--success)] transition-all"
                        style={{ width: `${goal.current_progress}%` }}
                      />
                    </div>
                  </div>

                  {goal.target_date && (
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                      <Calendar size={16} />
                      <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </>
              )}
            </Card.Content>
          </Card>

          {/* Resources */}
          {goal.resources && goal.resources.length > 0 && (
            <Card>
              <Card.Header className="bg-[var(--accent)]">
                <Card.Title>Resources</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-2">
                  {goal.resources.map((resource: any, idx: number) => (
                    <div key={idx} className="p-3 border-2 border-[var(--border)] bg-[var(--muted)]">
                      <div className="font-bold text-sm">{resource.title || resource.name || `Resource ${idx + 1}`}</div>
                      {resource.url && (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          {resource.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Progress Tracking */}
          <Card>
            <Card.Header className="bg-[var(--success)]">
              <Card.Title>Progress Tracking</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <Button
                onClick={() => setShowAddProgress(!showAddProgress)}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add Progress Entry
              </Button>

              {showAddProgress && (
                <div className="p-4 border-2 border-[var(--border)] bg-[var(--muted)] space-y-3">
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase">Progress Value (0-100)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={progressValue}
                      onChange={(e) => setProgressValue(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase">Notes</label>
                    <textarea
                      value={progressNotes}
                      onChange={(e) => setProgressNotes(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[2px_2px_0_0_var(--border)] focus:outline-none focus:shadow-[4px_4px_0_0_var(--border)]"
                      placeholder="What did you accomplish?"
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleAddProgress} disabled={addingProgress}>
                    {addingProgress ? 'Saving...' : 'Save Entry'}
                  </Button>
                </div>
              )}

              {progressLoading ? (
                <div className="text-center py-4 text-sm">Loading progress...</div>
              ) : progress.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">
                  No progress entries yet. Add your first one above!
                </div>
              ) : (
                <div className="space-y-2">
                  {progress.map((entry: any) => (
                    <div key={entry.id} className="p-3 border-2 border-[var(--border)] bg-[var(--card)]">
                      <div className="flex justify-between mb-2">
                        <span className="font-bold">{entry.value}%</span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                      </div>
                      {entry.notes && <p className="text-sm">{entry.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </main>
    </div>
  )
}
