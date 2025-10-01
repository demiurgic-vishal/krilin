"use client"

import { useState } from "react"
import KrilinCard from "../krilin-card"
import KrilinButton from "../krilin-button"
import KrilinPowerMeter from "../krilin-power-meter"

// Type definitions
type GoalStatus = 'active' | 'completed' | 'abandoned'
type GoalCategory = 'personal' | 'professional' | 'health' | 'learning' | 'financial' | 'creative'
type GoalPriority = 'low' | 'medium' | 'high'
type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

interface Milestone {
  id: number
  title: string
  dueDate: Date | null
  isCompleted: boolean
}

interface Goal {
  id: number
  title: string
  description: string
  category: GoalCategory
  priority: GoalPriority
  timeFrame: TimeFrame
  startDate: Date
  targetDate: Date | null
  status: GoalStatus
  progress: number
  milestones: Milestone[]
  linkedHabits: string[]
  notes: string
}

// Sample data
const sampleGoals: Goal[] = [
  {
    id: 1,
    title: "Run a half marathon",
    description: "Train and complete a half marathon race",
    category: "health",
    priority: "medium",
    timeFrame: "quarterly",
    startDate: new Date(2025, 2, 1),
    targetDate: new Date(2025, 5, 15),
    status: "active",
    progress: 45,
    milestones: [
      { id: 1, title: "Run 5km without stopping", dueDate: new Date(2025, 2, 15), isCompleted: true },
      { id: 2, title: "Run 10km without stopping", dueDate: new Date(2025, 3, 15), isCompleted: true },
      { id: 3, title: "Run 15km without stopping", dueDate: new Date(2025, 4, 15), isCompleted: false },
      { id: 4, title: "Complete a half marathon", dueDate: new Date(2025, 5, 15), isCompleted: false }
    ],
    linkedHabits: ["Exercise", "Early Rising"],
    notes: "Focus on improving endurance gradually. Rest days are important."
  },
  {
    id: 2,
    title: "Learn TypeScript fundamentals",
    description: "Master the basics of TypeScript for front-end development",
    category: "learning",
    priority: "high",
    timeFrame: "monthly",
    startDate: new Date(2025, 3, 1),
    targetDate: new Date(2025, 3, 30),
    status: "active",
    progress: 70,
    milestones: [
      { id: 1, title: "Complete TypeScript crash course", dueDate: new Date(2025, 3, 7), isCompleted: true },
      { id: 2, title: "Build a simple TypeScript project", dueDate: new Date(2025, 3, 15), isCompleted: true },
      { id: 3, title: "Implement advanced TypeScript features", dueDate: new Date(2025, 3, 25), isCompleted: false }
    ],
    linkedHabits: ["Deep Work Session", "Reading"],
    notes: "Focus on practical examples rather than just theory."
  },
  {
    id: 3,
    title: "Save for summer vacation",
    description: "Save ₹50,000 for the summer vacation to beach destination",
    category: "financial",
    priority: "medium",
    timeFrame: "monthly",
    startDate: new Date(2025, 1, 1),
    targetDate: new Date(2025, 4, 30),
    status: "active",
    progress: 60,
    milestones: [
      { id: 1, title: "Save ₹10,000", dueDate: new Date(2025, 1, 30), isCompleted: true },
      { id: 2, title: "Save ₹20,000", dueDate: new Date(2025, 2, 30), isCompleted: true },
      { id: 3, title: "Save ₹35,000", dueDate: new Date(2025, 3, 30), isCompleted: true }
    ],
    linkedHabits: [],
    notes: "Consider setting up automatic transfers to savings account."
  }
]

// Category icons mapping 
const categoryIcons: Record<GoalCategory, string> = {
  personal: "👤",
  professional: "💼",
  health: "💪",
  learning: "📚",
  financial: "💰",
  creative: "🎨"
}

// Priority colors mapping
const priorityColors: Record<GoalPriority, string> = {
  low: "#8BC34A",
  medium: "#FFC107",
  high: "#F44336"
}

