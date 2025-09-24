"use client"
import KrilinHeader from "@/components/krilin-header"
import KrilinLogo from "@/components/krilin-logo"
import KrilinButton from "@/components/krilin-button"
import KrilinCard from "@/components/krilin-card"
import KrilinPowerMeter from "@/components/krilin-power-meter"
import KrilinWisdomQuotes from "@/components/gamification/krilin-wisdom-quotes"
import { MessageSquare, Brain, Zap, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fffaeb] font-pixel">
      <KrilinHeader />

      <main className="container mx-auto p-4 md:p-8">
        <section className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl mb-4 text-[#33272a]">YOUR POWER-UP SIDEKICK</h1>
            <p className="mb-6 text-[#594a4e]">
              Hey there! Just like how I support the Z-fighters, I'm here to help you transform into your best self.
              I may not be the strongest warrior, but I'll be right beside you, helping you level up in all areas of life!
            </p>
            <div className="flex flex-wrap gap-4">
              <KrilinButton onClick={() => (window.location.href = "/chat")}>START CHAT</KrilinButton>
              <KrilinButton variant="secondary" onClick={() => (window.location.href = "/dashboard")}>
                DASHBOARD
              </KrilinButton>
              <KrilinButton variant="secondary" onClick={() => (window.location.href = "/workflows")}>
                WORKFLOWS
              </KrilinButton>
              <KrilinButton variant="secondary" onClick={() => (window.location.href = "/productivity")}>
                PRODUCTIVITY DOJO
              </KrilinButton>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <KrilinLogo className="w-48 h-48 md:w-64 md:h-64 animate-power" />
              <div className="absolute inset-0 crt-effect scanlines"></div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center text-[#33272a]">MY POWER LEVELS</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-[#ff6b35] p-2 rounded-md">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <h3 className="font-bold">CONVERSATIONS</h3>
              </div>
              <KrilinPowerMeter value={85} label="CHAT POWER" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-[#ff6b35] p-2 rounded-md">
                  <Brain size={20} className="text-white" />
                </div>
                <h3 className="font-bold">INTELLIGENCE</h3>
              </div>
              <KrilinPowerMeter value={92} label="AI POWER" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-[#ff6b35] p-2 rounded-md">
                  <Zap size={20} className="text-white" />
                </div>
                <h3 className="font-bold">EFFICIENCY</h3>
              </div>
              <KrilinPowerMeter value={78} label="SPEED" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-[#ff6b35] p-2 rounded-md">
                  <Clock size={20} className="text-white" />
                </div>
                <h3 className="font-bold">SCHEDULING</h3>
              </div>
              <KrilinPowerMeter value={88} label="TIME MGMT" />
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 mb-8">
          <KrilinCard title="YOUR RELIABLE SIDEKICK">
            <p className="text-sm mb-4">I'll manage your schedule and keep you organized, just like I help plan group strategies during tough battles!</p>
            <KrilinPowerMeter value={85} label="ORGANIZATION" />
          </KrilinCard>

          <KrilinCard title="SENZU BEAN OF KNOWLEDGE">
            <p className="text-sm mb-4">Need quick answers? I've picked up lots of wisdom from my adventures. Consider me your personal knowledge bank!</p>
            <KrilinPowerMeter value={92} label="KNOWLEDGE" />
          </KrilinCard>

          <KrilinCard title="TRAINING PARTNER">
            <p className="text-sm mb-4">Together we'll tackle your tasks with the perfect form of a Turtle School graduate. No Destructo Disc needed!</p>
            <KrilinPowerMeter value={78} label="PRODUCTIVITY" />
          </KrilinCard>
        </section>
        
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center text-[#33272a]">WISDOM FROM MY JOURNEY</h2>
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
      </main>

      <footer className="bg-[#33272a] text-white p-4 text-center text-xs">
        <p>© 2025 KRILIN.AI - YOUR POWER-UP SIDEKICK</p>
        <p className="mt-2">REMEMBER: SIZE DOESN'T DETERMINE STRENGTH!</p>
      </footer>
    </div>
  )
}
