"use client"

import { useState } from "react"
import KrilinCard from "../krilin-card"
import KrilinButton from "../krilin-button"
import KrilinPowerMeter from "../krilin-power-meter"

export default function KrilinHabitTracker() {
  // Sample habits with tracking data
  const [habits, setHabits] = useState([
    { 
      id: 1, 
      name: "Morning Meditation", 
      target: "Daily", 
      streak: 12,
      completedToday: true,
      lastWeek: [true, true, true, false, true, true, true], // last 7 days
      category: "wellbeing",
      timeOfDay: "morning",
      xpReward: 10
    },
    { 
      id: 2, 
      name: "Read 30 Minutes", 
      target: "Daily", 
      streak: 8,
      completedToday: false,
      lastWeek: [true, true, false, true, true, true, false],
      category: "learning",
      timeOfDay: "evening",
      xpReward: 15
    },
    { 
      id: 3, 
      name: "Exercise", 
      target: "5x / Week", 
      streak: 3,
      completedToday: true,
      lastWeek: [true, false, true, false, true, false, false],
      category: "health",
      timeOfDay: "morning",
      xpReward: 20
    },
    { 
      id: 4, 
      name: "Deep Work Session", 
      target: "Weekdays", 
      streak: 5,
      completedToday: false,
      lastWeek: [true, true, true, true, true, false, false],
      category: "productivity",
      timeOfDay: "afternoon",
      xpReward: 25
    },
    { 
      id: 5, 
      name: "Daily Planning", 
      target: "Daily", 
      streak: 15,
      completedToday: true,
      lastWeek: [true, true, true, true, true, true, true],
      category: "organization",
      timeOfDay: "morning",
      xpReward: 15
    }
  ])

  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Sample stats
  const stats = {
    totalHabits: habits.length,
    streakSum: habits.reduce((sum, habit) => sum + habit.streak, 0),
    completionRateToday: (habits.filter(h => h.completedToday).length / habits.length) * 100,
    totalStreak: 7 // days of having at least one habit completed
  }

  // Toggle completion for today
  const toggleHabitCompletion = (id: number) => {
    setHabits(habits.map(habit => {
      if (habit.id === id) {
        const newCompletedToday = !habit.completedToday
        return {
          ...habit,
          completedToday: newCompletedToday,
          streak: newCompletedToday ? habit.streak + 1 : Math.max(0, habit.streak - 1)
        }
      }
      return habit
    }))
  }

  // Filter habits by category
  const filteredHabits = filterCategory === 'all' 
    ? habits 
    : habits.filter(habit => habit.category === filterCategory)

  return (
    <div className="space-y-6">
      <KrilinCard title="HABIT STATS">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
            <div className="font-pixel text-2xl text-[#ff6b35]">{stats.totalHabits}</div>
            <div className="font-pixel text-xs text-[#594a4e]">ACTIVE HABITS</div>
          </div>
          
          <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
            <div className="font-pixel text-2xl text-[#ff6b35]">{Math.round(stats.completionRateToday)}%</div>
            <div className="font-pixel text-xs text-[#594a4e]">TODAY'S COMPLETION</div>
          </div>
          
          <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
            <div className="font-pixel text-2xl text-[#ff6b35]">{stats.streakSum}</div>
            <div className="font-pixel text-xs text-[#594a4e]">TOTAL STREAK DAYS</div>
          </div>
          
          <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
            <div className="font-pixel text-2xl text-[#ff6b35]">{stats.totalStreak}</div>
            <div className="font-pixel text-xs text-[#594a4e]">DAILY HABIT STREAK</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between mb-1">
            <span className="font-pixel text-sm text-[#33272a]">HABIT STRENGTH</span>
            <span className="font-pixel text-sm text-[#33272a]">{Math.round(stats.completionRateToday)}%</span>
          </div>
          <KrilinPowerMeter value={stats.completionRateToday} />
        </div>
      </KrilinCard>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <KrilinButton 
          variant={filterCategory === 'all' ? "primary" : "secondary"}
          onClick={() => setFilterCategory('all')}
          className="px-3 py-1 text-xs"
        >
          ALL
        </KrilinButton>
        
        <KrilinButton 
          variant={filterCategory === 'wellbeing' ? "primary" : "secondary"}
          onClick={() => setFilterCategory('wellbeing')}
          className="px-3 py-1 text-xs"
        >
          WELLBEING
        </KrilinButton>
        
        <KrilinButton 
          variant={filterCategory === 'health' ? "primary" : "secondary"}
          onClick={() => setFilterCategory('health')}
          className="px-3 py-1 text-xs"
        >
          HEALTH
        </KrilinButton>
        
        <KrilinButton 
          variant={filterCategory === 'productivity' ? "primary" : "secondary"}
          onClick={() => setFilterCategory('productivity')}
          className="px-3 py-1 text-xs"
        >
          PRODUCTIVITY
        </KrilinButton>
        
        <KrilinButton 
          variant={filterCategory === 'learning' ? "primary" : "secondary"}
          onClick={() => setFilterCategory('learning')}
          className="px-3 py-1 text-xs"
        >
          LEARNING
        </KrilinButton>
        
        <KrilinButton 
          variant={filterCategory === 'organization' ? "primary" : "secondary"}
          onClick={() => setFilterCategory('organization')}
          className="px-3 py-1 text-xs"
        >
          ORGANIZATION
        </KrilinButton>
      </div>
      
      {/* Habits List */}
      <div className="space-y-4">
        {filteredHabits.map(habit => (
          <div key={habit.id} className="border-2 border-[#33272a] bg-[#fffffc] overflow-hidden">
            <div className="flex justify-between items-center p-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleHabitCompletion(habit.id)}
                  className={`w-8 h-8 flex items-center justify-center border-2 border-[#33272a] ${
                    habit.completedToday ? 'bg-[#ffc15e]' : 'bg-[#fffffc]'
                  }`}
                >
                  {habit.completedToday && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-pixel text-sm text-[#33272a]">{habit.name}</h3>
                    <span className="font-pixel text-xs bg-[#594a4e] text-white px-2 py-0.5">
                      {habit.timeOfDay.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-pixel text-xs text-[#594a4e]">
                    Target: {habit.target} • Streak: {habit.streak} days • +{habit.xpReward} XP
                  </div>
                </div>
              </div>
              
              <div className="hidden md:flex items-center gap-1">
                {habit.lastWeek.map((day, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 ${day ? 'bg-[#ffc15e]' : 'bg-[#e5e5e5]'} border border-[#33272a]`}
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Weekly view for mobile */}
            <div className="md:hidden px-3 pb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-pixel text-xs text-[#594a4e]">LAST 7 DAYS</span>
              </div>
              <div className="flex justify-between items-center">
                {habit.lastWeek.map((day, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 ${day ? 'bg-[#ffc15e]' : 'bg-[#e5e5e5]'} border border-[#33272a]`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        <KrilinButton className="w-full">ADD NEW HABIT</KrilinButton>
      </div>
    </div>
  )
}
