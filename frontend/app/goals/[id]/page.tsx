"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useGoal, useGoalProgress, useAddProgress, useUpdateGoal, useDeleteGoal } from "@/lib/hooks/useGoals"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import KrilinPowerMeter from "@/components/krilin-power-meter"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Target, TrendingUp, Calendar, Edit, Trash2, Plus, CheckCircle } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center bg-[#fef6e4]">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#33272a] font-pixel mb-4">LOADING...</div>
        </div>
      </div>
    )
  }

  if (goalLoading) {
    return (
      <KrilinPageLayout title="LOADING GOAL...">
        <div className="text-center py-12">
          <div className="text-xl text-[#594a4e]">LOADING GOAL DETAILS...</div>
        </div>
      </KrilinPageLayout>
    )
  }

  if (!goal) {
    return (
      <KrilinPageLayout title="GOAL NOT FOUND">
        <div className="text-center py-12">
          <p className="text-[#594a4e] mb-6">This goal could not be found.</p>
          <Link href="/goals">
            <KrilinButtonEnhanced variant="primary">BACK TO GOALS</KrilinButtonEnhanced>
          </Link>
        </div>
      </KrilinPageLayout>
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
    <KrilinPageLayout
      title={editMode ? 'EDIT GOAL' : goal.title}
      showBackButton={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Goals", href: "/goals" },
        { label: goal.title }
      ]}
    >
      <div className="space-y-6">
        {/* Goal Header */}
        <KrilinCardEnhanced
          title="GOAL DETAILS"
          variant="default"
          headerColor={goal.status === 'completed' ? '#95e1d3' : '#ff6b35'}
        >
          {editMode ? (
            <div className="space-y-4">
              <div>
                <Label>TITLE</Label>
                <Input
                  value={editedGoal.title}
                  onChange={(e) => setEditedGoal({ ...editedGoal, title: e.target.value })}
                  className="mt-2 border-2 border-[#33272a]"
                />
              </div>
              <div>
                <Label>DESCRIPTION</Label>
                <Textarea
                  value={editedGoal.description}
                  onChange={(e) => setEditedGoal({ ...editedGoal, description: e.target.value })}
                  className="mt-2 border-2 border-[#33272a]"
                />
              </div>
              <div className="flex gap-4">
                <KrilinButtonEnhanced variant="primary" onClick={handleSave} disabled={updating}>
                  {updating ? 'SAVING...' : 'SAVE CHANGES'}
                </KrilinButtonEnhanced>
                <KrilinButtonEnhanced variant="secondary" onClick={() => setEditMode(false)}>
                  CANCEL
                </KrilinButtonEnhanced>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center mb-4">
                <span className="px-3 py-1 bg-[#33272a] text-white text-xs font-bold">
                  {goal.category.toUpperCase()}
                </span>
                <span className={`px-3 py-1 text-xs font-bold ${
                  goal.priority >= 8 ? 'bg-[#ff6b35] text-white' : 'bg-[#ffc15e] text-[#33272a]'
                }`}>
                  PRIORITY: {goal.priority}/10
                </span>
                {goal.status === 'completed' && (
                  <span className="px-3 py-1 bg-[#95e1d3] text-[#33272a] text-xs font-bold flex items-center gap-1">
                    <CheckCircle size={12} />
                    COMPLETED
                  </span>
                )}
              </div>

              {goal.description && (
                <div>
                  <Label className="font-bold">DESCRIPTION</Label>
                  <p className="text-sm text-[#594a4e] mt-2">{goal.description}</p>
                </div>
              )}

              <div>
                <Label className="font-bold">PROGRESS</Label>
                <div className="flex justify-between text-sm mb-2 mt-2">
                  <span>Current Progress</span>
                  <span className="font-bold">{goal.current_progress}%</span>
                </div>
                <KrilinPowerMeter value={goal.current_progress} label="" />
              </div>

              {goal.target_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} />
                  <span>Target Date: {new Date(goal.target_date).toLocaleDateString()}</span>
                </div>
              )}

              <div className="pt-4 border-t-2 border-[#33272a]/20 flex gap-2">
                <KrilinButtonEnhanced variant="secondary" onClick={() => setEditMode(true)} className="gap-2">
                  <Edit size={16} />
                  EDIT GOAL
                </KrilinButtonEnhanced>
                <KrilinButtonEnhanced 
                  variant="secondary" 
                  onClick={handleDelete} 
                  disabled={deleting}
                  className="gap-2 bg-red-100 hover:bg-red-200 text-red-700"
                >
                  <Trash2 size={16} />
                  {deleting ? 'DELETING...' : 'DELETE'}
                </KrilinButtonEnhanced>
              </div>
            </div>
          )}
        </KrilinCardEnhanced>

        {/* AI Plan */}
        {goal.ai_plan && (
          <KrilinCardEnhanced title="AI TRAINING PLAN" variant="default" headerColor="#4ecdc4">
            <div className="p-3 bg-[#fef6e4] border-2 border-[#33272a] text-sm">
              <pre className="whitespace-pre-wrap font-pixel text-xs">
                {JSON.stringify(goal.ai_plan, null, 2)}
              </pre>
            </div>
          </KrilinCardEnhanced>
        )}

        {/* Resources */}
        {goal.resources && goal.resources.length > 0 && (
          <KrilinCardEnhanced title="RESOURCES" variant="default" headerColor="#ffc15e">
            <div className="space-y-2">
              {goal.resources.map((resource: any, idx: number) => (
                <div key={idx} className="p-3 bg-[#fef6e4] border-2 border-[#33272a]">
                  <div className="font-bold text-sm">{resource.title || resource.name || `Resource ${idx + 1}`}</div>
                  {resource.url && (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                      {resource.url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </KrilinCardEnhanced>
        )}

        {/* Progress History */}
        <KrilinCardEnhanced title="PROGRESS TRACKING" variant="default" headerColor="#95e1d3">
          <div className="space-y-4">
            <KrilinButtonEnhanced 
              variant="primary" 
              onClick={() => setShowAddProgress(!showAddProgress)}
              className="gap-2 w-full"
            >
              <Plus size={16} />
              ADD PROGRESS ENTRY
            </KrilinButtonEnhanced>

            {showAddProgress && (
              <div className="p-4 bg-[#fef6e4] border-2 border-[#33272a] space-y-3">
                <div>
                  <Label>PROGRESS VALUE (0-100)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={progressValue}
                    onChange={(e) => setProgressValue(parseInt(e.target.value) || 0)}
                    className="mt-2 border-2 border-[#33272a]"
                  />
                </div>
                <div>
                  <Label>NOTES</Label>
                  <Textarea
                    value={progressNotes}
                    onChange={(e) => setProgressNotes(e.target.value)}
                    className="mt-2 border-2 border-[#33272a]"
                    placeholder="What did you accomplish?"
                  />
                </div>
                <KrilinButtonEnhanced 
                  variant="primary" 
                  onClick={handleAddProgress}
                  disabled={addingProgress}
                >
                  {addingProgress ? 'SAVING...' : 'SAVE ENTRY'}
                </KrilinButtonEnhanced>
              </div>
            )}

            {progressLoading ? (
              <div className="text-center py-4 text-sm">Loading progress...</div>
            ) : progress.length === 0 ? (
              <div className="text-center py-8 text-sm text-[#594a4e]">
                No progress entries yet. Add your first one above!
              </div>
            ) : (
              <div className="space-y-2">
                {progress.map((entry: any) => (
                  <div key={entry.id} className="p-3 bg-[#fef6e4] border border-[#33272a]">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">{entry.value}%</span>
                      <span className="text-xs text-[#594a4e]">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </div>
                    {entry.notes && <p className="text-sm">{entry.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </KrilinCardEnhanced>
      </div>
    </KrilinPageLayout>
  )
}
