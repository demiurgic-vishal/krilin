"use client"

import { useState } from "react"
import KrilinCard from "../krilin-card"
import KrilinButton from "../krilin-button"
import KrilinPowerMeter from "../krilin-power-meter"

// Types
type SleepQualityEntry = {
  id: number;
  date: Date;
  hoursSlept: number;
  quality: 1 | 2 | 3 | 4 | 5;
  factors: string[];
  notes: string;
}

// Research-backed sleep improvement factors
const sleepFactors = [
  {
    name: "Consistent schedule",
    impact: "high",
    description: "Going to bed and waking up at the same time daily regulates your body's internal clock.",
    research: "Journal of Sleep Research, 2018"
  },
  {
    name: "Screen-free hour",
    impact: "high",
    description: "Avoiding screens at least 1 hour before bed reduces blue light exposure that delays melatonin production.",
    research: "Proceedings of the National Academy of Sciences, 2015"
  },
  {
    name: "Cool bedroom",
    impact: "medium",
    description: "Keeping your bedroom between 65-68°F (18-20°C) helps facilitate falling asleep.",
    research: "Sleep Medicine Reviews, 2012"
  },
  {
    name: "Limited caffeine",
    impact: "high",
    description: "Avoiding caffeine at least 6 hours before bedtime prevents sleep disruption.",
    research: "Journal of Clinical Sleep Medicine, 2013"
  },
  {
    name: "Physical activity",
    impact: "medium",
    description: "Regular exercise (not too close to bedtime) improves sleep quality.",
    research: "Sleep Medicine Reviews, 2018"
  },
  {
    name: "Relaxation routine",
    impact: "medium",
    description: "Calming pre-sleep activities like reading or gentle stretching signal your body it's time to sleep.",
    research: "Sleep Medicine, 2010"
  },
  {
    name: "Dark room",
    impact: "medium",
    description: "Eliminating light sources in the bedroom improves melatonin production.",
    research: "Journal of Pineal Research, 2011"
  },
  {
    name: "Limited alcohol",
    impact: "high",
    description: "Minimizing alcohol consumption improves sleep quality and REM sleep.",
    research: "Alcoholism: Clinical & Experimental Research, 2013"
  }
]

// Research findings
const sleepResearch = [
  {
    title: "Sleep and Mental Health",
    finding: "Sleep problems are closely linked to mental health issues. Insomnia is a risk factor for depression and anxiety, and improving sleep can alleviate symptoms.",
    source: "Journal of Clinical Psychiatry, 2016"
  },
  {
    title: "Memory Consolidation",
    finding: "Deep sleep plays a critical role in memory consolidation and cognitive function. 7-9 hours of quality sleep improves learning and problem-solving abilities.",
    source: "Neuron, 2014"
  },
  {
    title: "Emotional Regulation",
    finding: "Sleep deprivation amplifies negative emotional responses by up to 60% and reduces positive emotional responses, affecting mood regulation.",
    source: "Journal of Neuroscience, 2010"
  },
  {
    title: "Immune Function",
    finding: "During sleep, the immune system releases cytokines that help fight infections. Consistent poor sleep increases susceptibility to illness.",
    source: "Sleep Medicine Reviews, 2017"
  },
  {
    title: "Cognitive Performance",
    finding: "Just one night of poor sleep can impair cognitive performance similar to having a blood alcohol level of 0.10%.",
    source: "Occupational and Environmental Medicine, 2000"
  }
]

