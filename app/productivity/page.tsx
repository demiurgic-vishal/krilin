"use client"

import { Suspense, useState } from "react"
import KrilinHeader from "../../components/krilin-header"
import KrilinButton from "../../components/krilin-button"
import KrilinAchievementSystem from "../../components/gamification/krilin-achievement-system"
import KrilinHabitTracker from "../../components/gamification/krilin-habit-tracker"
import KrilinPomodoroTimer from "../../components/gamification/krilin-pomodoro-timer"
import KrilinMoodTracker from "../../components/gamification/krilin-mood-tracker"
import KrilinGoalTracker from "../../components/gamification/krilin-goal-tracker"
import KrilinGratitudeJournal from "../../components/gamification/krilin-gratitude-journal"
import KrilinMindfulness from "../../components/gamification/krilin-mindfulness"
import KrilinSleepQuality from "../../components/gamification/krilin-sleep-quality"
import KrilinAiAdvisor from "../../components/ai/krilin-ai-advisor"
import KrilinDataDashboard from "../../components/integrations/krilin-data-dashboard"
import KrilinSmartHome from "../../components/integrations/krilin-smart-home"

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

  return (
    <div className="min-h-screen bg-[#fffaeb] font-pixel">
      <KrilinHeader />
      
      <main className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl mb-6 text-center text-[#33272a]">PRODUCTIVITY DOJO</h1>
        <p className="text-center text-[#594a4e] mb-4">Even without superhuman powers, we can achieve amazing things with the right techniques!</p>
        <p className="text-center text-[#ff6b35] font-pixel mb-8">
          "I've always relied on training smart, not just hard. That's how I keep up with the Saiyans!" - Krillin
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <KrilinButton 
            variant={activeTab === 'achievements' ? "primary" : "secondary"}
            onClick={() => setActiveTab('achievements')}
          >
            ACHIEVEMENTS & STATS
          </KrilinButton>
          
          <KrilinButton 
            variant={activeTab === 'habits' ? "primary" : "secondary"}
            onClick={() => setActiveTab('habits')}
          >
            HABIT TRACKER
          </KrilinButton>
          
          <KrilinButton 
            variant={activeTab === 'pomodoro' ? "primary" : "secondary"}
            onClick={() => setActiveTab('pomodoro')}
          >
            POMODORO TIMER
          </KrilinButton>
          
          <KrilinButton 
            variant={activeTab === 'mood' ? "primary" : "secondary"}
            onClick={() => setActiveTab('mood')}
          >
            MOOD TRACKER
          </KrilinButton>
          
          <KrilinButton 
            variant={activeTab === 'goals' ? "primary" : "secondary"}
            onClick={() => setActiveTab('goals')}
          >
            GOAL TRACKER
          </KrilinButton>
          
          <KrilinButton 
            variant={activeTab === 'gratitude' ? "primary" : "secondary"}
            onClick={() => setActiveTab('gratitude')}
          >
            GRATITUDE JOURNAL
          </KrilinButton>
          
          <KrilinButton 
            variant={activeTab === 'mindfulness' ? "primary" : "secondary"}
            onClick={() => setActiveTab('mindfulness')}
          >
            MINDFULNESS
          </KrilinButton>
          
          <KrilinButton 
            variant={activeTab === 'sleep' ? "primary" : "secondary"}
            onClick={() => setActiveTab('sleep')}
          >
            SLEEP QUALITY
          </KrilinButton>
          
          <KrilinButton 
            variant={activeTab === 'ai-advisor' ? "primary" : "secondary"}
            onClick={() => setActiveTab('ai-advisor')}
          >
            AI ADVISOR
          </KrilinButton>
          
          <KrilinButton 
            variant={activeTab === 'data-dashboard' ? "primary" : "secondary"}
            onClick={() => setActiveTab('data-dashboard')}
          >
            DATA DASHBOARD
          </KrilinButton>
          
          <KrilinButton 
            variant={activeTab === 'smart-home' ? "primary" : "secondary"}
            onClick={() => setActiveTab('smart-home')}
          >
            SMART HOME
          </KrilinButton>
        </div>
        
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
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
      </main>
      
      <footer className="bg-[#33272a] text-white p-4 text-center text-xs mt-12">
        <p>© 2025 KRILIN.AI - YOUR POWER-UP SIDEKICK</p>
        <p className="mt-2">TRAIN SMART, WORK SMARTER!</p>
      </footer>
    </div>
  )
}
