"use client"

import { Suspense, useState } from "react"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
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
    { key: 'achievements', label: 'ACHIEVEMENTS & STATS' },
    { key: 'habits', label: 'HABIT TRACKER' },
    { key: 'pomodoro', label: 'POMODORO TIMER' },
    { key: 'mood', label: 'MOOD TRACKER' },
    { key: 'goals', label: 'GOAL TRACKER' },
    { key: 'gratitude', label: 'GRATITUDE JOURNAL' },
    { key: 'mindfulness', label: 'MINDFULNESS' },
    { key: 'sleep', label: 'SLEEP QUALITY' },
    { key: 'ai-advisor', label: 'AI ADVISOR' },
    { key: 'data-dashboard', label: 'DATA DASHBOARD' },
    { key: 'smart-home', label: 'SMART HOME' },
  ] as const

  return (
    <KrilinPageLayout
      title="PRODUCTIVITY DOJO"
      subtitle="Even without superhuman powers, we can achieve amazing things with the right techniques!"
      showBackButton={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Productivity" }
      ]}
      footerSubtitle="TRAIN SMART, WORK SMARTER!"
      headerContent={
        <p className="text-center text-[#ff6b35] font-pixel text-sm">
          "I've always relied on training smart, not just hard. That's how I keep up with the Saiyans!" - Krillin
        </p>
      }
      containerSize="full"
    >
      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {tabs.map((tab, index) => (
          <KrilinButtonEnhanced
            key={tab.key}
            variant={activeTab === tab.key ? "primary" : "secondary"}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className="text-xs px-3 py-2"
          >
            {tab.label}
          </KrilinButtonEnhanced>
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
    </KrilinPageLayout>
  )
}