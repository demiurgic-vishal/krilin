"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useCreateWorkflow } from "@/lib/hooks/useWorkflows"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Input } from "@/components/retroui/Input"
import { Zap, Plus, Trash2, ArrowLeft } from "lucide-react"

export default function NewWorkflowPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { createWorkflow, loading: creating } = useCreateWorkflow()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<Array<{ action: string; params: string }>>([{ action: '', params: '' }])
  const [error, setError] = useState<string | null>(null)

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

  const addStep = () => setSteps([...steps, { action: '', params: '' }])
  const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index))
  const updateStep = (index: number, field: 'action' | 'params', value: string) => {
    const newSteps = [...steps]
    newSteps[index][field] = value
    setSteps(newSteps)
  }

  const handleCreate = async () => {
    setError(null)
    if (!name.trim()) {
      setError('Please enter a workflow name')
      return
    }
    const validSteps = steps.filter(s => s.action.trim())
    if (validSteps.length === 0) {
      setError('Please add at least one step')
      return
    }
    try {
      const workflow = await createWorkflow({
        name,
        description: description || undefined,
        steps: validSteps.map(s => ({ action: s.action, parameters: s.params ? JSON.parse(s.params) : {} })),
        trigger: { type: 'manual' },
        is_active: false
      })
      router.push(`/workflows/${workflow.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create workflow')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/workflows">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
              Create New Workflow
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {error && (
            <div className="p-4 border-2 border-[var(--destructive)] bg-[var(--destructive)]/10 text-[var(--destructive)]">
              <p className="font-bold uppercase">Error!</p>
              <p>{error}</p>
            </div>
          )}

          {/* Workflow Details */}
          <Card>
            <Card.Header className="bg-[var(--success)]">
              <Card.Title>Workflow Details</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">Workflow Name *</label>
                <Input
                  placeholder="Enter workflow name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={creating}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase">Description</label>
                <textarea
                  placeholder="Describe what this workflow does..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[2px_2px_0_0_var(--border)] focus:outline-none focus:shadow-[4px_4px_0_0_var(--border)] min-h-[80px]"
                  disabled={creating}
                />
              </div>
            </Card.Content>
          </Card>

          {/* Workflow Steps */}
          <Card>
            <Card.Header className="bg-[var(--primary)]">
              <Card.Title>Workflow Steps</Card.Title>
              <Card.Description>Define the steps that will execute when this workflow runs</Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="p-4 border-2 border-[var(--border)] bg-[var(--muted)] space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold uppercase">Step {index + 1}</span>
                    {steps.length > 1 && (
                      <button
                        onClick={() => removeStep(index)}
                        className="text-[var(--destructive)] hover:opacity-70"
                        disabled={creating}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase">Action</label>
                    <Input
                      placeholder="e.g., send_email, create_task, fetch_data"
                      value={step.action}
                      onChange={(e) => updateStep(index, 'action', e.target.value)}
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase">Parameters (JSON)</label>
                    <textarea
                      placeholder='{"to": "user@example.com"}'
                      value={step.params}
                      onChange={(e) => updateStep(index, 'params', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[2px_2px_0_0_var(--border)] focus:outline-none focus:shadow-[4px_4px_0_0_var(--border)] min-h-[60px] font-mono text-xs"
                      disabled={creating}
                    />
                  </div>
                </div>
              ))}
              <Button
                onClick={addStep}
                disabled={creating}
                variant="outline"
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add Step
              </Button>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="flex-1"
            >
              <Zap size={16} className="mr-2" />
              {creating ? 'Creating Workflow...' : 'Create Workflow'}
            </Button>
            <Button
              onClick={() => router.push('/workflows')}
              disabled={creating}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
