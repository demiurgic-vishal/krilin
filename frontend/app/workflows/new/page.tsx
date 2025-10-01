"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { useCreateWorkflow } from "@/lib/hooks/useWorkflows"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Zap, Plus, Trash2 } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center bg-[#fef6e4]">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#33272a] font-pixel mb-4">LOADING...</div>
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
    <KrilinPageLayout title="CREATE NEW WORKFLOW" subtitle="Automate your tasks with power!" showBackButton={true} breadcrumbs={[{ label: "Home", href: "/" }, { label: "Workflows", href: "/workflows" }, { label: "New Workflow" }]}>
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-2 border-red-400 text-red-700">
          <p className="font-bold">ERROR!</p>
          <p>{error}</p>
        </div>
      )}
      <KrilinCardEnhanced title="WORKFLOW DETAILS" variant="default" headerColor="#4ecdc4">
        <div className="space-y-6">
          <div>
            <Label htmlFor="name" className="font-bold">WORKFLOW NAME *</Label>
            <Input id="name" placeholder="Enter workflow name..." value={name} onChange={(e) => setName(e.target.value)} className="mt-2 border-2 border-[#33272a]" disabled={creating} />
          </div>
          <div>
            <Label htmlFor="description" className="font-bold">DESCRIPTION</Label>
            <Textarea id="description" placeholder="Describe what this workflow does..." value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 min-h-[80px] border-2 border-[#33272a]" disabled={creating} />
          </div>
        </div>
      </KrilinCardEnhanced>
      <KrilinCardEnhanced title="WORKFLOW STEPS" variant="default" headerColor="#ff6b35">
        <div className="space-y-4">
          <p className="text-sm text-[#594a4e]">Define the steps that will execute when this workflow runs.</p>
          {steps.map((step, index) => (
            <div key={index} className="p-4 bg-[#fef6e4] border-2 border-[#33272a] space-y-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">STEP {index + 1}</span>
                {steps.length > 1 && <button onClick={() => removeStep(index)} className="text-red-600 hover:text-red-800" disabled={creating}><Trash2 size={16} /></button>}
              </div>
              <div>
                <Label>ACTION</Label>
                <Input placeholder="e.g., send_email, create_task, fetch_data" value={step.action} onChange={(e) => updateStep(index, 'action', e.target.value)} className="mt-2 border-2 border-[#33272a]" disabled={creating} />
              </div>
              <div>
                <Label>PARAMETERS (JSON)</Label>
                <Textarea placeholder='{"to": "user@example.com"}' value={step.params} onChange={(e) => updateStep(index, 'params', e.target.value)} className="mt-2 min-h-[60px] border-2 border-[#33272a] font-mono text-xs" disabled={creating} />
              </div>
            </div>
          ))}
          <KrilinButtonEnhanced variant="secondary" onClick={addStep} disabled={creating} className="w-full gap-2"><Plus size={16} />ADD STEP</KrilinButtonEnhanced>
        </div>
      </KrilinCardEnhanced>
      <div className="flex gap-4">
        <KrilinButtonEnhanced variant="primary" onClick={handleCreate} disabled={creating || !name.trim()} className="flex-1 gap-2"><Zap size={16} />{creating ? 'CREATING WORKFLOW...' : 'CREATE WORKFLOW'}</KrilinButtonEnhanced>
        <KrilinButtonEnhanced variant="secondary" onClick={() => router.push('/workflows')} disabled={creating}>CANCEL</KrilinButtonEnhanced>
      </div>
    </KrilinPageLayout>
  )
}
