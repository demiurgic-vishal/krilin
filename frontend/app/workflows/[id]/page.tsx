"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useWorkflow, useWorkflowExecutions, useUpdateWorkflow, useDeleteWorkflow, useExecuteWorkflow } from "@/lib/hooks/useWorkflows"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import { Zap, PlayCircle, Edit, Trash2, Clock, CheckCircle, XCircle } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center bg-[#fef6e4]">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#33272a] font-pixel mb-4">LOADING...</div>
        </div>
      </div>
    )
  }

  if (workflowLoading) {
    return (
      <KrilinPageLayout title="LOADING WORKFLOW...">
        <div className="text-center py-12">
          <div className="text-xl text-[#594a4e]">LOADING WORKFLOW DETAILS...</div>
        </div>
      </KrilinPageLayout>
    )
  }

  if (!workflow) {
    return (
      <KrilinPageLayout title="WORKFLOW NOT FOUND">
        <div className="text-center py-12">
          <p className="text-[#594a4e] mb-6">This workflow could not be found.</p>
          <Link href="/workflows">
            <KrilinButtonEnhanced variant="primary">BACK TO WORKFLOWS</KrilinButtonEnhanced>
          </Link>
        </div>
      </KrilinPageLayout>
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
    <KrilinPageLayout title={workflow.name} showBackButton={true} breadcrumbs={[{ label: "Home", href: "/" }, { label: "Workflows", href: "/workflows" }, { label: workflow.name }]}>
      <div className="space-y-6">
        <KrilinCardEnhanced title="WORKFLOW DETAILS" variant="default" headerColor={workflow.is_active ? '#4ecdc4' : '#95e1d3'}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <span className={`px-3 py-1 text-xs font-bold ${workflow.is_active ? 'bg-[#4ecdc4] text-white' : 'bg-[#95e1d3] text-[#33272a]'}`}>{workflow.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
            {workflow.description && (
              <div>
                <span className="font-bold">DESCRIPTION</span>
                <p className="text-sm text-[#594a4e] mt-2">{workflow.description}</p>
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
            <div className="pt-4 border-t-2 border-[#33272a]/20 flex flex-wrap gap-2">
              <KrilinButtonEnhanced variant="primary" onClick={handleExecute} disabled={executing} className="gap-2"><PlayCircle size={16} />{executing ? 'RUNNING...' : 'RUN NOW'}</KrilinButtonEnhanced>
              <KrilinButtonEnhanced variant="secondary" onClick={handleToggleActive} disabled={updating} className="gap-2">{workflow.is_active ? 'DEACTIVATE' : 'ACTIVATE'}</KrilinButtonEnhanced>
              <KrilinButtonEnhanced variant="secondary" onClick={handleDelete} disabled={deleting} className="gap-2 bg-red-100 hover:bg-red-200 text-red-700"><Trash2 size={16} />{deleting ? 'DELETING...' : 'DELETE'}</KrilinButtonEnhanced>
            </div>
          </div>
        </KrilinCardEnhanced>

        <KrilinCardEnhanced title="WORKFLOW STEPS" variant="default" headerColor="#ff6b35">
          {workflow.steps && workflow.steps.length > 0 ? (
            <div className="space-y-2">
              {workflow.steps.map((step: any, idx: number) => (
                <div key={idx} className="p-3 bg-[#fef6e4] border-2 border-[#33272a]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold">STEP {idx + 1}:</span>
                    <span>{step.action || step.type}</span>
                  </div>
                  {step.parameters && Object.keys(step.parameters).length > 0 && (
                    <div className="text-xs font-mono bg-white p-2 border border-[#33272a] mt-2">
                      {JSON.stringify(step.parameters, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#594a4e]">No steps defined.</p>
          )}
        </KrilinCardEnhanced>

        <KrilinCardEnhanced title="EXECUTION HISTORY" variant="default" headerColor="#ffc15e">
          {executionsLoading ? (
            <div className="text-center py-4 text-sm">Loading executions...</div>
          ) : executions.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#594a4e]">No executions yet. Run this workflow to see results here!</div>
          ) : (
            <div className="space-y-2">
              {executions.map((execution: any) => (
                <div key={execution.id} className="p-3 bg-[#fef6e4] border border-[#33272a]">
                  <div className="flex justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-bold ${execution.status === 'success' ? 'bg-green-200' : execution.status === 'failed' ? 'bg-red-200' : 'bg-yellow-200'}`}>{execution.status.toUpperCase()}</span>
                    <span className="text-xs">{new Date(execution.started_at).toLocaleString()}</span>
                  </div>
                  {execution.error_message && <p className="text-xs text-red-600">{execution.error_message}</p>}
                </div>
              ))}
            </div>
          )}
        </KrilinCardEnhanced>
      </div>
    </KrilinPageLayout>
  )
}
