"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

export function useKrilinRouter() {
  const router = useRouter()

  const navigate = useCallback((path: string) => {
    router.push(path)
  }, [router])

  const navigateBack = useCallback(() => {
    router.back()
  }, [router])

  const navigateReplace = useCallback((path: string) => {
    router.replace(path)
  }, [router])

  return {
    navigate,
    navigateBack,
    navigateReplace,
  }
}

// Utility function for button onClick handlers
export function createNavigateHandler(path: string, router: ReturnType<typeof useKrilinRouter>) {
  return () => router.navigate(path)
}