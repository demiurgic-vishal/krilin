"use client"

import { useState } from "react"
import KrilinCard from "../krilin-card"
import KrilinButton from "../krilin-button"
import KrilinPowerMeter from "../krilin-power-meter"

type GratitudeEntry = {
  id: number;
  date: Date;
  items: string[];
  reflection: string;
  mood: "excellent" | "good" | "neutral" | "low" | "poor";
}

// Research-based prompts that guide gratitude reflection
const gratitudePrompts = [
  "What made you smile today?",
  "Who are you grateful for in your life right now?",
  "What is something beautiful you saw today?",
  "What's a recent challenge that taught you something?",
  "What's something you're looking forward to?",
  "What's something small that brought you joy recently?",
  "What's a skill or ability you're thankful to have?",
  "What opportunity are you grateful for this week?",
  "What comfort or luxury do you appreciate having?",
  "What act of kindness did you witness or experience recently?"
]

// Research-based benefits to educate users
const gratitudeBenefits = [
  {
    title: "Improved Mental Health",
    description: "Regular gratitude practice is associated with reduced symptoms of depression and anxiety.",
    source: "Journal of Personality and Social Psychology, 2003"
  },
  {
    title: "Better Sleep Quality",
    description: "Spending 15 minutes writing in a gratitude journal before bed can help you sleep better and longer.",
    source: "Journal of Psychosomatic Research, 2009"
  },
  {
    title: "Increased Happiness",
    description: "Daily gratitude practice can increase happiness levels by up to 25% over a 10-week period.",
    source: "Review of General Psychology, 2005"
  },
  {
    title: "Reduced Stress",
    description: "Grateful people show lower levels of the stress hormone cortisol and better cardiac functioning.",
    source: "Emotion, 2015"
  },
  {
    title: "Enhanced Relationships",
    description: "Expressing gratitude strengthens social bonds and builds social capital.",
    source: "Psychological Science, 2014"
  }
]