export default function KrilinSleepQuality() {
  // Sample historical entries
  const [sleepEntries, setSleepEntries] = useState<SleepQualityEntry[]>([
    {
      id: 1,
      date: new Date(new Date().setDate(new Date().getDate() - 3)),
      hoursSlept: 6.5,
      quality: 3,
      factors: ["Screen-free hour", "Cool bedroom"],
      notes: "Woke up once during the night. Had caffeine in the afternoon."
    },
    {
      id: 2,
      date: new Date(new Date().setDate(new Date().getDate() - 2)),
      hoursSlept: 7.5,
      quality: 4,
      factors: ["Consistent schedule", "Limited caffeine", "Physical activity"],
      notes: "Exercised in the morning, felt more tired by bedtime."
    },
    {
      id: 3,
      date: new Date(new Date().setDate(new Date().getDate() - 1)),
      hoursSlept: 8,
      quality: 5,
      factors: ["Consistent schedule", "Screen-free hour", "Relaxation routine", "Dark room"],
      notes: "Read for 30 minutes before bed. Best sleep in weeks."
    }
  ])

  // Entry form state
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [hoursSlept, setHoursSlept] = useState(7)
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [selectedFactors, setSelectedFactors] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  
  // View state
  const [viewMode, setViewMode] = useState<'tracker' | 'insights' | 'science'>('tracker')
  
  // Add a new entry
  const addSleepEntry = () => {
    const newEntry: SleepQualityEntry = {
      id: Date.now(),
      date: new Date(),
      hoursSlept,
      quality: sleepQuality,
      factors: selectedFactors,
      notes
    }
    
    setSleepEntries([newEntry, ...sleepEntries])
    
    // Reset form
    setHoursSlept(7)
    setSleepQuality(3)
    setSelectedFactors([])
    setNotes("")
    setShowEntryForm(false)
  }
  
  // Toggle sleep factor selection
  const toggleFactor = (factor: string) => {
    if (selectedFactors.includes(factor)) {
      setSelectedFactors(selectedFactors.filter(f => f !== factor))
    } else {
      setSelectedFactors([...selectedFactors, factor])
    }
  }
  
  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }
  
  // Calculate sleep statistics
  const getSleepStats = () => {
    if (sleepEntries.length === 0) {
      return {
        averageHours: 0,
        averageQuality: 0,
        mostEffectiveFactors: [],
        sleepDeficit: 0
      }
    }
    
    // Calculate average hours slept
    const totalHours = sleepEntries.reduce((sum, entry) => sum + entry.hoursSlept, 0)
    const averageHours = totalHours / sleepEntries.length
    
    // Calculate average quality score
    const totalQuality = sleepEntries.reduce((sum, entry) => sum + entry.quality, 0)
    const averageQuality = totalQuality / sleepEntries.length
    
    // Find most effective factors
    const factorEffectiveness: {[key: string]: {count: number, avgQuality: number}} = {}
    
    sleepEntries.forEach(entry => {
      entry.factors.forEach(factor => {
        if (!factorEffectiveness[factor]) {
          factorEffectiveness[factor] = { count: 0, avgQuality: 0 }
        }
        factorEffectiveness[factor].count += 1
        factorEffectiveness[factor].avgQuality += entry.quality
      })
    })
    
    // Calculate average quality score for each factor
    Object.keys(factorEffectiveness).forEach(factor => {
      factorEffectiveness[factor].avgQuality /= factorEffectiveness[factor].count
    })
    
    // Sort factors by effectiveness (quality score) and frequency
    const mostEffectiveFactors = Object.entries(factorEffectiveness)
      .filter(([_, data]) => data.count >= 2) // Require at least 2 data points
      .sort((a, b) => {
        // Primary sort by quality score
        if (b[1].avgQuality !== a[1].avgQuality) {
          return b[1].avgQuality - a[1].avgQuality
        }
        // Secondary sort by frequency
        return b[1].count - a[1].count
      })
      .slice(0, 3) // Top 3 factors
      .map(([factor]) => factor)
    
    // Calculate sleep deficit (assuming 8 hours is ideal)
    const sleepDeficit = Math.max(0, 8 - averageHours)
    
    return {
      averageHours,
      averageQuality,
      mostEffectiveFactors,
      sleepDeficit
    }
  }
  
  // Generate personalized sleep insights
  const getSleepInsights = () => {
    const stats = getSleepStats()
    
    if (sleepEntries.length < 3) {
      return "Log sleep for at least 3 days to receive personalized insights."
    }
    
    let insights = []
    
    // Sleep duration insights
    if (stats.averageHours < 6) {
      insights.push("You're getting significantly less sleep than the recommended 7-9 hours. Chronic sleep deprivation increases risk for mood disorders and impairs cognitive function.")
    } else if (stats.averageHours < 7) {
      insights.push("You're getting slightly less than the recommended 7-9 hours of sleep. Try going to bed 30 minutes earlier.")
    } else if (stats.averageHours > 9) {
      insights.push("You're averaging more than 9 hours of sleep. While this might be what your body needs, excessive sleep can sometimes be linked to depression or other health issues.")
    } else {
      insights.push("Your sleep duration is within the ideal range of 7-9 hours. Maintaining this consistency supports optimal cognitive and emotional functioning.")
    }
    
    // Quality insights
    if (stats.averageQuality < 3) {
      insights.push("Your sleep quality scores are low. Focus on sleep hygiene factors like consistent schedule and screen-free time before bed.")
    } else if (stats.averageQuality >= 4) {
      insights.push("Your sleep quality scores are good! You're implementing effective sleep hygiene practices.")
    }
    
    // Effective factors
    if (stats.mostEffectiveFactors.length > 0) {
      insights.push(`Your data shows that ${stats.mostEffectiveFactors.join(", ")} ${stats.mostEffectiveFactors.length === 1 ? 'is' : 'are'} particularly effective for your sleep quality. Try to maintain these practices consistently.`)
    }
    
    return insights.join(" ")
  }
  
  // Get recommended sleep factors based on entries
  const getRecommendedFactors = () => {
    if (sleepEntries.length < 3) return sleepFactors.slice(0, 3)
    
    // Find which factors are used the least
    const factorUsage: {[key: string]: number} = {}
    sleepFactors.forEach(factor => {
      factorUsage[factor.name] = 0
    })
    
    sleepEntries.forEach(entry => {
      entry.factors.forEach(factor => {
        if (factorUsage[factor] !== undefined) {
          factorUsage[factor] += 1
        }
      })
    })
    
    // Find high impact factors that are used less frequently
    return sleepFactors
      .filter(factor => factorUsage[factor.name] < sleepEntries.length / 2)
      .sort((a, b) => {
        // Sort by impact first
        if (a.impact === "high" && b.impact !== "high") return -1
        if (a.impact !== "high" && b.impact === "high") return 1
        
        // Then by usage (less frequent first)
        return factorUsage[a.name] - factorUsage[b.name]
      })
      .slice(0, 3)
  }
  
  // Get quality stars
  const getQualityStars = (quality: number) => {
    return "★".repeat(quality) + "☆".repeat(5 - quality)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-pixel text-xl text-[#33272a]">SLEEP QUALITY TRACKER</h2>
        <KrilinButton 
          onClick={() => setShowEntryForm(!showEntryForm)}
          variant="primary"
        >
          {showEntryForm ? "CANCEL" : "LOG SLEEP"}
        </KrilinButton>
      </div>
      
      {/* Entry Form */}
      {showEntryForm && (
        <KrilinCard title="LOG LAST NIGHT'S SLEEP">
          <div className="space-y-6">
            {/* Hours slept */}
            <div className="space-y-2">
              <h3 className="font-pixel text-sm text-[#33272a]">HOURS SLEPT</h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="3"
                  max="12"
                  step="0.5"
                  value={hoursSlept}
                  onChange={(e) => setHoursSlept(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="font-pixel text-lg text-[#33272a]">{hoursSlept}</span>
              </div>
              <div className="flex justify-between text-xs font-pixel text-[#594a4e]">
                <span>3</span>
                <span>7.5</span>
                <span>12</span>
              </div>
            </div>
            
            {/* Sleep quality */}
            <div className="space-y-2">
              <h3 className="font-pixel text-sm text-[#33272a]">SLEEP QUALITY</h3>
              <div className="flex justify-between">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setSleepQuality(rating as 1 | 2 | 3 | 4 | 5)}
                    className={`p-3 flex-1 text-xl ${
                      sleepQuality === rating 
                        ? 'bg-[#ffc15e] text-[#33272a]'
                        : 'bg-[#f5f5f5] text-[#594a4e]'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <div className="flex justify-between font-pixel text-xs text-[#594a4e]">
                <span>Poor</span>
                <span className="text-center">Average</span>
                <span className="text-right">Excellent</span>
              </div>
            </div>
            
            {/* Sleep factors */}
            <div className="space-y-2">
              <h3 className="font-pixel text-sm text-[#33272a]">SLEEP FACTORS (SELECT ALL THAT APPLY)</h3>
              <div className="flex flex-wrap gap-2">
                {sleepFactors.map(factor => (
                  <button
                    key={factor.name}
                    onClick={() => toggleFactor(factor.name)}
                    className={`px-3 py-1 text-xs font-pixel rounded-full transition-all ${
                      selectedFactors.includes(factor.name)
                        ? 'bg-[#594a4e] text-white'
                        : 'bg-[#f5f5f5] text-[#33272a] hover:bg-[#e5e5e5]'
                    }`}
                  >
                    {factor.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <h3 className="font-pixel text-sm text-[#33272a]">NOTES (OPTIONAL)</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details about your sleep..."
                className="w-full border-2 border-[#33272a] bg-[#fffffc] p-2 h-20 font-pixel text-sm"
              />
            </div>
            
            <KrilinButton 
              onClick={addSleepEntry}
              className="w-full"
            >
              SAVE SLEEP ENTRY
            </KrilinButton>
          </div>
        </KrilinCard>
      )}
      
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        <KrilinButton 
          variant={viewMode === 'tracker' ? "primary" : "secondary"}
          onClick={() => setViewMode('tracker')}
        >
          TRACKER
        </KrilinButton>
        
        <KrilinButton 
          variant={viewMode === 'insights' ? "primary" : "secondary"}
          onClick={() => setViewMode('insights')}
        >
          INSIGHTS
        </KrilinButton>
        
        <KrilinButton 
          variant={viewMode === 'science' ? "primary" : "secondary"}
          onClick={() => setViewMode('science')}
        >
          RESEARCH
        </KrilinButton>
      </div>
      
      {/* Tracker View */}
      {viewMode === 'tracker' && (
        <div className="space-y-4">
          {/* Sleep Summary */}
          <KrilinCard title="SLEEP SUMMARY">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <h3 className="font-pixel text-sm text-[#33272a]">AVERAGE HOURS</h3>
                <div className="flex items-end">
                  <span className="font-pixel text-3xl text-[#ff6b35]">
                    {getSleepStats().averageHours.toFixed(1)}
                  </span>
                  <span className="font-pixel text-sm text-[#594a4e] ml-1 mb-1">hrs</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="font-pixel text-xs text-[#594a4e]">Under</span>
                  <span className="font-pixel text-xs text-[#594a4e]">Optimal</span>
                </div>
                <KrilinPowerMeter value={Math.min(100, (getSleepStats().averageHours / 9) * 100)} />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-pixel text-sm text-[#33272a]">SLEEP QUALITY</h3>
                <div className="flex items-end">
                  <span className="font-pixel text-3xl text-[#ff6b35]">
                    {getSleepStats().averageQuality.toFixed(1)}
                  </span>
                  <span className="font-pixel text-sm text-[#594a4e] ml-1 mb-1">/5</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="font-pixel text-xs text-[#594a4e]">Poor</span>
                  <span className="font-pixel text-xs text-[#594a4e]">Excellent</span>
                </div>
                <KrilinPowerMeter value={(getSleepStats().averageQuality / 5) * 100} />
              </div>
            </div>
            
            {/* Effective factors */}
            {getSleepStats().mostEffectiveFactors.length > 0 && (
              <div className="p-3 border-2 border-[#ffc15e] bg-[#fff8e8]">
                <h3 className="font-pixel text-sm text-[#33272a] mb-2">YOUR MOST EFFECTIVE SLEEP FACTORS</h3>
                <div className="space-y-1">
                  {getSleepStats().mostEffectiveFactors.map((factor, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#ffc15e] flex-shrink-0 flex items-center justify-center font-pixel">
                        {index + 1}
                      </div>
                      <span className="font-pixel text-sm text-[#33272a]">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </KrilinCard>
          
          {/* Sleep History */}
          <KrilinCard title="SLEEP HISTORY">
            <div className="space-y-4">
              {sleepEntries.length === 0 ? (
                <div className="text-center p-4 border-2 border-dashed border-[#33272a]">
                  <p className="font-pixel text-sm text-[#594a4e]">
                    No sleep entries yet. Click "LOG SLEEP" to start tracking your sleep.
                  </p>
                </div>
              ) : (
                sleepEntries
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .map(entry => (
                    <div key={entry.id} className="border-2 border-[#33272a] bg-[#fffffc] overflow-hidden">
                      <div className="bg-[#594a4e] text-white p-2 flex justify-between items-center">
                        <div className="font-pixel text-sm">
                          {formatDate(entry.date)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-pixel text-sm">{entry.hoursSlept}h</span>
                          <span className="text-yellow-300">{getQualityStars(entry.quality)}</span>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        {entry.factors.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1">
                            {entry.factors.map(factor => (
                              <span 
                                key={factor} 
                                className="px-2 py-0.5 bg-[#f5f5f5] font-pixel text-xs"
                              >
                                {factor}
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
        </div>
      )}
      
      {/* Insights View */}
      {viewMode === 'insights' && (
        <div className="space-y-6">
          <KrilinCard title="YOUR SLEEP INSIGHTS">
            <div className="space-y-4">
              <div className="p-4 border-2 border-[#33272a] bg-[#fffffc]">
                <p className="font-pixel text-sm text-[#33272a]">
                  {getSleepInsights()}
                </p>
              </div>
              
              {/* Lifestyle impact */}
              <div className="bg-[#f8f8f8] p-4 border-2 border-[#33272a]">
                <h3 className="font-pixel text-sm text-[#33272a] mb-3">IMPACT ON YOUR DAY</h3>
                <p className="font-pixel text-sm text-[#594a4e] mb-2">
                  {getSleepStats().sleepDeficit > 1 ? (
                    `Your daily sleep deficit of ${getSleepStats().sleepDeficit.toFixed(1)} hours can reduce cognitive performance by up to ${Math.min(30, Math.round(getSleepStats().sleepDeficit * 15))}% and increase stress reactivity.`
                  ) : (
                    "Your sleep duration supports optimal cognitive function and emotional regulation."
                  )}
                </p>
                
                <div className="flex justify-between items-center mt-4">
                  <span className="font-pixel text-xs text-[#594a4e]">COGNITIVE FUNCTION</span>
                  <span className="font-pixel text-xs text-[#594a4e]">
                    {Math.round(Math.max(60, 100 - getSleepStats().sleepDeficit * 15))}%
                  </span>
                </div>
                <KrilinPowerMeter value={Math.max(60, 100 - getSleepStats().sleepDeficit * 15)} />
                
                <div className="flex justify-between items-center mt-3">
                  <span className="font-pixel text-xs text-[#594a4e]">MOOD STABILITY</span>
                  <span className="font-pixel text-xs text-[#594a4e]">
                    {Math.round(Math.max(60, 100 - getSleepStats().sleepDeficit * 20))}%
                  </span>
                </div>
                <KrilinPowerMeter value={Math.max(60, 100 - getSleepStats().sleepDeficit * 20)} />
              </div>
              
              {/* Recommendations */}
              <div>
                <h3 className="font-pixel text-sm text-[#33272a] mb-3">RECOMMENDED SLEEP FACTORS</h3>
                <div className="space-y-3">
                  {getRecommendedFactors().map((factor, index) => (
                    <div key={index} className="p-3 border-2 border-[#33272a] bg-[#fffffc]">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-pixel text-sm text-[#33272a]">{factor.name}</h4>
                        <span className={`font-pixel text-xs px-2 py-0.5 ${
                          factor.impact === 'high' ? 'bg-[#4CAF50] text-white' : 'bg-[#FFC107]'
                        }`}>
                          {factor.impact === 'high' ? 'HIGH IMPACT' : 'MEDIUM IMPACT'}
                        </span>
                      </div>
                      <p className="font-pixel text-xs text-[#594a4e] mb-1">
                        {factor.description}
                      </p>
                      <p className="font-pixel text-xs italic text-[#594a4e]">
                        Source: {factor.research}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </KrilinCard>
        </div>
      )}
      
      {/* Science View */}
      {viewMode === 'science' && (
        <KrilinCard title="THE SCIENCE OF SLEEP">
          <div className="space-y-5">
            <p className="font-pixel text-sm text-[#33272a]">
              Sleep is a fundamental biological process that affects nearly every aspect of health.
              Here's what research tells us about sleep and mental wellbeing:
            </p>
            
            {/* Research findings */}
            {sleepResearch.map((research, index) => (
              <div key={index} className="border-2 border-[#33272a] bg-[#fffffc] overflow-hidden">
                <div className="bg-[#ffc15e] px-3 py-2">
                  <h3 className="font-pixel text-sm text-[#33272a]">{research.title}</h3>
                </div>
                <div className="p-3">
                  <p className="font-pixel text-sm text-[#594a4e] mb-1">{research.finding}</p>
                  <p className="font-pixel text-xs text-[#33272a] italic">Source: {research.source}</p>
                </div>
              </div>
            ))}
            
            {/* Sleep stages */}
            <div className="p-4 border-2 border-dashed border-[#33272a]">
              <h3 className="font-pixel text-sm text-[#33272a] mb-2">SLEEP ARCHITECTURE</h3>
              <p className="font-pixel text-sm text-[#594a4e] mb-3">
                A healthy sleep cycle includes these stages:
              </p>
              <ul className="space-y-2">
                <li className="font-pixel text-sm text-[#594a4e]">
                  <span className="font-semibold">Light Sleep (N1/N2):</span> Initial relaxation and transition stages
                </li>
                <li className="font-pixel text-sm text-[#594a4e]">
                  <span className="font-semibold">Deep Sleep (N3):</span> Physically restorative, critical for immune function
                </li>
                <li className="font-pixel text-sm text-[#594a4e]">
                  <span className="font-semibold">REM Sleep:</span> Mentally restorative, essential for emotional processing and memory consolidation
                </li>
              </ul>
              <p className="font-pixel text-sm text-[#594a4e] mt-3">
                A full night's sleep includes 4-5 complete cycles of these stages.
              </p>
            </div>
          </div>
        </KrilinCard>
      )}
    </div>
  )
}
