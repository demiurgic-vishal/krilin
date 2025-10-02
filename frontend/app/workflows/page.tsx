"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useWorkflows } from "@/lib/hooks/useWorkflows"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Plus, Zap, Clock, CheckCircle, PlayCircle, PauseCircle, Home } from "lucide-react"

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

  const activeWorkflows = workflows.filter(w => w.is_active)
  const inactiveWorkflows = workflows.filter(w => !w.is_active)

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
                Workflows
              </h1>
            </div>
            <Link href="/workflows/new">
              <Button size="sm">
                <Plus size={16} className="mr-2" />
                New Workflow
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="border-2 border-[var(--border)] bg-[var(--primary)] p-6 shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold mb-1">{workflows.length}</div>
                <div className="text-sm uppercase font-medium">Total</div>
              </div>
              <Zap size={48} className="opacity-50" />
            </div>
          </div>

          <div className="border-2 border-[var(--border)] bg-[var(--success)] p-6 shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold mb-1">{activeWorkflows.length}</div>
                <div className="text-sm uppercase font-medium">Active</div>
              </div>
              <PlayCircle size={48} className="opacity-50" />
            </div>
          </div>

          <div className="border-2 border-[var(--border)] bg-[var(--info)] p-6 shadow-[4px_4px_0_0_var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold mb-1">{inactiveWorkflows.length}</div>
                <div className="text-sm uppercase font-medium">Inactive</div>
              </div>
              <PauseCircle size={48} className="opacity-50" />
            </div>
          </div>
        </div>

        {workflowsLoading ? (
          <div className="text-center py-12">
            <div className="text-xl text-[var(--muted-foreground)]">Loading workflows...</div>
          </div>
        ) : workflows.length === 0 ? (
          <Card>
            <Card.Content className="py-16">
              <div className="text-center">
                <Zap size={64} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
                <h3 className="text-xl font-bold mb-2">No Workflows Yet</h3>
                <p className="text-[var(--muted-foreground)] mb-6">
                  You haven't created any workflows yet. Start automating your tasks!
                </p>
                <Link href="/workflows/new">
                  <Button>
                    <Plus size={20} className="mr-2" />
                    Create Your First Workflow
                  </Button>
                </Link>
              </div>
            </Card.Content>
          </Card>
        ) : (
          <div className="grid gap-6">
            {workflows.map((workflow) => (
              <Link href={`/workflows/${workflow.id}`} key={workflow.id}>
                <Card className="transition-all hover:shadow-[8px_8px_0_0_var(--border)] hover:translate-x-[-4px] hover:translate-y-[-4px] cursor-pointer">
                  <Card.Header className={workflow.is_active ? 'bg-[var(--success)]' : 'bg-[var(--muted)]'}>
                    <div className="flex justify-between items-start">
                      <Card.Title>{workflow.name}</Card.Title>
                      {workflow.is_active ? (
                        <PlayCircle size={24} />
                      ) : (
                        <PauseCircle size={24} />
                      )}
                    </div>
                  </Card.Header>
                  <Card.Content className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {workflow.is_active ? (
                        <span className="px-3 py-1 bg-[var(--success)] text-[var(--success-foreground)] text-xs font-bold uppercase border-2 border-[var(--border)] flex items-center gap-1">
                          <PlayCircle size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-[var(--muted)] text-[var(--foreground)] text-xs font-bold uppercase border-2 border-[var(--border)] flex items-center gap-1">
                          <PauseCircle size={12} />
                          Inactive
                        </span>
                      )}
                    </div>

                    {workflow.description && (
                      <p className="text-sm text-[var(--muted-foreground)]">{workflow.description}</p>
                    )}

                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Zap size={16} className="text-[var(--primary)]" />
                      <span>{workflow.steps?.length || 0} Steps</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
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
