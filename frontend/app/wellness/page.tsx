"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/retroui/Button"
import { ArrowLeft } from "lucide-react"
import KrilinMoodTracker from "@/components/gamification/krilin-mood-tracker"
import KrilinGratitudeJournal from "@/components/gamification/krilin-gratitude-journal"
import KrilinMindfulness from "@/components/gamification/krilin-mindfulness"
import KrilinSleepQuality from "@/components/gamification/krilin-sleep-quality"
import KrilinHabitTracker from "@/components/gamification/krilin-habit-tracker"
import KrilinWisdomQuotes from "@/components/gamification/krilin-wisdom-quotes"
import { PixelLoader } from "@/components/ui/pixel-loader"

export default function WellnessPage() {
  
  const [activeTab, setActiveTab] = useState<
    'mood' | 
    'gratitude' | 
    'mindfulness' | 
    'sleep' |
    'habits'
  >('mood')

  const tabs = [
    { key: 'mood', label: 'Mood Tracker' },
    { key: 'gratitude', label: 'Gratitude Journal' },
    { key: 'mindfulness', label: 'Mindfulness Meditation' },
    { key: 'sleep', label: 'Sleep Quality' },
    { key: 'habits', label: 'Wellness Habits' },
  ] as const

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <Home size={24} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
                Wellness
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Research-backed tools for mental wellbeing</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {tabs.map((tab, index) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "secondary"}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      
        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-4">
            {/* Scientific Validation Banner */}
            <div className="bg-[var(--muted)] border-2 border-[var(--border)] p-4 mb-8 text-center shadow-[4px_4px_0_0_var(--border)]">
              <h2 className="font-[var(--font-head)] text-lg mb-2 uppercase">Scientifically Validated Tools</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                All tools in the Wellness Center are based on peer-reviewed research in psychology, neuroscience, and behavioral science.
                Consistent use of these features can significantly improve mental health outcomes and overall wellbeing.
              </p>
            </div>
          
            {/* Tab Content */}
            <div>
              <Suspense fallback={
                <div className="flex items-center justify-center h-96">
                  <PixelLoader variant="spinner" size="lg" text="Loading..." />
                </div>
              }>
                {activeTab === 'mood' && <KrilinMoodTracker />}
                {activeTab === 'gratitude' && <KrilinGratitudeJournal />}
                {activeTab === 'mindfulness' && <KrilinMindfulness />}
                {activeTab === 'sleep' && <KrilinSleepQuality />}
                {activeTab === 'habits' && <KrilinHabitTracker />}
              </Suspense>
            </div>
          </div>
        
        {/* Sidebar with Contextual Wisdom Quotes */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
              {activeTab === 'mood' && (
                <>
                  <KrilinWisdomQuotes 
                    category={['resilience', 'growth']} 
                    krillinMode={true}
                    refreshInterval={60000} 
                  />
                  <div className="mt-6">
                    <KrilinWisdomQuotes 
                      category={['resilience', 'growth']} 
                      preferResearch={true}
                      refreshInterval={60000} 
                    />
                  </div>
                </>
              )}
              
              {activeTab === 'gratitude' && (
                <>
                  <KrilinWisdomQuotes 
                    category="gratitude" 
                    krillinMode={true}
                    refreshInterval={60000} 
                  />
                  <div className="mt-6">
                    <KrilinWisdomQuotes 
                      category="gratitude" 
                      preferResearch={true}
                      refreshInterval={60000} 
                    />
                  </div>
                </>
              )}
              
              {activeTab === 'mindfulness' && (
                <>
                  <KrilinWisdomQuotes 
                    category="mindfulness"
                    krillinMode={true} 
                    refreshInterval={60000} 
                  />
                  <div className="mt-6">
                    <KrilinWisdomQuotes 
                      category="mindfulness"
                      preferResearch={true} 
                      refreshInterval={60000} 
                    />
                  </div>
                </>
              )}
              
              {activeTab === 'sleep' && (
                <>
                  <KrilinWisdomQuotes 
                    category="sleep"
                    krillinMode={true} 
                    refreshInterval={60000} 
                  />
                  <div className="mt-6">
                    <KrilinWisdomQuotes 
                      category="sleep"
                      preferResearch={true} 
                      refreshInterval={60000} 
                    />
                  </div>
                </>
              )}
              
              {activeTab === 'habits' && (
                <>
                  <KrilinWisdomQuotes 
                    category="habit"
                    krillinMode={true} 
                    refreshInterval={60000} 
                  />
                  <div className="mt-6">
                    <KrilinWisdomQuotes 
                      category="habit"
                      preferResearch={true} 
                      refreshInterval={60000} 
                    />
                  </div>
                </>
              )}
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}