"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinLogo from "@/components/krilin-logo"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinPowerMeter from "@/components/krilin-power-meter"
import KrilinWisdomQuotes from "@/components/gamification/krilin-wisdom-quotes"
import { MessageSquare, Brain, Zap, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <KrilinPageLayout 
      footerSubtitle="REMEMBER: SIZE DOESN'T DETERMINE STRENGTH!"
      containerSize="full"
    >
      {/* Hero Section */}
      <section className="grid md:grid-cols-2 gap-8 items-center mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl mb-4 text-[#33272a] font-pixel">
            YOUR POWER-UP SIDEKICK
          </h1>
          <p className="mb-6 text-[#594a4e]">
            Hey there! Just like how I support the Z-fighters, I'm here to help you transform into your best self.
            I may not be the strongest warrior, but I'll be right beside you, helping you level up in all areas of life!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/chat">
              <KrilinButtonEnhanced variant="primary" className="w-full">
                START CHAT
              </KrilinButtonEnhanced>
            </Link>
            <Link href="/dashboard">
              <KrilinButtonEnhanced variant="secondary" className="w-full">
                DASHBOARD
              </KrilinButtonEnhanced>
            </Link>
            <Link href="/goals">
              <KrilinButtonEnhanced variant="accent" className="w-full">
                GOALS
              </KrilinButtonEnhanced>
            </Link>
            <Link href="/workflows">
              <KrilinButtonEnhanced variant="secondary" className="w-full">
                WORKFLOWS
              </KrilinButtonEnhanced>
            </Link>
            <Link href="/integrations">
              <KrilinButtonEnhanced variant="secondary" className="w-full">
                INTEGRATIONS
              </KrilinButtonEnhanced>
            </Link>
            <Link href="/community">
              <KrilinButtonEnhanced variant="secondary" className="w-full">
                COMMUNITY
              </KrilinButtonEnhanced>
            </Link>
            <Link href="/productivity">
              <KrilinButtonEnhanced variant="secondary" className="w-full">
                PRODUCTIVITY
              </KrilinButtonEnhanced>
            </Link>
            <Link href="/wellness">
              <KrilinButtonEnhanced variant="secondary" className="w-full">
                WELLNESS
              </KrilinButtonEnhanced>
            </Link>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative">
            <KrilinLogo className="w-48 h-48 md:w-64 md:h-64 animate-power" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 rounded-full" />
          </div>
        </div>
      </section>

      {/* Power Levels Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#33272a] font-pixel">
          MY POWER LEVELS
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2 hover-lift">
              <div className="bg-[#ff6b35] p-2 border-2 border-[#33272a]">
                <MessageSquare size={20} className="text-white" />
              </div>
              <h3 className="font-bold font-pixel">CONVERSATIONS</h3>
            </div>
            <KrilinPowerMeter value={85} label="CHAT POWER" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2 hover-lift">
              <div className="bg-[#ff6b35] p-2 border-2 border-[#33272a]">
                <Brain size={20} className="text-white" />
              </div>
              <h3 className="font-bold font-pixel">INTELLIGENCE</h3>
            </div>
            <KrilinPowerMeter value={92} label="AI POWER" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2 hover-lift">
              <div className="bg-[#ff6b35] p-2 border-2 border-[#33272a]">
                <Zap size={20} className="text-white" />
              </div>
              <h3 className="font-bold font-pixel">EFFICIENCY</h3>
            </div>
            <KrilinPowerMeter value={78} label="SPEED" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2 hover-lift">
              <div className="bg-[#ff6b35] p-2 border-2 border-[#33272a]">
                <Clock size={20} className="text-white" />
              </div>
              <h3 className="font-bold font-pixel">SCHEDULING</h3>
            </div>
            <KrilinPowerMeter value={88} label="TIME MGMT" />
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="grid md:grid-cols-3 gap-6 mb-8">
        <KrilinCardEnhanced 
          title="YOUR RELIABLE SIDEKICK"
          variant="default"
          headerColor="#ff6b35"
        >
          <p className="text-sm mb-4">I'll manage your schedule and keep you organized, just like I help plan group strategies during tough battles!</p>
          <KrilinPowerMeter value={85} label="ORGANIZATION" />
        </KrilinCardEnhanced>

        <KrilinCardEnhanced 
          title="SENZU BEAN OF KNOWLEDGE"
          variant="default"
          headerColor="#ffc15e"
        >
          <p className="text-sm mb-4">Need quick answers? I've picked up lots of wisdom from my adventures. Consider me your personal knowledge bank!</p>
          <KrilinPowerMeter value={92} label="KNOWLEDGE" />
        </KrilinCardEnhanced>

        <KrilinCardEnhanced 
          title="TRAINING PARTNER"
          variant="default"
          headerColor="#4ecdc4"
        >
          <p className="text-sm mb-4">Together we'll tackle your tasks with the perfect form of a Turtle School graduate. No Destructo Disc needed!</p>
          <KrilinPowerMeter value={78} label="PRODUCTIVITY" />
        </KrilinCardEnhanced>
      </section>
      
      {/* Wisdom Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#33272a] font-pixel">
          WISDOM FROM MY JOURNEY
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <KrilinWisdomQuotes 
            krillinMode={true}
            category={['resilience', 'growth']}
            refreshInterval={60000} 
          />
          <KrilinWisdomQuotes 
            preferResearch={true}
            refreshInterval={60000} 
          />
        </div>
      </section>
    </KrilinPageLayout>
  )
}