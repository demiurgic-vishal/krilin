"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/retroui/Button"
import { ArrowLeft } from "lucide-react"
import KrilinAchievementSystem from "@/components/gamification/krilin-achievement-system"
import KrilinHabitTracker from "@/components/gamification/krilin-habit-tracker"
import KrilinPomodoroTimer from "@/components/gamification/krilin-pomodoro-timer"
import KrilinMoodTracker from "@/components/gamification/krilin-mood-tracker"
import KrilinGoalTracker from "@/components/gamification/krilin-goal-tracker"
import KrilinGratitudeJournal from "@/components/gamification/krilin-gratitude-journal"
import KrilinMindfulness from "@/components/gamification/krilin-mindfulness"
import KrilinSleepQuality from "@/components/gamification/krilin-sleep-quality"
import KrilinAiAdvisor from "@/components/ai/krilin-ai-advisor"
import KrilinDataDashboard from "@/components/integrations/krilin-data-dashboard"
import KrilinSmartHome from "@/components/integrations/krilin-smart-home"
import { PixelLoader } from "@/components/ui/pixel-loader"

export default function ProductivityPage() {
  
  const [activeTab, setActiveTab] = useState<
    'achievements' | 
    'habits' | 
    'pomodoro' | 
    'mood' | 
    'goals' | 
    'gratitude' | 
    'mindfulness' | 
    'sleep' | 
    'ai-advisor' | 
    'data-dashboard' | 
    'smart-home'
  >('achievements')

  const tabs = [
    { key: 'achievements', label: 'Achievements & Stats' },
    { key: 'habits', label: 'Habit Tracker' },
    { key: 'pomodoro', label: 'Pomodoro Timer' },
    { key: 'mood', label: 'Mood Tracker' },
    { key: 'goals', label: 'Goal Tracker' },
    { key: 'gratitude', label: 'Gratitude Journal' },
    { key: 'mindfulness', label: 'Mindfulness' },
    { key: 'sleep', label: 'Sleep Quality' },
    { key: 'ai-advisor', label: 'AI Advisor' },
    { key: 'data-dashboard', label: 'Data Dashboard' },
    { key: 'smart-home', label: 'Smart Home' },
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
                Productivity
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Tools to maximize your effectiveness</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {tabs.map((tab, index) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "secondary"}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              size="sm"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      
        {/* Tab Content */}
        <div className="min-h-[500px]">
          <Suspense fallback={
            <div className="flex items-center justify-center h-96">
              <PixelLoader variant="spinner" size="lg" text="Loading..." />
            </div>
          }>
            {activeTab === 'achievements' && <KrilinAchievementSystem />}
            {activeTab === 'habits' && <KrilinHabitTracker />}
            {activeTab === 'pomodoro' && <KrilinPomodoroTimer />}
            {activeTab === 'mood' && <KrilinMoodTracker />}
            {activeTab === 'goals' && <KrilinGoalTracker />}
            {activeTab === 'gratitude' && <KrilinGratitudeJournal />}
            {activeTab === 'mindfulness' && <KrilinMindfulness />}
            {activeTab === 'sleep' && <KrilinSleepQuality />}
            {activeTab === 'ai-advisor' && <KrilinAiAdvisor />}
            {activeTab === 'data-dashboard' && <KrilinDataDashboard />}
            {activeTab === 'smart-home' && <KrilinSmartHome />}
          </Suspense>
        </div>
      </main>
    </div>
  )
}