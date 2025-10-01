"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useWorkflows } from "@/lib/hooks/useWorkflows"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import { Plus, Zap, Clock, CheckCircle, PlayCircle, PauseCircle } from "lucide-react"

export default function WorkflowsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { workflows, loading: workflowsLoading } = useWorkflows()

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

  const activeWorkflows = workflows.filter(w => w.is_active)
  const inactiveWorkflows = workflows.filter(w => !w.is_active)

  return (
    <KrilinPageLayout
      title="WORKFLOW AUTOMATION"
      subtitle="Automate your power-ups!"
      showBackButton={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Workflows" }
      ]}
    >
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <KrilinCardEnhanced title="TOTAL" variant="default" headerColor="#ff6b35">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{workflows.length}</div>
            <div className="text-sm text-[#594a4e]">WORKFLOWS</div>
          </div>
        </KrilinCardEnhanced>

        <KrilinCardEnhanced title="ACTIVE" variant="default" headerColor="#4ecdc4">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{activeWorkflows.length}</div>
            <div className="text-sm text-[#594a4e]">RUNNING</div>
          </div>
        </KrilinCardEnhanced>

        <KrilinCardEnhanced title="INACTIVE" variant="default" headerColor="#95e1d3">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#33272a]">{inactiveWorkflows.length}</div>
            <div className="text-sm text-[#594a4e]">PAUSED</div>
          </div>
        </KrilinCardEnhanced>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-[#33272a] font-pixel">YOUR WORKFLOWS</h2>
        <Link href="/workflows/new">
          <KrilinButtonEnhanced variant="primary" className="gap-2">
            <Plus size={20} />
            CREATE WORKFLOW
          </KrilinButtonEnhanced>
        </Link>
      </div>

      {workflowsLoading ? (
        <div className="text-center py-12">
          <div className="text-xl text-[#594a4e]">LOADING WORKFLOWS...</div>
        </div>
      ) : workflows.length === 0 ? (
        <KrilinCardEnhanced title="NO WORKFLOWS YET" variant="default" headerColor="#ff6b35">
          <div className="text-center py-12">
            <Zap size={64} className="mx-auto mb-4 text-[#594a4e]" />
            <p className="text-[#594a4e] mb-6">
              You haven't created any workflows yet. Start automating your tasks!
            </p>
            <Link href="/workflows/new">
              <KrilinButtonEnhanced variant="primary" className="gap-2">
                <Plus size={20} />
                CREATE YOUR FIRST WORKFLOW
              </KrilinButtonEnhanced>
            </Link>
          </div>
        </KrilinCardEnhanced>
      ) : (
        <div className="grid gap-6">
          {workflows.map((workflow) => (
            <Link href={`/workflows/${workflow.id}`} key={workflow.id}>
              <KrilinCardEnhanced
                title={workflow.name}
                variant="default"
                headerColor={workflow.is_active ? '#4ecdc4' : '#95e1d3'}
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    {workflow.is_active ? (
                      <span className="px-3 py-1 bg-[#4ecdc4] text-white text-xs font-bold flex items-center gap-1">
                        <PlayCircle size={12} />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-[#95e1d3] text-[#33272a] text-xs font-bold flex items-center gap-1">
                        <PauseCircle size={12} />
                        INACTIVE
                      </span>
                    )}
                  </div>

                  {workflow.description && (
                    <p className="text-sm text-[#594a4e]">{workflow.description}</p>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Zap size={16} className="text-[#ff6b35]" />
                    <span className="font-bold">
                      {workflow.steps?.length || 0} STEPS
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-[#594a4e]">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>Created: {new Date(workflow.created_at).toLocaleDateString()}</span>
                    </div>
                    {workflow.last_run_at && (
                      <div className="flex items-center gap-1">
                        <CheckCircle size={12} />
                        <span>Last run: {new Date(workflow.last_run_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </KrilinCardEnhanced>
            </Link>
          ))}
        </div>
      )}
    </KrilinPageLayout>
  )
}