export default function KrilinGoalTracker() {
  // State
  const [goals, setGoals] = useState<Goal[]>(sampleGoals)
  const [filterCategory, setFilterCategory] = useState<GoalCategory | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'all'>('active')
  const [showCreate, setShowCreate] = useState(false)
  
  // Toggle milestone completion
  const toggleMilestone = (goalId: number, milestoneId: number) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        const updatedMilestones = goal.milestones.map(milestone => {
          if (milestone.id === milestoneId) {
            return { ...milestone, isCompleted: !milestone.isCompleted }
          }
          return milestone
        })
        
        // Recalculate progress based on milestones
        const completedCount = updatedMilestones.filter(m => m.isCompleted).length
        const totalCount = updatedMilestones.length
        const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
        
        return {
          ...goal,
          milestones: updatedMilestones,
          progress: newProgress,
          status: newProgress === 100 ? 'completed' : goal.status
        }
      }
      return goal
    }))
  }
  
  // Update goal status
  const updateGoalStatus = (goalId: number, newStatus: GoalStatus) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        return { ...goal, status: newStatus }
      }
      return goal
    }))
  }
  
  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set'
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }
  
  // Calculate days remaining
  const getDaysRemaining = (targetDate: Date | null) => {
    if (!targetDate) return null
    
    const today = new Date()
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  }
  
  // Filter goals
  const filteredGoals = goals.filter(goal => {
    if (filterCategory !== 'all' && goal.category !== filterCategory) {
      return false
    }
    
    if (filterStatus !== 'all' && goal.status !== filterStatus) {
      return false
    }
    
    return true
  })
  
  // Calculate goal metrics
  const metrics = {
    totalGoals: goals.length,
    activeGoals: goals.filter(g => g.status === 'active').length,
    completedGoals: goals.filter(g => g.status === 'completed').length,
    overallProgress: goals.length > 0 
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) 
      : 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-pixel text-xl text-[#33272a]">GOAL TRACKER</h2>
        <KrilinButton
          onClick={() => setShowCreate(!showCreate)}
          variant="primary"
        >
          {showCreate ? "HIDE FORM" : "CREATE NEW GOAL"}
        </KrilinButton>
      </div>

      {/* Summary Card */}
      <KrilinCard title="GOALS OVERVIEW">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
            <div className="font-pixel text-2xl text-[#ff6b35]">{metrics.totalGoals}</div>
            <div className="font-pixel text-xs text-[#594a4e]">TOTAL GOALS</div>
          </div>
          
          <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
            <div className="font-pixel text-2xl text-[#ff6b35]">{metrics.activeGoals}</div>
            <div className="font-pixel text-xs text-[#594a4e]">ACTIVE GOALS</div>
          </div>
          
          <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
            <div className="font-pixel text-2xl text-[#ff6b35]">{metrics.completedGoals}</div>
            <div className="font-pixel text-xs text-[#594a4e]">COMPLETED</div>
          </div>
          
          <div className="text-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
            <div className="font-pixel text-2xl text-[#ff6b35]">{metrics.overallProgress}%</div>
            <div className="font-pixel text-xs text-[#594a4e]">OVERALL PROGRESS</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between mb-1">
            <span className="font-pixel text-sm text-[#33272a]">TOTAL PROGRESS</span>
            <span className="font-pixel text-sm text-[#33272a]">{metrics.overallProgress}%</span>
          </div>
          <KrilinPowerMeter value={metrics.overallProgress} />
        </div>
      </KrilinCard>
      
      {/* Filters */}
      <div className="bg-[#fffffc] border-2 border-[#33272a] p-4 space-y-4">
        <h3 className="font-pixel text-sm text-[#33272a]">FILTER GOALS</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="font-pixel text-xs text-[#594a4e] block">CATEGORY</label>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as GoalCategory | 'all')}
              className="w-full border-2 border-[#33272a] bg-[#fffffc] p-2 font-pixel text-sm"
            >
              <option value="all">All Categories</option>
              <option value="personal">Personal</option>
              <option value="professional">Professional</option>
              <option value="health">Health</option>
              <option value="learning">Learning</option>
              <option value="financial">Financial</option>
              <option value="creative">Creative</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="font-pixel text-xs text-[#594a4e] block">STATUS</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as GoalStatus | 'all')}
              className="w-full border-2 border-[#33272a] bg-[#fffffc] p-2 font-pixel text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Goals List */}
      <KrilinCard title={`YOUR GOALS (${filteredGoals.length})`}>
        <div className="space-y-4">
          {filteredGoals.length === 0 ? (
            <div className="text-center p-4 border-2 border-dashed border-[#33272a]">
              <p className="font-pixel text-sm text-[#594a4e]">
                No goals match your current filters. Try adjusting the filters or create a new goal.
              </p>
            </div>
          ) : (
            filteredGoals.map(goal => (
              <div 
                key={goal.id} 
                className={`border-2 border-[#33272a] bg-[#fffffc] overflow-hidden ${
                  goal.status === 'completed' ? 'opacity-70' : ''
                }`}
              >
                <div className="bg-[#594a4e] text-white p-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryIcons[goal.category]}</span>
                    <h3 className="font-pixel text-sm">{goal.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: priorityColors[goal.priority] }}
                    ></div>
                    <span className="font-pixel text-xs capitalize">{goal.priority}</span>
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="mb-3">
                    <p className="font-pixel text-xs text-[#594a4e] mb-1">
                      {goal.timeFrame.toUpperCase()} GOAL • 
                      {goal.targetDate 
                        ? ` ${getDaysRemaining(goal.targetDate)} DAYS LEFT` 
                        : ' NO DEADLINE'}
                    </p>
                    <p className="font-pixel text-sm text-[#33272a] line-clamp-1">{goal.description}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-pixel text-xs text-[#594a4e]">PROGRESS</span>
                      <span className="font-pixel text-xs text-[#594a4e]">{goal.progress}%</span>
                    </div>
                    <KrilinPowerMeter value={goal.progress} />
                    <div className="flex justify-between items-center text-xs font-pixel text-[#594a4e]">
                      <span>{goal.milestones.filter(m => m.isCompleted).length}/{goal.milestones.length} milestones</span>
                      <span className="uppercase">{goal.status}</span>
                    </div>
                  </div>
                  
                  {/* Milestones */}
                  <div className="mt-4 pt-4 border-t border-[#e5e5e5]">
                    <h4 className="font-pixel text-xs text-[#594a4e] mb-2">MILESTONES</h4>
                    <div className="space-y-2">
                      {goal.milestones.map(milestone => (
                        <div 
                          key={milestone.id} 
                          className="flex items-start gap-2"
                          onClick={() => toggleMilestone(goal.id, milestone.id)}
                        >
                          <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border-2 border-[#33272a] cursor-pointer ${
                            milestone.isCompleted ? 'bg-[#ffc15e]' : 'bg-white'
                          }`}>
                            {milestone.isCompleted && (
                              <span className="text-xs">✓</span>
                            )}
                          </div>
                          <div>
                            <p className="font-pixel text-sm text-[#33272a]">{milestone.title}</p>
                            {milestone.dueDate && (
                              <p className="font-pixel text-xs text-[#594a4e]">Due: {formatDate(milestone.dueDate)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-4 flex justify-end gap-2">
                    {goal.status !== 'completed' && (
                      <KrilinButton 
                        onClick={() => updateGoalStatus(goal.id, 'completed')}
                        variant="secondary"
                        className="text-xs px-2 py-1"
                      >
                        MARK COMPLETED
                      </KrilinButton>
                    )}
                    {goal.status !== 'abandoned' && (
                      <KrilinButton 
                        onClick={() => updateGoalStatus(goal.id, 'abandoned')}
                        variant="secondary"
                        className="text-xs px-2 py-1"
                      >
                        ABANDON
                      </KrilinButton>
                    )}
                    {goal.status !== 'active' && (
                      <KrilinButton 
                        onClick={() => updateGoalStatus(goal.id, 'active')}
                        variant="secondary"
                        className="text-xs px-2 py-1"
                      >
                        REACTIVATE
                      </KrilinButton>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </KrilinCard>
      
      {/* Simplified Create Form (when showCreate is true) */}
      {showCreate && (
        <KrilinCard title="CREATE NEW GOAL">
          <div className="p-4 text-center border-2 border-dashed border-[#33272a]">
            <p className="font-pixel text-sm text-[#594a4e]">
              This is a placeholder for the goal creation form. In a production app, this would contain
              fields for title, description, category, priority, timeline, and milestones.
            </p>
            
            <KrilinButton 
              onClick={() => setShowCreate(false)}
              className="mt-4"
            >
              CLOSE FORM
            </KrilinButton>
          </div>
        </KrilinCard>
      )}
      
      <div className="p-4 bg-[#fffaeb] border-2 border-[#33272a]">
        <h3 className="font-pixel text-sm text-[#33272a] mb-2">GOAL PLANNING TIPS</h3>
        <ul className="space-y-2 text-[#594a4e] font-pixel text-sm">
          <li>Break large goals into smaller, measurable milestones</li>
          <li>Connect your goals to daily habits for consistent progress</li>
          <li>Set realistic deadlines to stay motivated</li>
          <li>Review and adjust your goals regularly</li>
        </ul>
      </div>
    </div>
  )
}