export default function KrilinGratitudeJournal() {
  // Sample historical entries
  const [entries, setEntries] = useState<GratitudeEntry[]>([
    {
      id: 1,
      date: new Date(new Date().setDate(new Date().getDate() - 2)),
      items: [
        "The sunny weather during my walk",
        "My friend who called to check in on me",
        "The delicious dinner I cooked"
      ],
      reflection: "Today I noticed how many small good things happen that I usually overlook.",
      mood: "good"
    },
    {
      id: 2,
      date: new Date(new Date().setDate(new Date().getDate() - 1)),
      items: [
        "Completing a difficult project at work",
        "My comfortable bed",
        "The helpful feedback from my manager"
      ],
      reflection: "I'm realizing how much support I actually have in my life when I look for it.",
      mood: "excellent"
    }
  ])

  // State for new entry form
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [newEntryItems, setNewEntryItems] = useState<string[]>(["", "", ""])
  const [reflection, setReflection] = useState("")
  const [currentPrompt, setCurrentPrompt] = useState(gratitudePrompts[0])
  const [currentMood, setCurrentMood] = useState<"excellent" | "good" | "neutral" | "low" | "poor">("neutral")
  
  // State for view options
  const [viewMode, setViewMode] = useState<"recent" | "calendar" | "stats" | "science">("recent")
  
  // Mood emoji mapping
  const moodEmojis: Record<string, string> = {
    excellent: "😁",
    good: "🙂",
    neutral: "😐",
    low: "😔",
    poor: "😞"
  }
  
  // Get a new random prompt
  const getRandomPrompt = () => {
    const newPrompt = gratitudePrompts[Math.floor(Math.random() * gratitudePrompts.length)]
    setCurrentPrompt(newPrompt)
  }
  
  // Update a gratitude item
  const updateItem = (index: number, value: string) => {
    const newItems = [...newEntryItems]
    newItems[index] = value
    setNewEntryItems(newItems)
  }
  
  // Save a new entry
  const saveEntry = () => {
    // Filter out empty items
    const filteredItems = newEntryItems.filter(item => item.trim() !== "")
    
    if (filteredItems.length === 0) {
      // Would show an error message in a real implementation
      return
    }
    
    const newEntry: GratitudeEntry = {
      id: Date.now(),
      date: new Date(),
      items: filteredItems,
      reflection,
      mood: currentMood
    }
    
    setEntries([newEntry, ...entries])
    
    // Reset form
    setNewEntryItems(["", "", ""])
    setReflection("")
    setCurrentMood("neutral")
    setShowEntryForm(false)
    getRandomPrompt()
  }
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }
  
  // Calculate statistics
  const getStats = () => {
    return {
      totalEntries: entries.length,
      totalGratitudeItems: entries.reduce((sum, entry) => sum + entry.items.length, 0),
      streak: calculateStreak(),
      moodImprovement: calculateMoodImprovement(),
      consistency: Math.min(100, (entries.length / 14) * 100) // % of days in last 2 weeks
    }
  }
  
  // Calculate current streak
  const calculateStreak = () => {
    if (entries.length === 0) return 0
    
    // Sort entries by date, newest first
    const sortedEntries = [...entries].sort((a, b) => b.date.getTime() - a.date.getTime())
    
    let streak = 1
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const latestDate = new Date(sortedEntries[0].date)
    latestDate.setHours(0, 0, 0, 0)
    
    // Check if the latest entry is from today or yesterday
    if (latestDate.getTime() !== today.getTime() && 
        latestDate.getTime() !== new Date(today).setDate(today.getDate() - 1)) {
      return 0 // Streak broken
    }
    
    // Calculate streak
    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const currentDate = new Date(sortedEntries[i].date)
      currentDate.setHours(0, 0, 0, 0)
      
      const prevDate = new Date(sortedEntries[i+1].date)
      prevDate.setHours(0, 0, 0, 0)
      
      // Check if entries are on consecutive days
      const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (dayDiff === 1) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }
  
  // Calculate mood improvement from gratitude practice
  const calculateMoodImprovement = () => {
    if (entries.length < 2) return 0
    
    const moodValues = {
      excellent: 5,
      good: 4,
      neutral: 3,
      low: 2,
      poor: 1
    }
    
    // Get first and latest entry moods
    const sortedEntries = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime())
    const firstEntryMood = sortedEntries[0].mood
    const latestEntryMood = sortedEntries[sortedEntries.length - 1].mood
    
    // Calculate difference in mood values
    const moodDiff = moodValues[latestEntryMood] - moodValues[firstEntryMood]
    
    // Convert to percentage (-100% to +100%)
    return Math.min(100, Math.max(-100, (moodDiff / 4) * 100))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-pixel text-xl text-[#33272a]">GRATITUDE JOURNAL</h2>
        <KrilinButton 
          onClick={() => setShowEntryForm(!showEntryForm)}
          variant="primary"
        >
          {showEntryForm ? "CANCEL" : "NEW ENTRY"}
        </KrilinButton>
      </div>
      
      {/* Entry Form */}
      {showEntryForm && (
        <KrilinCard title="WHAT ARE YOU GRATEFUL FOR TODAY?">
          <div className="space-y-6">
            {/* Gratitude prompt */}
            <div className="p-4 border-2 border-[#ffc15e] bg-[#fff8e8] text-center">
              <p className="font-pixel text-sm mb-2 text-[#594a4e]">TODAY'S PROMPT:</p>
              <p className="font-pixel text-lg text-[#33272a]">{currentPrompt}</p>
              <button 
                onClick={getRandomPrompt}
                className="mt-2 text-xs font-pixel underline text-[#ff6b35]"
              >
                Get another prompt
              </button>
            </div>
            
            {/* Gratitude items */}
            <div className="space-y-3">
              <h3 className="font-pixel text-sm text-[#33272a]">I'M GRATEFUL FOR...</h3>
              {newEntryItems.map((item, index) => (
                <input
                  key={index}
                  type="text"
                  value={item}
                  onChange={(e) => updateItem(index, e.target.value)}
                  placeholder={`Gratitude item ${index + 1}`}
                  className="w-full border-2 border-[#33272a] bg-[#fffffc] p-2 font-pixel text-sm"
                />
              ))}
            </div>
            
            {/* Reflection */}
            <div className="space-y-2">
              <h3 className="font-pixel text-sm text-[#33272a]">REFLECTION (OPTIONAL)</h3>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="How did writing these things down make you feel?"
                className="w-full border-2 border-[#33272a] bg-[#fffffc] p-2 h-20 font-pixel text-sm"
              />
            </div>
            
            {/* Mood selection */}
            <div className="space-y-2">
              <h3 className="font-pixel text-sm text-[#33272a]">HOW DO YOU FEEL NOW?</h3>
              <div className="flex justify-between items-center bg-[#f5f5f5] p-3 border-2 border-[#33272a]">
                {(Object.keys(moodEmojis) as Array<"excellent" | "good" | "neutral" | "low" | "poor">).map(mood => (
                  <button
                    key={mood}
                    onClick={() => setCurrentMood(mood)}
                    className={`text-2xl p-2 rounded-full transition-all ${
                      currentMood === mood 
                        ? 'bg-[#ffc15e] scale-110 transform' 
                        : 'bg-white hover:bg-[#fff8e8]'
                    }`}
                  >
                    {moodEmojis[mood]}
                  </button>
                ))}
              </div>
              <div className="text-center font-pixel text-sm text-[#594a4e] capitalize">
                {currentMood}
              </div>
            </div>
            
            <KrilinButton 
              onClick={saveEntry}
              className={`w-full ${newEntryItems.every(item => item.trim() === '') ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              SAVE ENTRY
            </KrilinButton>
          </div>
        </KrilinCard>
      )}
      
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        <KrilinButton 
          variant={viewMode === 'recent' ? "primary" : "secondary"}
          onClick={() => setViewMode('recent')}
        >
          ENTRIES
        </KrilinButton>
        
        <KrilinButton 
          variant={viewMode === 'stats' ? "primary" : "secondary"}
          onClick={() => setViewMode('stats')}
        >
          STATS
        </KrilinButton>
        
        <KrilinButton 
          variant={viewMode === 'science' ? "primary" : "secondary"}
          onClick={() => setViewMode('science')}
        >
          SCIENCE
        </KrilinButton>
      </div>
      
      {/* Recent Entries View */}
      {viewMode === 'recent' && (
        <div className="space-y-4">
          {entries.length === 0 ? (
            <KrilinCard title="NO ENTRIES YET">
              <div className="text-center p-4 border-2 border-dashed border-[#33272a]">
                <p className="font-pixel text-sm text-[#594a4e]">
                  No entries yet. Click "NEW ENTRY" to start your gratitude practice.
                </p>
              </div>
            </KrilinCard>
          ) : (
            entries.map(entry => (
              <KrilinCard 
                key={entry.id}
                title={formatDate(entry.date)}
                className="relative"
              >
                <div className="absolute top-3 right-3">
                  <span className="text-xl">{moodEmojis[entry.mood]}</span>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-pixel text-sm text-[#33272a]">GRATEFUL FOR:</h3>
                    <ul className="space-y-2">
                      {entry.items.map((item, index) => (
                        <li 
                          key={index}
                          className="flex items-start gap-2"
                        >
                          <span className="inline-block w-5 h-5 bg-[#ffc15e] flex-shrink-0 flex items-center justify-center font-pixel">
                            {index + 1}
                          </span>
                          <span className="font-pixel text-sm text-[#33272a]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {entry.reflection && (
                    <div className="space-y-1">
                      <h3 className="font-pixel text-sm text-[#33272a]">REFLECTION:</h3>
                      <p className="font-pixel text-sm text-[#594a4e] italic bg-[#f8f8f8] p-2">
                        {entry.reflection}
                      </p>
                    </div>
                  )}
                </div>
              </KrilinCard>
            ))
          )}
        </div>
      )}
      
      {/* Stats View */}
      {viewMode === 'stats' && (
        <KrilinCard title="YOUR GRATITUDE JOURNEY">
          <div className="space-y-6">
            {/* Stats overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
                <div className="font-pixel text-2xl text-[#ff6b35]">{getStats().totalEntries}</div>
                <div className="font-pixel text-xs text-[#594a4e]">TOTAL ENTRIES</div>
              </div>
              
              <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
                <div className="font-pixel text-2xl text-[#ff6b35]">{getStats().totalGratitudeItems}</div>
                <div className="font-pixel text-xs text-[#594a4e]">GRATITUDES RECORDED</div>
              </div>
              
              <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
                <div className="font-pixel text-2xl text-[#ff6b35]">{getStats().streak}</div>
                <div className="font-pixel text-xs text-[#594a4e]">CURRENT STREAK</div>
              </div>
            </div>
            
            {/* Progress meters */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-pixel text-sm text-[#33272a]">JOURNAL CONSISTENCY</span>
                  <span className="font-pixel text-sm text-[#33272a]">{Math.round(getStats().consistency)}%</span>
                </div>
                <KrilinPowerMeter value={getStats().consistency} />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-pixel text-sm text-[#33272a]">MOOD IMPROVEMENT</span>
                  <span className="font-pixel text-sm text-[#33272a]">
                    {getStats().moodImprovement > 0 ? '+' : ''}{Math.round(getStats().moodImprovement)}%
                  </span>
                </div>
                <KrilinPowerMeter value={Math.max(0, 50 + getStats().moodImprovement/2)} />
              </div>
            </div>
            
            {/* Research-based insights */}
            <div className="border-2 border-[#33272a] p-4">
              <h3 className="font-pixel text-sm text-[#33272a] mb-3">INSIGHTS</h3>
              
              {entries.length < 5 ? (
                <p className="font-pixel text-sm text-[#594a4e]">
                  Keep journaling! Research shows that consistent gratitude practice for at least 3 weeks is needed to see significant benefits.
                </p>
              ) : getStats().consistency < 50 ? (
                <p className="font-pixel text-sm text-[#594a4e]">
                  Try to journal more regularly. Studies show that consistent practice (at least 3-4 times per week) leads to the greatest improvements in well-being.
                </p>
              ) : getStats().moodImprovement > 20 ? (
                <p className="font-pixel text-sm text-[#594a4e]">
                  Great progress! Your mood scores suggest that gratitude practice is having a positive effect on your well-being.
                </p>
              ) : (
                <p className="font-pixel text-sm text-[#594a4e]">
                  You're building a strong gratitude habit. Try being more specific in your entries - research shows detailed gratitude leads to stronger effects.
                </p>
              )}
            </div>
            
            {/* Achievement */}
            <div className="bg-[#fff8e8] border-2 border-[#ffc15e] p-4 text-center">
              <h3 className="font-pixel text-sm text-[#33272a] mb-2">NEXT ACHIEVEMENT</h3>
              <div className="font-pixel text-lg text-[#ff6b35] mb-1">Gratitude Master</div>
              <p className="font-pixel text-xs text-[#594a4e]">
                Complete {Math.min(14, getStats().totalEntries + 5)} / 14 gratitude journal entries
              </p>
              <div className="mt-2">
                <KrilinPowerMeter value={(Math.min(getStats().totalEntries, 14) / 14) * 100} />
              </div>
            </div>
          </div>
        </KrilinCard>
      )}
      
      {/* Science View */}
      {viewMode === 'science' && (
        <KrilinCard title="THE SCIENCE OF GRATITUDE">
          <div className="space-y-4">
            <p className="font-pixel text-sm text-[#33272a]">
              Research has consistently shown that gratitude practices improve mental well-being. 
              Here are some evidence-based benefits:
            </p>
            
            {gratitudeBenefits.map((benefit, index) => (
              <div key={index} className="border-2 border-[#33272a] bg-[#fffffc] overflow-hidden">
                <div className="bg-[#ffc15e] px-3 py-2">
                  <h3 className="font-pixel text-sm text-[#33272a]">{benefit.title}</h3>
                </div>
                <div className="p-3">
                  <p className="font-pixel text-sm text-[#594a4e] mb-1">{benefit.description}</p>
                  <p className="font-pixel text-xs text-[#33272a] italic">Source: {benefit.source}</p>
                </div>
              </div>
            ))}
            
            <div className="p-4 border-2 border-dashed border-[#33272a]">
              <h3 className="font-pixel text-sm text-[#33272a] mb-2">HOW IT WORKS</h3>
              <p className="font-pixel text-sm text-[#594a4e]">
                Gratitude works through several psychological mechanisms:
              </p>
              <ul className="mt-2 space-y-2">
                <li className="font-pixel text-sm text-[#594a4e]">
                  • Shifts attention from negative to positive aspects of life
                </li>
                <li className="font-pixel text-sm text-[#594a4e]">
                  • Activates the brain's reward pathways and releases dopamine
                </li>
                <li className="font-pixel text-sm text-[#594a4e]">
                  • Reduces stress hormones like cortisol
                </li>
                <li className="font-pixel text-sm text-[#594a4e]">
                  • Builds psychological resilience over time
                </li>
              </ul>
            </div>
          </div>
        </KrilinCard>
      )}
    </div>
  )
}
