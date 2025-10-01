"use client"

import { Suspense, useState } from "react"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
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
    { key: 'mood', label: 'MOOD TRACKER' },
    { key: 'gratitude', label: 'GRATITUDE JOURNAL' },
    { key: 'mindfulness', label: 'MINDFULNESS MEDITATION' },
    { key: 'sleep', label: 'SLEEP QUALITY' },
    { key: 'habits', label: 'WELLNESS HABITS' },
  ] as const

  return (
    <KrilinPageLayout
      title="MENTAL WELLNESS CENTER"
      subtitle="Research-backed tools to improve your mental wellbeing and build resilience."
      showBackButton={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Wellness" }
      ]}
      footerSubtitle="TAKE CARE OF YOUR MIND"
      headerContent={
        <p className="text-center text-[#ff6b35] font-pixel text-sm">
          "Even warriors need to train their minds, not just their bodies." - Krillin
        </p>
      }
      containerSize="full"
    >
      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {tabs.map((tab, index) => (
          <KrilinButtonEnhanced
            key={tab.key}
            variant={activeTab === tab.key ? "primary" : "secondary"}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
          >
            {tab.label}
          </KrilinButtonEnhanced>
        ))}
      </div>
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-4">
          {/* Scientific Validation Banner */}
          <div className="bg-[#fff8e8] border-2 border-[#ffc15e] p-4 mb-8 text-center">
              <h2 className="font-pixel text-lg text-[#33272a] mb-2">🧠 SCIENTIFICALLY VALIDATED TOOLS</h2>
              <p className="font-pixel text-sm text-[#594a4e]">
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
    </KrilinPageLayout>
  )
}