"use client"

import { useState, useEffect } from "react"
import KrilinCard from "../krilin-card"
import KrilinButton from "../krilin-button"
import KrilinPowerMeter from "../krilin-power-meter"

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

// Break suggestion data
const breakSuggestions = [
  { id: 1, activity: "Stretch your body", duration: "short", category: "physical" },
  { id: 2, activity: "Take a short walk", duration: "short", category: "physical" },
  { id: 3, activity: "Get a glass of water", duration: "short", category: "health" },
  { id: 4, activity: "Do a quick breathing exercise", duration: "short", category: "mindfulness" },
  { id: 5, activity: "Rest your eyes from the screen", duration: "short", category: "health" },
  { id: 6, activity: "Tidy up your workspace", duration: "short", category: "productivity" },
  { id: 7, activity: "Meditate for 5 minutes", duration: "long", category: "mindfulness" },
  { id: 8, activity: "Go outside for some fresh air", duration: "long", category: "physical" },
  { id: 9, activity: "Make a healthy snack", duration: "long", category: "health" },
  { id: 10, activity: "Practice a quick journaling session", duration: "long", category: "productivity" }
]

export default function KrilinPomodoroTimer() {
  // Timer settings
  const [focusDuration, setFocusDuration] = useState(25)
  const [shortBreakDuration, setShortBreakDuration] = useState(5)
  const [longBreakDuration, setLongBreakDuration] = useState(15)
  const [pomodorosUntilLongBreak, setPomodorosUntilLongBreak] = useState(4)
  
  // Timer state
  const [timerMode, setTimerMode] = useState<TimerMode>('focus')
  const [timeRemaining, setTimeRemaining] = useState(focusDuration * 60)
  const [isActive, setIsActive] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  
  // Break suggestion state
  const [currentBreakSuggestion, setCurrentBreakSuggestion] = useState<typeof breakSuggestions[0] | null>(null)
  const [preferredBreakCategories, setPreferredBreakCategories] = useState(['physical', 'mindfulness'])
  
  // Session stats
  const [todaysStats, setTodaysStats] = useState({
    focusSessionsCompleted: 0,
    totalFocusMinutes: 0,
    longestStreak: 0,
    currentStreak: 0,
    lastCompletionTime: null as Date | null
  })

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get current timer duration in seconds based on mode
  const getCurrentDuration = () => {
    switch (timerMode) {
      case 'focus': return focusDuration * 60
      case 'shortBreak': return shortBreakDuration * 60
      case 'longBreak': return longBreakDuration * 60
    }
  }

  // Select a break suggestion based on current break type and user preferences
  const getBreakSuggestion = () => {
    const isLongBreak = timerMode === 'longBreak'
    const filteredSuggestions = breakSuggestions.filter(
      suggestion => 
        preferredBreakCategories.includes(suggestion.category) && 
        (isLongBreak ? suggestion.duration === 'long' : suggestion.duration === 'short')
    )
    
    // If no suggestions match criteria, fallback to any suggestion of the right duration
    const eligibleSuggestions = filteredSuggestions.length > 0 
      ? filteredSuggestions 
      : breakSuggestions.filter(s => isLongBreak ? s.duration === 'long' : s.duration === 'short')
    
    const randomIndex = Math.floor(Math.random() * eligibleSuggestions.length)
    return eligibleSuggestions[randomIndex]
  }

  // Move to the next timer mode in the cycle
  const cycleTimerMode = () => {
    if (timerMode === 'focus') {
      const newCompletedPomodoros = completedPomodoros + 1
      setCompletedPomodoros(newCompletedPomodoros)
      
      // Update stats
      const newStats = {...todaysStats}
      newStats.focusSessionsCompleted += 1
      newStats.totalFocusMinutes += focusDuration
      
      if (newStats.currentStreak + 1 > newStats.longestStreak) {
        newStats.longestStreak = newStats.currentStreak + 1
      }
      newStats.currentStreak += 1
      newStats.lastCompletionTime = new Date()
      
      setTodaysStats(newStats)
      
      // Determine if we should take a long break or short break
      if (newCompletedPomodoros % pomodorosUntilLongBreak === 0) {
        setTimerMode('longBreak')
        setCurrentBreakSuggestion(getBreakSuggestion())
      } else {
        setTimerMode('shortBreak')
        setCurrentBreakSuggestion(getBreakSuggestion())
      }
    } else {
      setTimerMode('focus')
      setCurrentBreakSuggestion(null)
    }
  }

  // Reset timer with the current mode's duration
  const resetTimer = () => {
    setIsActive(false)
    setTimeRemaining(getCurrentDuration())
  }

  // Skip to the next timer mode
  const skipToNext = () => {
    cycleTimerMode()
    setTimeRemaining(getCurrentDuration())
    setIsActive(false)
  }

  // Toggle timer between active and paused
  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  // Update time remaining when mode changes
  useEffect(() => {
    setTimeRemaining(getCurrentDuration())
  }, [timerMode, focusDuration, shortBreakDuration, longBreakDuration])

  // Timer countdown logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1)
      }, 1000)
    } else if (isActive && timeRemaining === 0) {
      setIsActive(false)
      cycleTimerMode()
    }
    
    return () => clearInterval(interval)
  }, [isActive, timeRemaining])

  // Calculate progress percentage
  const progressPercentage = (1 - timeRemaining / getCurrentDuration()) * 100

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-pixel text-xl text-[#33272a]">FOCUS DOJO</h2>
        <KrilinButton 
          variant="secondary" 
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? "HIDE SETTINGS" : "SHOW SETTINGS"}
        </KrilinButton>
      </div>
      
      {/* Settings Section */}
      {showSettings && (
        <KrilinCard title="TIMER SETTINGS">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-pixel text-sm text-[#33272a] block">FOCUS SESSION (MINUTES)</label>
              <input 
                type="number" 
                min="1" 
                max="60"
                value={focusDuration}
                onChange={(e) => setFocusDuration(parseInt(e.target.value) || 25)}
                className="w-full border-2 border-[#33272a] bg-[#fffffc] p-2 font-pixel text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-pixel text-sm text-[#33272a] block">SHORT BREAK (MINUTES)</label>
              <input 
                type="number" 
                min="1" 
                max="15"
                value={shortBreakDuration}
                onChange={(e) => setShortBreakDuration(parseInt(e.target.value) || 5)}
                className="w-full border-2 border-[#33272a] bg-[#fffffc] p-2 font-pixel text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-pixel text-sm text-[#33272a] block">LONG BREAK (MINUTES)</label>
              <input 
                type="number" 
                min="5" 
                max="30"
                value={longBreakDuration}
                onChange={(e) => setLongBreakDuration(parseInt(e.target.value) || 15)}
                className="w-full border-2 border-[#33272a] bg-[#fffffc] p-2 font-pixel text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-pixel text-sm text-[#33272a] block">SESSIONS UNTIL LONG BREAK</label>
              <input 
                type="number" 
                min="1" 
                max="10"
                value={pomodorosUntilLongBreak}
                onChange={(e) => setPomodorosUntilLongBreak(parseInt(e.target.value) || 4)}
                className="w-full border-2 border-[#33272a] bg-[#fffffc] p-2 font-pixel text-sm"
              />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <label className="font-pixel text-sm text-[#33272a] block">PREFERRED BREAK ACTIVITIES</label>
              <div className="flex flex-wrap gap-2">
                {['physical', 'health', 'mindfulness', 'productivity'].map(category => (
                  <label key={category} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={preferredBreakCategories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreferredBreakCategories([...preferredBreakCategories, category])
                        } else {
                          setPreferredBreakCategories(preferredBreakCategories.filter(c => c !== category))
                        }
                      }}
                      className="mr-2 h-4 w-4 border-2 border-[#33272a]"
                    />
                    <span className="font-pixel text-xs uppercase text-[#594a4e]">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <KrilinButton 
              onClick={() => {
                setFocusDuration(25)
                setShortBreakDuration(5)
                setLongBreakDuration(15)
                setPomodorosUntilLongBreak(4)
                setPreferredBreakCategories(['physical', 'mindfulness'])
              }}
            >
              RESET TO DEFAULT
            </KrilinButton>
          </div>
        </KrilinCard>
      )}
      
      {/* Main Timer Card */}
      <KrilinCard
        title={timerMode === 'focus' ? "FOCUS SESSION" : timerMode === 'shortBreak' ? "SHORT BREAK" : "LONG BREAK"}
        className={`${
          timerMode === 'focus' 
            ? 'border-[#ff6b35]' 
            : timerMode === 'shortBreak' 
              ? 'border-[#ffc15e]' 
              : 'border-[#594a4e]'
        }`}
      >
        <div className="text-center space-y-6">
          {/* Timer Display */}
          <div className="flex justify-center">
            <div className={`text-6xl font-pixel p-6 inline-block border-4 ${
              timerMode === 'focus' 
                ? 'text-[#ff6b35] border-[#ff6b35]' 
                : timerMode === 'shortBreak' 
                  ? 'text-[#ffc15e] border-[#ffc15e]' 
                  : 'text-[#594a4e] border-[#594a4e]'
            }`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between mb-1">
              <span className="font-pixel text-xs text-[#594a4e]">
                {timeRemaining > 0 
                  ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')} REMAINING` 
                  : 'COMPLETED'}
              </span>
              <span className="font-pixel text-xs text-[#594a4e]">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <KrilinPowerMeter value={progressPercentage} />
          </div>
          
          {/* Break Suggestion (only shown during breaks) */}
          {(timerMode === 'shortBreak' || timerMode === 'longBreak') && currentBreakSuggestion && (
            <div className={`border-2 p-4 text-center ${
              timerMode === 'shortBreak' ? 'border-[#ffc15e] bg-[#fff8e8]' : 'border-[#594a4e] bg-[#f8f8f8]'
            }`}>
              <h3 className="font-pixel text-sm mb-2">BREAK SUGGESTION</h3>
              <p className="font-pixel text-lg mb-1">{currentBreakSuggestion.activity}</p>
              <span className="font-pixel text-xs text-[#594a4e] uppercase">
                Category: {currentBreakSuggestion.category}
              </span>
            </div>
          )}
          
          {/* Timer Controls */}
          <div className="flex justify-center gap-4">
            <KrilinButton onClick={toggleTimer} variant="primary">
              {isActive ? "PAUSE" : "START"}
            </KrilinButton>
            <KrilinButton onClick={resetTimer} variant="secondary">
              RESET
            </KrilinButton>
            <KrilinButton onClick={skipToNext} variant="secondary">
              SKIP
            </KrilinButton>
          </div>
          
          {/* Session Counter */}
          <div className="flex justify-center gap-2">
            {[...Array(pomodorosUntilLongBreak)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 border-[#33272a] ${
                  i < completedPomodoros % pomodorosUntilLongBreak ? 'bg-[#ff6b35]' : 'bg-[#fffffc]'
                }`}
              ></div>
            ))}
          </div>
          <div className="font-pixel text-xs text-[#594a4e]">
            {completedPomodoros} SESSIONS COMPLETED TODAY
          </div>
        </div>
      </KrilinCard>
      
      {/* Today's Stats */}
      <KrilinCard title="TODAY'S FOCUS STATS">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
            <div className="font-pixel text-2xl text-[#ff6b35]">{todaysStats.focusSessionsCompleted}</div>
            <div className="font-pixel text-xs text-[#594a4e]">SESSIONS</div>
          </div>
          
          <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
            <div className="font-pixel text-2xl text-[#ff6b35]">{todaysStats.totalFocusMinutes}</div>
            <div className="font-pixel text-xs text-[#594a4e]">FOCUS MINUTES</div>
          </div>
          
          <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
            <div className="font-pixel text-2xl text-[#ff6b35]">{todaysStats.currentStreak}</div>
            <div className="font-pixel text-xs text-[#594a4e]">CURRENT STREAK</div>
          </div>
          
          <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
            <div className="font-pixel text-2xl text-[#ff6b35]">{todaysStats.longestStreak}</div>
            <div className="font-pixel text-xs text-[#594a4e]">LONGEST STREAK</div>
          </div>
        </div>
        
        <div className="font-pixel text-sm text-center text-[#594a4e] p-2 border-2 border-dashed border-[#33272a] bg-[#fffaeb]">
          Completing 4 more focus sessions will earn you the FOCUS WARRIOR daily achievement!
        </div>
      </KrilinCard>
      
      {/* Focus Tips */}
      <KrilinCard title="FOCUS TIPS">
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 bg-[#ffc15e] flex-shrink-0 flex items-center justify-center font-pixel">1</div>
            <p className="font-pixel text-sm text-[#33272a]">
              Break down big tasks into smaller, manageable chunks before starting a focus session.
            </p>
          </div>
          
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 bg-[#ffc15e] flex-shrink-0 flex items-center justify-center font-pixel">2</div>
            <p className="font-pixel text-sm text-[#33272a]">
              Clear distractions from your environment before starting the timer.
            </p>
          </div>
          
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 bg-[#ffc15e] flex-shrink-0 flex items-center justify-center font-pixel">3</div>
            <p className="font-pixel text-sm text-[#33272a]">
              Take breaks seriously - they're essential for maintaining long-term focus and productivity.
            </p>
          </div>
          
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 bg-[#ffc15e] flex-shrink-0 flex items-center justify-center font-pixel">4</div>
            <p className="font-pixel text-sm text-[#33272a]">
              Try different session lengths to find what works best for your concentration style.
            </p>
          </div>
        </div>
      </KrilinCard>
    </div>
  )
}
