"use client"

import { Suspense } from "react"
import KrilinWorkflows from "../../components/krilin-workflows"

export default function WorkflowsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <KrilinWorkflows />
    </Suspense>
  )
}
