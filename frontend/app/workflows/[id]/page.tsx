"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useWorkflow, useWorkflowExecutions, useUpdateWorkflow, useDeleteWorkflow, useExecuteWorkflow } from "@/lib/hooks/useWorkflows"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Zap, PlayCircle, Edit, Trash2, Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react"

export default function WorkflowDetailPage() {
  const router = useRouter()
  const params = useParams()
  const workflowId = parseInt(params.id as string)
  const { user, loading: authLoading } = useAuth()
  const { workflow, loading: workflowLoading, refetch } = useWorkflow(workflowId)
  const { executions, loading: executionsLoading, refetch: refetchExecutions } = useWorkflowExecutions(workflowId)
  const { updateWorkflow, loading: updating } = useUpdateWorkflow()
  const { deleteWorkflow, loading: deleting } = useDeleteWorkflow()
  const { executeWorkflow, loading: executing } = useExecuteWorkflow()

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

  if (workflowLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="text-center py-12">
          <div className="text-xl text-[var(--muted-foreground)]">Loading workflow details...</div>
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="text-center py-12">
          <p className="text-[var(--muted-foreground)] mb-6">This workflow could not be found.</p>
          <Link href="/workflows">
            <Button>Back to Workflows</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleToggleActive = async () => {
    try {
      await updateWorkflow(workflowId, { is_active: !workflow.is_active })
      await refetch()
    } catch (error) {
      console.error('Failed to toggle workflow:', error)
    }
  }

  const handleExecute = async () => {
    try {
      await executeWorkflow(workflowId)
      await refetchExecutions()
    } catch (error) {
      console.error('Failed to execute workflow:', error)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        await deleteWorkflow(workflowId)
        router.push('/workflows')
      } catch (error) {
        console.error('Failed to delete workflow:', error)
      }
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
              {workflow.name}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <Card>
            <Card.Header className={workflow.is_active ? "bg-[var(--success)]" : "bg-[var(--muted)]"}>
              <Card.Title>Workflow Details</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center mb-4">
                <span className={`px-3 py-1 text-xs font-bold border-2 border-[var(--border)] ${workflow.is_active ? 'bg-[var(--success)] text-[var(--success-foreground)]' : 'bg-[var(--muted)] text-[var(--foreground)]'}`}>
                  {workflow.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              {workflow.description && (
                <div>
                  <span className="font-bold uppercase">Description</span>
                  <p className="text-sm text-[var(--muted-foreground)] mt-2">{workflow.description}</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} />
                <span>Created: {new Date(workflow.created_at).toLocaleDateString()}</span>
              </div>
              {workflow.last_run_at && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} />
                  <span>Last run: {new Date(workflow.last_run_at).toLocaleString()}</span>
                </div>
              )}
              <div className="pt-4 border-t-2 border-[var(--border)]/20 flex flex-wrap gap-2">
                <Button onClick={handleExecute} disabled={executing}>
                  <PlayCircle size={16} className="mr-2" />
                  {executing ? 'Running...' : 'Run Now'}
                </Button>
                <Button variant="secondary" onClick={handleToggleActive} disabled={updating}>
                  {workflow.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  <Trash2 size={16} className="mr-2" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header className="bg-[var(--primary)]">
              <Card.Title>Workflow Steps</Card.Title>
            </Card.Header>
            <Card.Content>
              {workflow.steps && workflow.steps.length > 0 ? (
                <div className="space-y-2">
                  {workflow.steps.map((step: any, idx: number) => (
                    <div key={idx} className="p-3 bg-[var(--muted)] border-2 border-[var(--border)]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold uppercase">Step {idx + 1}:</span>
                        <span>{step.action || step.type}</span>
                      </div>
                      {step.parameters && Object.keys(step.parameters).length > 0 && (
                        <div className="text-xs font-mono bg-[var(--background)] p-2 border border-[var(--border)] mt-2">
                          {JSON.stringify(step.parameters, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">No steps defined.</p>
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header className="bg-[var(--accent)]">
              <Card.Title>Execution History</Card.Title>
            </Card.Header>
            <Card.Content>
              {executionsLoading ? (
                <div className="text-center py-4 text-sm">Loading executions...</div>
              ) : executions.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">No executions yet. Run this workflow to see results here!</div>
              ) : (
                <div className="space-y-2">
                  {executions.map((execution: any) => (
                    <div key={execution.id} className="p-3 bg-[var(--muted)] border border-[var(--border)]">
                      <div className="flex justify-between mb-2">
                        <span className={`px-2 py-1 text-xs font-bold border-2 border-[var(--border)] ${execution.status === 'success' ? 'bg-[var(--success)] text-[var(--success-foreground)]' : execution.status === 'failed' ? 'bg-[var(--destructive)] text-[var(--destructive-foreground)]' : 'bg-[var(--warning)] text-[var(--warning-foreground)]'}`}>
                          {execution.status.toUpperCase()}
                        </span>
                        <span className="text-xs">{new Date(execution.started_at).toLocaleString()}</span>
                      </div>
                      {execution.error_message && <p className="text-xs text-[var(--destructive)]">{execution.error_message}</p>}
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
