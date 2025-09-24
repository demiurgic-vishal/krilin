"use client"

import { useState, useEffect } from "react"
import KrilinCard from "../krilin-card"
import KrilinButton from "../krilin-button"
import KrilinPowerMeter from "../krilin-power-meter"

// Research-backed meditation techniques
const meditationTechniques = [
  {
    id: 1,
    name: "Focused Attention",
    description: "Focus on a single point such as breath, a mantra, or a sensation.",
    duration: 5,
    benefits: "Improves concentration, reduces anxiety, and increases attention span.",
    researchSource: "American Psychological Association, 2019"
  },
  {
    id: 2,
    name: "Body Scan",
    description: "Systematically focus attention on different parts of your body, from feet to head.",
    duration: 8,
    benefits: "Reduces physical tension, improves body awareness, and helps with stress-related physical symptoms.",
    researchSource: "Journal of Psychosomatic Research, 2017"
  },
  {
    id: 3,
    name: "Loving-Kindness",
    description: "Direct positive wishes and goodwill toward yourself and others.",
    duration: 10,
    benefits: "Increases positive emotions, decreases negative emotions, and improves personal resources.",
    researchSource: "Journal of Personality and Social Psychology, 2008"
  },
  {
    id: 4,
    name: "Mindful Observation",
    description: "Observe thoughts, feelings, and sensations without judgment or reaction.",
    duration: 7,
    benefits: "Reduces rumination, improves emotional regulation, and increases self-awareness.",
    researchSource: "Clinical Psychology Review, 2016"
  }
]

// Research-backed mindfulness benefits
const mindfulnessBenefits = [
  {
    title: "Reduced Stress and Anxiety",
    description: "Regular mindfulness meditation lowers cortisol levels and decreases symptoms of anxiety.",
    source: "JAMA Internal Medicine, 2014"
  },
  {
    title: "Improved Focus and Attention",
    description: "Just 10 minutes of daily meditation enhances attention and executive function.",
    source: "Psychological Science, 2013"
  },
  {
    title: "Emotional Regulation",
    description: "Mindfulness practice strengthens neural pathways involved in emotion regulation.",
    source: "Frontiers in Human Neuroscience, 2012"
  },
  {
    title: "Better Sleep Quality",
    description: "Mindfulness meditation improves sleep quality and reduces insomnia symptoms.",
    source: "JAMA Internal Medicine, 2015"
  },
  {
    title: "Enhanced Resilience",
    description: "Regular practice increases resilience to stressors and improves coping abilities.",
    source: "Behaviour Research and Therapy, 2017"
  }
]

