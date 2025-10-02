"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Users, Trophy, Heart, ArrowLeft } from "lucide-react"

export default function CommunityPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
                Community Center
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Connect with fellow warriors!</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <Users size={64} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
          <h2 className="text-2xl font-bold font-[var(--font-head)] mb-4 uppercase">Community Features Coming Soon!</h2>
          <p className="text-[var(--muted-foreground)] mb-6">We're building an amazing community space where you can:</p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
            <Card>
              <Card.Header className="bg-[var(--primary)]">
                <Card.Title>Accomplishments</Card.Title>
              </Card.Header>
              <Card.Content className="flex flex-col items-center gap-2 py-4">
                <Trophy size={32} className="text-[var(--primary)]" />
                <p className="text-sm text-center">Share your achievements and celebrate wins with others</p>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header className="bg-[var(--success)]">
                <Card.Title>Connections</Card.Title>
              </Card.Header>
              <Card.Content className="flex flex-col items-center gap-2 py-4">
                <Users size={32} className="text-[var(--success)]" />
                <p className="text-sm text-center">Follow friends and accountability partners</p>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header className="bg-[var(--warning)]">
                <Card.Title>Challenges</Card.Title>
              </Card.Header>
              <Card.Content className="flex flex-col items-center gap-2 py-4">
                <Trophy size={32} className="text-[var(--warning)]" />
                <p className="text-sm text-center">Join community challenges and compete together</p>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header className="bg-[var(--info)]">
                <Card.Title>Reactions</Card.Title>
              </Card.Header>
              <Card.Content className="flex flex-col items-center gap-2 py-4">
                <Heart size={32} className="text-[var(--info)]" />
                <p className="text-sm text-center">Support others with reactions and comments</p>
              </Card.Content>
            </Card>
          </div>

          <p className="text-sm text-[var(--muted-foreground)]">Stay tuned for these exciting features!</p>
        </div>
      </main>
    </div>
  )
}
