"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useGenerateGoal, useCreateGoal } from "@/lib/hooks/useGoals"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Input } from "@/components/retroui/Input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Target, ArrowLeft } from "lucide-react"

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
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/goals">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
                Create New Goal
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Let's power up your journey!</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setMode('ai')}
              className={`p-6 border-2 border-[var(--border)] transition-all shadow-[4px_4px_0_0_var(--border)] ${
                mode === 'ai'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] scale-105'
                  : 'bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles size={20} />
                <span className="font-bold uppercase">AI-Powered Goal</span>
              </div>
              <p className="text-xs opacity-80">
                Let AI create a complete plan for you
              </p>
            </button>

            <button
              onClick={() => setMode('manual')}
              className={`p-6 border-2 border-[var(--border)] transition-all shadow-[4px_4px_0_0_var(--border)] ${
                mode === 'manual'
                  ? 'bg-[var(--success)] text-[var(--success-foreground)] scale-105'
                  : 'bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target size={20} />
                <span className="font-bold uppercase">Manual Goal</span>
              </div>
              <p className="text-xs opacity-80">
                Create your goal from scratch
              </p>
            </button>
          </div>

          {error && (
            <div className="p-4 border-2 border-[var(--destructive)] bg-[var(--destructive)]/10 text-[var(--destructive)]">
              <p className="font-bold uppercase">Error!</p>
              <p>{error}</p>
            </div>
          )}

          {mode === 'ai' ? (
            // AI Mode
            <div className="space-y-6">
              <Card>
                <Card.Header className="bg-[var(--primary)]">
                  <Card.Title>Describe Your Goal</Card.Title>
                </Card.Header>
                <Card.Content className="space-y-4">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Tell me what you want to achieve, and I'll create a complete training plan for you!
                  </p>

                  <Textarea
                    placeholder="Example: I want to be more social and make new friends..."
                    value={goalStatement}
                    onChange={(e) => setGoalStatement(e.target.value)}
                    className="min-h-[120px] border-2 border-[var(--border)] shadow-[2px_2px_0_0_var(--border)] focus:outline-none focus:shadow-[4px_4px_0_0_var(--border)]"
                    disabled={generating}
                  />

                  <Button
                    onClick={handleAIGenerate}
                    disabled={generating || !goalStatement.trim()}
                    className="w-full"
                  >
                    <Sparkles size={20} className="mr-2" />
                    {generating ? 'Generating Plan...' : 'Generate With AI'}
                  </Button>
                </Card.Content>
              </Card>

              {aiResponse && (
                <>
                  <Card>
                    <Card.Header className="bg-[var(--success)]">
                      <Card.Title>AI-Generated Plan</Card.Title>
                    </Card.Header>
                    <Card.Content className="space-y-4">
                      <div>
                        <Label className="font-bold uppercase">Goal Title</Label>
                        <p className="text-lg mt-1">{aiResponse.goal.title}</p>
                      </div>

                      {aiResponse.goal.description && (
                        <div>
                          <Label className="font-bold uppercase">Description</Label>
                          <p className="text-sm text-[var(--muted-foreground)] mt-1">{aiResponse.goal.description}</p>
                        </div>
                      )}

                      <div>
                        <Label className="font-bold uppercase">Category</Label>
                        <p className="mt-1">{aiResponse.goal.category}</p>
                      </div>

                      {aiResponse.plan && (
                        <div>
                          <Label className="font-bold uppercase">AI Plan</Label>
                          <div className="mt-2 p-3 bg-[var(--muted)] border-2 border-[var(--border)]">
                            <pre className="text-xs whitespace-pre-wrap">
                              {JSON.stringify(aiResponse.plan, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {aiResponse.resources && aiResponse.resources.length > 0 && (
                        <div>
                          <Label className="font-bold uppercase">Resources ({aiResponse.resources.length})</Label>
                          <div className="mt-2 space-y-2">
                            {aiResponse.resources.slice(0, 3).map((resource: any, idx: number) => (
                              <div key={idx} className="p-2 bg-[var(--muted)] border border-[var(--border)] text-xs">
                                {resource.title || resource.name || `Resource ${idx + 1}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card.Content>
                  </Card>

                  <Button
                    onClick={handleAICreate}
                    disabled={creating}
                    className="w-full"
                  >
                    {creating ? 'Creating Goal...' : 'Create This Goal'}
                  </Button>
                </>
              )}
            </div>
          ) : (
            // Manual Mode
            <Card>
              <Card.Header className="bg-[var(--success)]">
                <Card.Title>Goal Details</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-6">
                <div>
                  <Label htmlFor="title" className="font-bold uppercase">Goal Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter your goal title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-2"
                    disabled={creating}
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="font-bold uppercase">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your goal in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-2 min-h-[100px] border-2 border-[var(--border)] shadow-[2px_2px_0_0_var(--border)] focus:outline-none focus:shadow-[4px_4px_0_0_var(--border)]"
                    disabled={creating}
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="font-bold uppercase">Category *</Label>
                  <Select value={category} onValueChange={setCategory} disabled={creating}>
                    <SelectTrigger className="mt-2 border-2 border-[var(--border)]">
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
                  <Label htmlFor="priority" className="font-bold uppercase">
                    Priority: {priority}
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
                  <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                    <span>Low (1)</span>
                    <span>High (10)</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="targetDate" className="font-bold uppercase">Target Date</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="mt-2"
                    disabled={creating}
                  />
                </div>

                <Button
                  onClick={handleManualCreate}
                  disabled={creating || !title.trim() || !category}
                  className="w-full"
                >
                  {creating ? 'Creating Goal...' : 'Create Goal'}
                </Button>
              </Card.Content>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