export default function KrilinMindfulness() {
  // State for meditation session
  const [isActive, setIsActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [selectedTechnique, setSelectedTechnique] = useState(meditationTechniques[0])
  const [viewMode, setViewMode] = useState<'practice' | 'science' | 'history'>('practice')
  const [showGuidance, setShowGuidance] = useState(true)
  
  // Track meditation history
  const [meditationHistory, setMeditationHistory] = useState([
    { date: new Date(new Date().setDate(new Date().getDate() - 3)), duration: 5, technique: "Focused Attention" },
    { date: new Date(new Date().setDate(new Date().getDate() - 2)), duration: 8, technique: "Body Scan" },
    { date: new Date(new Date().setDate(new Date().getDate() - 1)), duration: 5, technique: "Focused Attention" }
  ])
  
  // Calculate stats
  const getTotalMinutes = () => {
    return meditationHistory.reduce((sum, session) => sum + session.duration, 0)
  }
  
  const getCurrentStreak = () => {
    if (meditationHistory.length === 0) return 0
    
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Check if meditated today
    const meditatedToday = meditationHistory.some(session => {
      const sessionDate = new Date(session.date)
      sessionDate.setHours(0, 0, 0, 0)
      return sessionDate.getTime() === today.getTime()
    })
    
    if (meditatedToday) streak = 1
    
    // Check previous days
    for (let i = 1; i <= 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      checkDate.setHours(0, 0, 0, 0)
      
      const meditatedOnDate = meditationHistory.some(session => {
        const sessionDate = new Date(session.date)
        sessionDate.setHours(0, 0, 0, 0)
        return sessionDate.getTime() === checkDate.getTime()
      })
      
      if (meditatedOnDate) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Start meditation session
  const startMeditation = () => {
    setTimeRemaining(selectedTechnique.duration * 60)
    setIsActive(true)
    setShowGuidance(true)
  }
  
  // Stop meditation session
  const stopMeditation = () => {
    setIsActive(false)
  }
  
  // Complete meditation session
  const completeMeditation = () => {
    setIsActive(false)
    
    // Record the session
    setMeditationHistory([
      ...meditationHistory,
      { 
        date: new Date(), 
        duration: selectedTechnique.duration, 
        technique: selectedTechnique.name 
      }
    ])
  }
  
  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1)
      }, 1000)
    } else if (isActive && timeRemaining === 0) {
      completeMeditation()
    }
    
    return () => clearInterval(interval)
  }, [isActive, timeRemaining])
  
  // Calculate progress percentage
  const progressPercentage = isActive 
    ? (1 - timeRemaining / (selectedTechnique.duration * 60)) * 100
    : 0

  // Get guidance text based on current technique and time
  const getGuidanceText = () => {
    const totalSeconds = selectedTechnique.duration * 60
    const elapsed = totalSeconds - timeRemaining
    const phase = Math.floor(elapsed / (totalSeconds / 3))
    
    if (selectedTechnique.name === "Focused Attention") {
      switch(phase) {
        case 0: return "Find a comfortable position. Focus on your breath. Notice the sensation of air flowing in and out."
        case 1: return "When your mind wanders, gently bring attention back to your breath without judgment."
        case 2: return "Continue focusing on your breath. Notice how your body feels more relaxed with each breath."
      }
    } else if (selectedTechnique.name === "Body Scan") {
      switch(phase) {
        case 0: return "Start by bringing awareness to your feet and legs. Notice any sensations without trying to change them."
        case 1: return "Move your attention to your torso, arms, and hands. Notice areas of tension and allow them to soften."
        case 2: return "Bring awareness to your neck, face, and head. Let go of any remaining tension as you scan."
      }
    } else if (selectedTechnique.name === "Loving-Kindness") {
      switch(phase) {
        case 0: return "Begin by directing kind wishes to yourself: 'May I be happy, may I be healthy, may I be safe.'"
        case 1: return "Now extend these wishes to someone you care about: 'May they be happy, healthy, and safe.'"
        case 2: return "Gradually extend these wishes outward to all people: 'May all beings be happy, healthy, and safe.'"
      }
    } else if (selectedTechnique.name === "Mindful Observation") {
      switch(phase) {
        case 0: return "Observe your thoughts as they arise. Picture them as clouds passing through the sky of your mind."
        case 1: return "Notice any emotions or physical sensations that arise. Observe them with curiosity, not judgment."
        case 2: return "Continue observing your experience. You don't need to change anything, just be aware of what's happening."
      }
    }
    
    return "Focus on your breath and stay present in this moment."
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-pixel text-xl text-[#33272a]">MINDFULNESS MEDITATION</h2>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        <KrilinButton 
          variant={viewMode === 'practice' ? "primary" : "secondary"}
          onClick={() => setViewMode('practice')}
        >
          PRACTICE
        </KrilinButton>
        
        <KrilinButton 
          variant={viewMode === 'science' ? "primary" : "secondary"}
          onClick={() => setViewMode('science')}
        >
          RESEARCH
        </KrilinButton>
        
        <KrilinButton 
          variant={viewMode === 'history' ? "primary" : "secondary"}
          onClick={() => setViewMode('history')}
        >
          HISTORY
        </KrilinButton>
      </div>
      
      {/* Practice View */}
      {viewMode === 'practice' && (
        <div className="space-y-6">
          {/* Active Meditation Session */}
          {isActive ? (
            <KrilinCard title="MEDITATION IN PROGRESS">
              <div className="text-center space-y-6">
                {/* Timer Display */}
                <div className="flex justify-center">
                  <div className="text-6xl font-pixel p-6 inline-block border-4 text-[#ff6b35] border-[#ff6b35]">
                    {formatTime(timeRemaining)}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-pixel text-xs text-[#594a4e]">
                      {selectedTechnique.name}
                    </span>
                    <span className="font-pixel text-xs text-[#594a4e]">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <KrilinPowerMeter value={progressPercentage} />
                </div>
                
                {/* Guidance */}
                {showGuidance && (
                  <div className="p-4 bg-[#fff8e8] border-2 border-[#ffc15e] text-center">
                    <p className="font-pixel text-sm text-[#33272a] mb-2">
                      {getGuidanceText()}
                    </p>
                    <button 
                      onClick={() => setShowGuidance(false)}
                      className="text-xs font-pixel underline text-[#ff6b35]"
                    >
                      Hide Guidance
                    </button>
                  </div>
                )}
                
                {/* Controls */}
                <KrilinButton onClick={stopMeditation} variant="primary">
                  END SESSION
                </KrilinButton>
              </div>
            </KrilinCard>
          ) : (
            /* Meditation Technique Selection */
            <KrilinCard title="SELECT A PRACTICE">
              <div className="space-y-4">
                {meditationTechniques.map(technique => (
                  <div 
                    key={technique.id} 
                    className={`p-4 border-2 ${
                      selectedTechnique.id === technique.id 
                        ? 'border-[#ff6b35] bg-[#fff8e8]'
                        : 'border-[#33272a] bg-[#fffffc]'
                    } cursor-pointer`}
                    onClick={() => setSelectedTechnique(technique)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-pixel text-sm text-[#33272a]">{technique.name}</h3>
                      <span className="font-pixel text-xs text-[#594a4e]">{technique.duration} MIN</span>
                    </div>
                    <p className="font-pixel text-xs text-[#594a4e] mb-2">
                      {technique.description}
                    </p>
                    <p className="font-pixel text-xs italic text-[#ff6b35]">
                      Benefit: {technique.benefits}
                    </p>
                  </div>
                ))}
                
                <KrilinButton onClick={startMeditation} className="w-full">
                  START MEDITATION ({selectedTechnique.duration} MIN)
                </KrilinButton>
              </div>
            </KrilinCard>
          )}
          
          {/* Meditation Stats */}
          {!isActive && (
            <KrilinCard title="YOUR MEDITATION STATS">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
                  <div className="font-pixel text-2xl text-[#ff6b35]">{meditationHistory.length}</div>
                  <div className="font-pixel text-xs text-[#594a4e]">TOTAL SESSIONS</div>
                </div>
                
                <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
                  <div className="font-pixel text-2xl text-[#ff6b35]">{getTotalMinutes()}</div>
                  <div className="font-pixel text-xs text-[#594a4e]">TOTAL MINUTES</div>
                </div>
                
                <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
                  <div className="font-pixel text-2xl text-[#ff6b35]">{getCurrentStreak()}</div>
                  <div className="font-pixel text-xs text-[#594a4e]">CURRENT STREAK</div>
                </div>
                
                <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
                  <div className="font-pixel text-2xl text-[#ff6b35]">
                    {meditationHistory.length > 0 
                      ? Math.round(getTotalMinutes() / meditationHistory.length) 
                      : 0}
                  </div>
                  <div className="font-pixel text-xs text-[#594a4e]">AVG MINUTES</div>
                </div>
              </div>
              
              <div className="font-pixel text-sm text-center text-[#594a4e] p-2 border-2 border-dashed border-[#33272a] bg-[#fffaeb]">
                Research shows 10 minutes of daily meditation can reduce stress and improve focus.
              </div>
            </KrilinCard>
          )}
        </div>
      )}
      
      {/* Science View */}
      {viewMode === 'science' && (
        <KrilinCard title="THE SCIENCE OF MINDFULNESS">
          <div className="space-y-4">
            <p className="font-pixel text-sm text-[#33272a]">
              Research has consistently demonstrated that mindfulness meditation improves mental health.
              Here are some key benefits supported by scientific studies:
            </p>
            
            {mindfulnessBenefits.map((benefit, index) => (
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
              <h3 className="font-pixel text-sm text-[#33272a] mb-2">HOW MINDFULNESS WORKS</h3>
              <p className="font-pixel text-sm text-[#594a4e]">
                Mindfulness meditation works through several neurobiological mechanisms:
              </p>
              <ul className="mt-2 space-y-2">
                <li className="font-pixel text-sm text-[#594a4e]">
                  • Increases activity in the prefrontal cortex (responsible for attention)
                </li>
                <li className="font-pixel text-sm text-[#594a4e]">
                  • Reduces activity in the amygdala (the brain's stress center)
                </li>
                <li className="font-pixel text-sm text-[#594a4e]">
                  • Strengthens neural connections for focus and emotional regulation
                </li>
                <li className="font-pixel text-sm text-[#594a4e]">
                  • Increases gray matter density in brain regions associated with learning
                </li>
              </ul>
            </div>
          </div>
        </KrilinCard>
      )}
      
      {/* History View */}
      {viewMode === 'history' && (
        <KrilinCard title="YOUR MEDITATION HISTORY">
          <div className="space-y-4">
            {meditationHistory.length === 0 ? (
              <div className="text-center p-4 border-2 border-dashed border-[#33272a]">
                <p className="font-pixel text-sm text-[#594a4e]">
                  No meditation sessions recorded yet. Start a practice to track your progress.
                </p>
              </div>
            ) : (
              <>
                {/* Weekly view - simplified */}
                <div className="border-2 border-[#33272a] p-4">
                  <h3 className="font-pixel text-sm text-[#33272a] mb-4">THIS WEEK</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                      const today = new Date()
                      const dayDate = new Date()
                      dayDate.setDate(today.getDate() - today.getDay() + i + 1)
                      dayDate.setHours(0, 0, 0, 0)
                      
                      // Check if meditated on this day
                      const meditatedOnDay = meditationHistory.some(session => {
                        const sessionDate = new Date(session.date)
                        sessionDate.setHours(0, 0, 0, 0)
                        return sessionDate.getTime() === dayDate.getTime()
                      })
                      
                      return (
                        <div 
                          key={day} 
                          className={`p-2 border-2 ${
                            // Highlight today
                            today.getDay() === i + 1 ? 'border-[#33272a]' : 'border-[#e5e5e5]'
                          }`}
                        >
                          <div className="font-pixel text-xs text-center text-[#594a4e] mb-1">{day}</div>
                          <div className="flex flex-col items-center">
                            <div className={`text-xl ${meditatedOnDay ? 'text-[#ff6b35]' : 'text-[#e5e5e5]'}`}>
                              ●
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Recent sessions */}
                <h3 className="font-pixel text-sm text-[#33272a]">RECENT SESSIONS</h3>
                <div className="space-y-2">
                  {meditationHistory
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((session, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center p-3 border-2 border-[#33272a] bg-[#fffffc]"
                      >
                        <div>
                          <div className="font-pixel text-sm text-[#33272a]">{session.technique}</div>
                          <div className="font-pixel text-xs text-[#594a4e]">
                            {new Date(session.date).toLocaleDateString()} • {session.duration} min
                          </div>
                        </div>
                        <div className="w-8 h-8 bg-[#ffc15e] flex items-center justify-center font-pixel">
                          ✓
                        </div>
                      </div>
                    ))
                  }
                </div>
              </>
            )}
            
            <div className="font-pixel text-sm text-center text-[#594a4e] mt-4">
              Tracking your meditation practice helps build consistency and maintains motivation.
            </div>
          </div>
        </KrilinCard>
      )}
    </div>
  )
}
