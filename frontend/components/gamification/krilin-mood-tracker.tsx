"use client"

import { useState } from "react"
import KrilinCard from "../krilin-card"
import KrilinButton from "../krilin-button"
import KrilinPowerMeter from "../krilin-power-meter"

// Define mood and energy types
type Mood = 'excellent' | 'good' | 'neutral' | 'low' | 'poor'
type Energy = 'high' | 'medium' | 'low'
type MoodEntryType = {
  id: number
  timestamp: Date
  mood: Mood
  energy: Energy
  activities: string[]
  notes: string
}

// Mood emoji mapping
const moodEmojis: Record<Mood, string> = {
  excellent: "😁",
  good: "🙂",
  neutral: "😐",
  low: "😔",
  poor: "😞"
}

// Energy level icon mapping
const energyIcons: Record<Energy, string> = {
  high: "⚡⚡⚡",
  medium: "⚡⚡",
  low: "⚡"
}

// Activity tags for tracking what the user was doing
const activityOptions = [
  "Work", "Study", "Exercise", "Social", "Entertainment", 
  "Creative", "Rest", "Family", "Chores", "Outdoors",
  "Reading", "Meditation", "Meeting", "Travel", "Eating"
]

export default function KrilinMoodTracker() {
  // State for the current mood entry form
  const [currentMood, setCurrentMood] = useState<Mood>('neutral')
  const [currentEnergy, setCurrentEnergy] = useState<Energy>('medium')
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [showEntryForm, setShowEntryForm] = useState(false)
  
  // Historical mood data
  const [moodEntries, setMoodEntries] = useState<MoodEntryType[]>([
    {
      id: 1,
      timestamp: new Date(new Date().setHours(9, 0, 0, 0)),
      mood: 'good',
      energy: 'high',
      activities: ['Work', 'Meditation'],
      notes: 'Morning meditation helped me start the day focused.'
    },
    {
      id: 2,
      timestamp: new Date(new Date().setHours(12, 30, 0, 0)),
      mood: 'neutral',
      energy: 'medium',
      activities: ['Work', 'Meeting'],
      notes: 'Long meeting was draining but productive.'
    },
    {
      id: 3,
      timestamp: new Date(new Date().setHours(15, 45, 0, 0)),
      mood: 'low',
      energy: 'low',
      activities: ['Work'],
      notes: 'Afternoon slump, feeling tired after looking at screen all day.'
    },
    {
      id: 4,
      timestamp: new Date(new Date().setHours(17, 30, 0, 0)),
      mood: 'good',
      energy: 'medium',
      activities: ['Exercise', 'Outdoors'],
      notes: 'Walk outside helped refresh my mind.'
    }
  ])
  
  // Mode for viewing data (today, week, month)
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'insights'>('today')

  // Toggle activity selection
  const toggleActivity = (activity: string) => {
    if (selectedActivities.includes(activity)) {
      setSelectedActivities(selectedActivities.filter(a => a !== activity))
    } else {
      setSelectedActivities([...selectedActivities, activity])
    }
  }

  // Submit a new mood entry
  const submitMoodEntry = () => {
    const newEntry: MoodEntryType = {
      id: Date.now(),
      timestamp: new Date(),
      mood: currentMood,
      energy: currentEnergy,
      activities: selectedActivities,
      notes
    }
    
    setMoodEntries([...moodEntries, newEntry])
    
    // Reset form
    setCurrentMood('neutral')
    setCurrentEnergy('medium')
    setSelectedActivities([])
    setNotes('')
    setShowEntryForm(false)
  }

  // Format timestamp for display
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }
  
  // Get mood score (1-5) for calculations
  const getMoodScore = (mood: Mood): number => {
    const scores: Record<Mood, number> = {
      excellent: 5,
      good: 4,
      neutral: 3,
      low: 2,
      poor: 1
    }
    return scores[mood]
  }
  
  // Get energy score (1-3) for calculations
  const getEnergyScore = (energy: Energy): number => {
    const scores: Record<Energy, number> = {
      high: 3,
      medium: 2,
      low: 1
    }
    return scores[energy]
  }
  
  // Calculate average mood score for today
  const calculateAverageMood = (): number => {
    if (moodEntries.length === 0) return 3
    
    const total = moodEntries.reduce((sum, entry) => sum + getMoodScore(entry.mood), 0)
    return total / moodEntries.length
  }
  
  // Calculate average energy score for today
  const calculateAverageEnergy = (): number => {
    if (moodEntries.length === 0) return 2
    
    const total = moodEntries.reduce((sum, entry) => sum + getEnergyScore(entry.energy), 0)
    return total / moodEntries.length
  }
  
  // Generate insights based on mood and energy patterns
  const generateInsights = () => {
    if (moodEntries.length < 2) {
      return [{
        title: "Not Enough Data",
        description: "Track your mood more frequently to get personalized insights."
      }]
    }
    
    const insights = []
    
    // Find most common activities during high mood
    const highMoodEntries = moodEntries.filter(entry => ['excellent', 'good'].includes(entry.mood))
    if (highMoodEntries.length > 0) {
      const activities = highMoodEntries.flatMap(entry => entry.activities)
      const activityCounts: Record<string, number> = {}
      
      activities.forEach(activity => {
        activityCounts[activity] = (activityCounts[activity] || 0) + 1
      })
      
      const mostCommonActivity = Object.entries(activityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 1)
        .map(([activity]) => activity)[0]
      
      if (mostCommonActivity) {
        insights.push({
          title: "Mood Booster",
          description: `${mostCommonActivity} seems to have a positive effect on your mood.`
        })
      }
    }
    
    // Check for energy patterns by time of day
    const morningEntries = moodEntries.filter(entry => entry.timestamp.getHours() < 12)
    const afternoonEntries = moodEntries.filter(entry => entry.timestamp.getHours() >= 12 && entry.timestamp.getHours() < 17)
    const eveningEntries = moodEntries.filter(entry => entry.timestamp.getHours() >= 17)
    
    const avgMorningEnergy = morningEntries.length > 0 
      ? morningEntries.reduce((sum, entry) => sum + getEnergyScore(entry.energy), 0) / morningEntries.length 
      : 0
    
    const avgAfternoonEnergy = afternoonEntries.length > 0 
      ? afternoonEntries.reduce((sum, entry) => sum + getEnergyScore(entry.energy), 0) / afternoonEntries.length 
      : 0
    
    const avgEveningEnergy = eveningEntries.length > 0 
      ? eveningEntries.reduce((sum, entry) => sum + getEnergyScore(entry.energy), 0) / eveningEntries.length 
      : 0
    
    // Find peak energy time
    const energyByTime = [
      { time: 'Morning', score: avgMorningEnergy },
      { time: 'Afternoon', score: avgAfternoonEnergy },
      { time: 'Evening', score: avgEveningEnergy }
    ].filter(item => item.score > 0)
    
    if (energyByTime.length > 0) {
      const peakEnergyTime = energyByTime.sort((a, b) => b.score - a.score)[0]
      
      insights.push({
        title: "Peak Energy Time",
        description: `Your energy tends to be highest during the ${peakEnergyTime.time.toLowerCase()}.`
      })
    }
    
    // Check for mood fluctuations
    const moodScores = moodEntries.map(entry => getMoodScore(entry.mood))
    const moodVariance = calculateVariance(moodScores)
    
    if (moodVariance > 1.5) {
      insights.push({
        title: "Mood Fluctuations",
        description: "Your mood tends to fluctuate significantly throughout the day."
      })
    }
    
    return insights.length > 0 ? insights : [{
      title: "Consistent Patterns",
      description: "Your mood and energy levels have been relatively stable."
    }]
  }
  
  // Helper function to calculate variance for a numeric array
  const calculateVariance = (array: number[]): number => {
    if (array.length === 0) return 0
    
    const mean = array.reduce((sum, val) => sum + val, 0) / array.length
    const squareDiffs = array.map(val => Math.pow(val - mean, 2))
    return squareDiffs.reduce((sum, val) => sum + val, 0) / array.length
  }
  
  // Get mood color based on mood type
  const getMoodColor = (mood: Mood): string => {
    const colors: Record<Mood, string> = {
      excellent: "#4CAF50",
      good: "#8BC34A",
      neutral: "#FFC107",
      low: "#FF9800",
      poor: "#F44336"
    }
    return colors[mood]
  }
  
  // Get energy color based on energy level
  const getEnergyColor = (energy: Energy): string => {
    const colors: Record<Energy, string> = {
      high: "#4CAF50",
      medium: "#FFC107",
      low: "#F44336"
    }
    return colors[energy]
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-pixel text-xl text-[#33272a]">MOOD & ENERGY TRACKER</h2>
        <KrilinButton 
          onClick={() => setShowEntryForm(!showEntryForm)}
          variant="primary"
        >
          {showEntryForm ? "CANCEL" : "LOG CURRENT MOOD"}
        </KrilinButton>
      </div>
      
      {/* Mood Entry Form */}
      {showEntryForm && (
        <KrilinCard title="HOW ARE YOU FEELING RIGHT NOW?">
          <div className="space-y-6">
            {/* Mood Selection */}
            <div className="space-y-2">
              <h3 className="font-pixel text-sm text-[#33272a]">MOOD</h3>
              <div className="flex justify-between items-center bg-[#f5f5f5] p-3 border-2 border-[#33272a]">
                {(Object.keys(moodEmojis) as Mood[]).map(mood => (
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
                {currentMood} Mood
              </div>
            </div>
            
            {/* Energy Selection */}
            <div className="space-y-2">
              <h3 className="font-pixel text-sm text-[#33272a]">ENERGY LEVEL</h3>
              <div className="flex justify-between">
                {(Object.keys(energyIcons) as Energy[]).map(energy => (
                  <button
                    key={energy}
                    onClick={() => setCurrentEnergy(energy)}
                    className={`flex-1 p-3 font-pixel text-sm border-2 ${
                      currentEnergy === energy 
                        ? 'bg-[#ffc15e] border-[#33272a]'
                        : 'bg-white border-[#e5e5e5] hover:bg-[#fff8e8]'
                    }`}
                  >
                    <div className="text-center text-lg mb-1">{energyIcons[energy]}</div>
                    <div className="text-center capitalize">{energy}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Activity Selection */}
            <div className="space-y-2">
              <h3 className="font-pixel text-sm text-[#33272a]">WHAT ARE YOU DOING? (SELECT ALL THAT APPLY)</h3>
              <div className="flex flex-wrap gap-2">
                {activityOptions.map(activity => (
                  <button
                    key={activity}
                    onClick={() => toggleActivity(activity)}
                    className={`px-3 py-1 text-xs font-pixel rounded-full transition-all ${
                      selectedActivities.includes(activity)
                        ? 'bg-[#594a4e] text-white'
                        : 'bg-[#f5f5f5] text-[#33272a] hover:bg-[#e5e5e5]'
                    }`}
                  >
                    {activity}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Notes Input */}
            <div className="space-y-2">
              <h3 className="font-pixel text-sm text-[#33272a]">NOTES (OPTIONAL)</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional context about how you're feeling..."
                className="w-full border-2 border-[#33272a] bg-[#fffffc] p-2 h-20 font-pixel text-sm"
              />
            </div>
            
            <KrilinButton 
              onClick={submitMoodEntry}
              className={`w-full ${selectedActivities.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              SAVE MOOD ENTRY
            </KrilinButton>
          </div>
        </KrilinCard>
      )}
      
      {/* Navigation Tabs */}
      <div className="flex gap-2">
        <KrilinButton 
          variant={viewMode === 'today' ? "primary" : "secondary"}
          onClick={() => setViewMode('today')}
        >
          TODAY
        </KrilinButton>
        
        <KrilinButton 
          variant={viewMode === 'week' ? "primary" : "secondary"}
          onClick={() => setViewMode('week')}
        >
          WEEK VIEW
        </KrilinButton>
        
        <KrilinButton 
          variant={viewMode === 'insights' ? "primary" : "secondary"}
          onClick={() => setViewMode('insights')}
        >
          INSIGHTS
        </KrilinButton>
      </div>
      
      {/* Today's Mood Summary */}
      {viewMode === 'today' && (
        <>
          <KrilinCard title="TODAY'S MOOD SUMMARY">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <h3 className="font-pixel text-sm text-[#33272a]">AVERAGE MOOD</h3>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-pixel text-xs text-[#594a4e]">POOR</span>
                  <span className="font-pixel text-xs text-[#594a4e]">EXCELLENT</span>
                </div>
                <KrilinPowerMeter value={(calculateAverageMood() / 5) * 100} />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-pixel text-sm text-[#33272a]">AVERAGE ENERGY</h3>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-pixel text-xs text-[#594a4e]">LOW</span>
                  <span className="font-pixel text-xs text-[#594a4e]">HIGH</span>
                </div>
                <KrilinPowerMeter value={(calculateAverageEnergy() / 3) * 100} />
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="text-4xl mb-2">{moodEmojis[currentMood]}</div>
                <div className="font-pixel text-xs text-[#594a4e]">CURRENT MOOD</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-2">{energyIcons[currentEnergy]}</div>
                <div className="font-pixel text-xs text-[#594a4e]">CURRENT ENERGY</div>
              </div>
            </div>
            
            <div className="border-2 border-[#33272a] p-3 bg-[#f8f8f8]">
              <h3 className="font-pixel text-sm text-[#33272a] mb-2">MOOD PATTERN</h3>
              <div className="relative h-40">
                {/* Time markers */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between">
                  <span className="font-pixel text-xs text-[#594a4e]">6AM</span>
                  <span className="font-pixel text-xs text-[#594a4e]">12PM</span>
                  <span className="font-pixel text-xs text-[#594a4e]">6PM</span>
                  <span className="font-pixel text-xs text-[#594a4e]">12AM</span>
                </div>
                
                {/* Mood line chart (simplified) */}
                <div className="absolute top-0 left-0 right-0 bottom-6 flex items-end">
                  {moodEntries.map((entry, index) => {
                    const timePercent = ((entry.timestamp.getHours() * 60 + entry.timestamp.getMinutes()) / (24 * 60)) * 100
                    const moodHeight = (getMoodScore(entry.mood) / 5) * 100
                    return (
                      <div 
                        key={entry.id}
                        className="absolute group"
                        style={{ 
                          left: `${timePercent}%`, 
                          bottom: 0,
                        }}
                      >
                        <div 
                          className="w-2 rounded-t-full"
                          style={{ 
                            height: `${moodHeight}%`,
                            backgroundColor: getMoodColor(entry.mood)
                          }}
                        ></div>
                        
                        {/* Tooltip on hover */}
                        <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-44 bg-white border-2 border-[#33272a] p-2 z-10 font-pixel text-xs">
                          <div className="font-semibold">{formatTime(entry.timestamp)}</div>
                          <div>Mood: {entry.mood} {moodEmojis[entry.mood]}</div>
                          <div>Energy: {entry.energy} {energyIcons[entry.energy]}</div>
                          {entry.activities.length > 0 && (
                            <div className="mt-1">Activities: {entry.activities.join(', ')}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </KrilinCard>
          
          {/* Mood Entries List */}
          <KrilinCard title={`TODAY'S MOOD ENTRIES (${moodEntries.length})`}>
            <div className="space-y-3">
              {moodEntries.length === 0 ? (
                <div className="text-center p-4 border-2 border-dashed border-[#33272a]">
                  <p className="font-pixel text-sm text-[#594a4e]">
                    No mood entries yet. Click "LOG CURRENT MOOD" to add one.
                  </p>
                </div>
              ) : (
                moodEntries
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map(entry => (
                    <div key={entry.id} className="border-2 border-[#33272a] bg-[#fffffc]">
                      <div className="bg-[#594a4e] text-white p-2 flex justify-between items-center">
                        <div className="font-pixel text-sm">
                          {formatTime(entry.timestamp)}
                        </div>
                        <div className="flex items-center gap-3">
                          <div>{moodEmojis[entry.mood]}</div>
                          <div>{energyIcons[entry.energy]}</div>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        {entry.activities.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1">
                            {entry.activities.map(activity => (
                              <span 
                                key={activity} 
                                className="px-2 py-0.5 bg-[#f5f5f5] font-pixel text-xs"
                              >
                                {activity}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {entry.notes && (
                          <p className="font-pixel text-sm text-[#33272a]">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </KrilinCard>
        </>
      )}
      
      {/* Week View */}
      {viewMode === 'week' && (
        <KrilinCard title="WEEKLY MOOD & ENERGY PATTERNS">
          <div className="space-y-6">
            {/* Week visualization - simplified for demo */}
            <div className="border-2 border-[#33272a] p-4">
              <h3 className="font-pixel text-sm text-[#33272a] mb-4">THIS WEEK'S MOOD</h3>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  // Generate random mood/energy for sample data
                  const mood = ['excellent', 'good', 'neutral', 'low', 'poor'][
                    Math.floor(Math.random() * 4)
                  ] as Mood
                  const energy = ['high', 'medium', 'low'][
                    Math.floor(Math.random() * 3)
                  ] as Energy
                  
                  return (
                    <div 
                      key={day} 
                      className={`p-2 border-2 ${i === 3 ? 'border-[#33272a]' : 'border-[#e5e5e5]'}`}
                    >
                      <div className="font-pixel text-xs text-center text-[#594a4e] mb-1">{day}</div>
                      <div className="flex flex-col items-center">
                        <div className="text-xl mb-1">{moodEmojis[mood]}</div>
                        <div className="text-xs">{energyIcons[energy]}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Activity breakdown */}
            <div className="border-2 border-[#33272a] p-4">
              <h3 className="font-pixel text-sm text-[#33272a] mb-4">WEEKLY ACTIVITY TRENDS</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Work', 'Exercise', 'Social', 'Rest', 'Creative'].map(activity => {
                  const count = Math.floor(Math.random() * 10) + 1
                  return (
                    <div key={activity} className="p-2 bg-[#f5f5f5]">
                      <div className="font-pixel text-sm text-[#33272a] mb-1">{activity}</div>
                      <div className="flex items-center gap-1">
                        <div className="font-pixel text-md text-[#ff6b35] font-bold">{count}</div>
                        <div className="font-pixel text-xs text-[#594a4e]">times</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="font-pixel text-xs text-center text-[#594a4e] p-2 border-2 border-dashed border-[#33272a]">
              Log your mood consistently to see more detailed weekly patterns and trends.
            </div>
          </div>
        </KrilinCard>
      )}
      
      {/* Insights View */}
      {viewMode === 'insights' && (
        <KrilinCard title="MOOD & PRODUCTIVITY INSIGHTS">
          <div className="space-y-6">
            {generateInsights().map((insight, index) => (
              <div key={index} className="border-2 border-[#33272a] bg-[#fffffc] overflow-hidden">
                <div className="bg-[#ffc15e] px-3 py-2">
                  <h3 className="font-pixel text-sm text-[#33272a]">{insight.title}</h3>
                </div>
                <div className="p-4">
                  <p className="font-pixel text-sm text-[#594a4e]">{insight.description}</p>
                </div>
              </div>
            ))}
            
            <div className="border-2 border-[#33272a] p-4 space-y-4">
              <h3 className="font-pixel text-sm text-[#33272a]">DID YOU KNOW?</h3>
              <p className="font-pixel text-sm text-[#594a4e]">
                Research shows that tracking your mood can help you identify patterns that affect your productivity and well-being.
              </p>
              <p className="font-pixel text-sm text-[#594a4e]">
                Try logging your mood at the same times each day for the most accurate insights.
              </p>
            </div>
            
            <div className="border-2 border-[#33272a] p-4">
              <h3 className="font-pixel text-sm text-[#33272a] mb-3">RECOMMENDED ACTIONS</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-[#ffc15e] flex-shrink-0 flex items-center justify-center font-pixel">1</div>
                  <p className="font-pixel text-sm text-[#33272a]">
                    Schedule important tasks during your peak energy hours.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-[#ffc15e] flex-shrink-0 flex items-center justify-center font-pixel">2</div>
                  <p className="font-pixel text-sm text-[#33272a]">
                    Add more of your positive-mood activities to your daily routine.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-[#ffc15e] flex-shrink-0 flex items-center justify-center font-pixel">3</div>
                  <p className="font-pixel text-sm text-[#33272a]">
                    Take short breaks when you notice your energy dropping significantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </KrilinCard>
      )}
    </div>
  )
}
