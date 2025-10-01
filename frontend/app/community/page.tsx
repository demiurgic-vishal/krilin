"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import { Users, Trophy, Heart, MessageCircle, Share2 } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center bg-[#fef6e4]">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#33272a] font-pixel mb-4">LOADING...</div>
        </div>
      </div>
    )
  }

  return (
    <KrilinPageLayout title="COMMUNITY CENTER" subtitle="Connect with fellow warriors!" showBackButton={true} breadcrumbs={[{ label: "Home", href: "/" }, { label: "Community" }]}>
      <div className="text-center py-12">
        <Users size={64} className="mx-auto mb-4 text-[#594a4e]" />
        <h2 className="text-2xl font-bold text-[#33272a] font-pixel mb-4">COMMUNITY FEATURES COMING SOON!</h2>
        <p className="text-[#594a4e] mb-6">We're building an amazing community space where you can:</p>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
          <KrilinCardEnhanced title="ACCOMPLISHMENTS" variant="default" headerColor="#ff6b35">
            <div className="flex flex-col items-center gap-2 py-4">
              <Trophy size={32} className="text-[#ff6b35]" />
              <p className="text-sm text-center">Share your achievements and celebrate wins with others</p>
            </div>
          </KrilinCardEnhanced>
          <KrilinCardEnhanced title="CONNECTIONS" variant="default" headerColor="#4ecdc4">
            <div className="flex flex-col items-center gap-2 py-4">
              <Users size={32} className="text-[#4ecdc4]" />
              <p className="text-sm text-center">Follow friends and accountability partners</p>
            </div>
          </KrilinCardEnhanced>
          <KrilinCardEnhanced title="CHALLENGES" variant="default" headerColor="#ffc15e">
            <div className="flex flex-col items-center gap-2 py-4">
              <Trophy size={32} className="text-[#ffc15e]" />
              <p className="text-sm text-center">Join community challenges and compete together</p>
            </div>
          </KrilinCardEnhanced>
          <KrilinCardEnhanced title="REACTIONS" variant="default" headerColor="#95e1d3">
            <div className="flex flex-col items-center gap-2 py-4">
              <Heart size={32} className="text-[#95e1d3]" />
              <p className="text-sm text-center">Support others with reactions and comments</p>
            </div>
          </KrilinCardEnhanced>
        </div>
        <p className="text-sm text-[#594a4e]">Stay tuned for these exciting features!</p>
      </div>
    </KrilinPageLayout>
  )
}
