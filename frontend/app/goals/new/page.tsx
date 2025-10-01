"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { useGenerateGoal, useCreateGoal } from "@/lib/hooks/useGoals"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Target } from "lucide-react"

export default function NewGoalPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { generateGoal, loading: generating } = useGenerateGoal()
  const { createGoal, loading: creating } = useCreateGoal()

  const [mode, setMode] = useState<'ai' | 'manual'>('ai')
  const [goalStatement, setGoalStatement] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState(5)
  const [targetDate, setTargetDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aiResponse, setAiResponse] = useState<any>(null)

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

  const handleAIGenerate = async () => {
    setError(null)

    if (!goalStatement.trim()) {
      setError('Please describe your goal')
      return
    }

    try {
      const response = await generateGoal(goalStatement)
      setAiResponse(response)
      // Auto-fill form with AI response
      if (response.goal) {
        setTitle(response.goal.title || '')
        setDescription(response.goal.description || '')
        setCategory(response.goal.category || '')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate goal')
    }
  }

  const handleManualCreate = async () => {
    setError(null)

    if (!title.trim()) {
      setError('Please enter a goal title')
      return
    }

    if (!category) {
      setError('Please select a category')
      return
    }

    try {
      const goal = await createGoal({
        title,
        description: description || undefined,
        category,
        priority,
        target_date: targetDate || undefined
      })

      router.push(`/goals/${goal.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create goal')
    }
  }

  const handleAICreate = async () => {
    if (!aiResponse?.goal) return

    try {
      const goal = await createGoal({
        title: aiResponse.goal.title,
        description: aiResponse.goal.description || undefined,
        category: aiResponse.goal.category,
        priority: aiResponse.goal.priority || 5,
        target_date: aiResponse.goal.target_date || undefined
      })

      router.push(`/goals/${goal.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create goal')
    }
  }

  return (
    <KrilinPageLayout
      title="CREATE NEW GOAL"
      subtitle="Let's power up your journey!"
      showBackButton={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Goals", href: "/goals" },
        { label: "New Goal" }
      ]}
    >
      {/* Mode Selection */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setMode('ai')}
          className={`flex-1 py-4 px-6 font-bold border-2 border-[#33272a] transition-all ${
            mode === 'ai'
              ? 'bg-[#ff6b35] text-white scale-105'
              : 'bg-white text-[#33272a] hover:bg-[#fef6e4]'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={20} />
            <span>AI-POWERED GOAL</span>
          </div>
          <p className="text-xs mt-1 opacity-80">
            Let AI create a complete plan for you
          </p>
        </button>

        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-4 px-6 font-bold border-2 border-[#33272a] transition-all ${
            mode === 'manual'
              ? 'bg-[#4ecdc4] text-white scale-105'
              : 'bg-white text-[#33272a] hover:bg-[#fef6e4]'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Target size={20} />
            <span>MANUAL GOAL</span>
          </div>
          <p className="text-xs mt-1 opacity-80">
            Create your goal from scratch
          </p>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border-2 border-red-400 text-red-700">
          <p className="font-bold">ERROR!</p>
          <p>{error}</p>
        </div>
      )}

      {mode === 'ai' ? (
        // AI Mode
        <div className="space-y-6">
          <KrilinCardEnhanced
            title="DESCRIBE YOUR GOAL"
            variant="default"
            headerColor="#ff6b35"
          >
            <div className="space-y-4">
              <p className="text-sm text-[#594a4e]">
                Tell me what you want to achieve, and I'll create a complete training plan for you!
              </p>

              <Textarea
                placeholder="Example: I want to be more social and make new friends..."
                value={goalStatement}
                onChange={(e) => setGoalStatement(e.target.value)}
                className="min-h-[120px] border-2 border-[#33272a] font-pixel"
                disabled={generating}
              />

              <KrilinButtonEnhanced
                variant="primary"
                onClick={handleAIGenerate}
                disabled={generating || !goalStatement.trim()}
                className="w-full gap-2"
              >
                <Sparkles size={20} />
                {generating ? 'GENERATING PLAN...' : 'GENERATE WITH AI'}
              </KrilinButtonEnhanced>
            </div>
          </KrilinCardEnhanced>

          {aiResponse && (
            <>
              <KrilinCardEnhanced
                title="AI-GENERATED PLAN"
                variant="default"
                headerColor="#4ecdc4"
              >
                <div className="space-y-4">
                  <div>
                    <Label className="font-bold">GOAL TITLE</Label>
                    <p className="text-lg">{aiResponse.goal.title}</p>
                  </div>

                  {aiResponse.goal.description && (
                    <div>
                      <Label className="font-bold">DESCRIPTION</Label>
                      <p className="text-sm text-[#594a4e]">{aiResponse.goal.description}</p>
                    </div>
                  )}

                  <div>
                    <Label className="font-bold">CATEGORY</Label>
                    <p>{aiResponse.goal.category}</p>
                  </div>

                  {aiResponse.plan && (
                    <div>
                      <Label className="font-bold">AI PLAN</Label>
                      <div className="mt-2 p-3 bg-[#fef6e4] border-2 border-[#33272a]">
                        <pre className="text-xs whitespace-pre-wrap font-pixel">
                          {JSON.stringify(aiResponse.plan, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {aiResponse.resources && aiResponse.resources.length > 0 && (
                    <div>
                      <Label className="font-bold">RESOURCES ({aiResponse.resources.length})</Label>
                      <div className="mt-2 space-y-2">
                        {aiResponse.resources.slice(0, 3).map((resource: any, idx: number) => (
                          <div key={idx} className="p-2 bg-[#fef6e4] border border-[#33272a] text-xs">
                            {resource.title || resource.name || `Resource ${idx + 1}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </KrilinCardEnhanced>

              <KrilinButtonEnhanced
                variant="primary"
                onClick={handleAICreate}
                disabled={creating}
                className="w-full"
              >
                {creating ? 'CREATING GOAL...' : 'CREATE THIS GOAL'}
              </KrilinButtonEnhanced>
            </>
          )}
        </div>
      ) : (
        // Manual Mode
        <KrilinCardEnhanced
          title="GOAL DETAILS"
          variant="default"
          headerColor="#4ecdc4"
        >
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="font-bold">GOAL TITLE *</Label>
              <Input
                id="title"
                placeholder="Enter your goal title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 border-2 border-[#33272a]"
                disabled={creating}
              />
            </div>

            <div>
              <Label htmlFor="description" className="font-bold">DESCRIPTION</Label>
              <Textarea
                id="description"
                placeholder="Describe your goal in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 min-h-[100px] border-2 border-[#33272a]"
                disabled={creating}
              />
            </div>

            <div>
              <Label htmlFor="category" className="font-bold">CATEGORY *</Label>
              <Select value={category} onValueChange={setCategory} disabled={creating}>
                <SelectTrigger className="mt-2 border-2 border-[#33272a]">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health">Health & Fitness</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="career">Career</SelectItem>
                  <SelectItem value="personal">Personal Development</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority" className="font-bold">
                PRIORITY: {priority}
              </Label>
              <input
                id="priority"
                type="range"
                min="1"
                max="10"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className="mt-2 w-full"
                disabled={creating}
              />
              <div className="flex justify-between text-xs text-[#594a4e]">
                <span>LOW (1)</span>
                <span>HIGH (10)</span>
              </div>
            </div>

            <div>
              <Label htmlFor="targetDate" className="font-bold">TARGET DATE</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="mt-2 border-2 border-[#33272a]"
                disabled={creating}
              />
            </div>

            <KrilinButtonEnhanced
              variant="primary"
              onClick={handleManualCreate}
              disabled={creating || !title.trim() || !category}
              className="w-full"
            >
              {creating ? 'CREATING GOAL...' : 'CREATE GOAL'}
            </KrilinButtonEnhanced>
          </div>
        </KrilinCardEnhanced>
      )}
    </KrilinPageLayout>
  )
}
