# Krilin.AI Gamification System

This document outlines the gamification architecture for the Krilin.AI personal assistant application, explaining how game mechanics motivate users, reinforce positive habits, and create an engaging experience.

## 📋 Table of Contents

1. [Introduction to Gamification](#introduction-to-gamification)
2. [Gamification Core Elements](#gamification-core-elements)
3. [Power Level System](#power-level-system)
4. [Achievement System](#achievement-system)
5. [Habit Tracking System](#habit-tracking-system)
6. [Implementation Guide](#implementation-guide)
7. [Integration with Workflows](#integration-with-workflows)
8. [Integration with AI Advisor](#integration-with-ai-advisor)
9. [Code Examples](#code-examples)

## Introduction to Gamification

### The Krilin Philosophy

Krilin.AI applies gamification principles inspired by Dragon Ball's Krilin character - a martial artist who constantly trains to improve despite limitations. Like Krilin who powers up through consistent training, the app helps users:

1. **Build Power Through Consistency**: Regular use of productivity tools increases your "power level"
2. **Unlock Achievements**: Complete specific milestones to earn recognition
3. **Train Daily Habits**: Maintain streaks of positive behaviors
4. **Overcome Challenges**: Face progressively difficult tasks to grow
5. **Celebrate Growth**: Visualize progress through power meters and achievements

### Gamification Goals

The gamification system aims to:

- **Increase Engagement**: Make productivity fun and rewarding
- **Motivate Consistency**: Encourage daily use through streaks and rewards
- **Celebrate Progress**: Acknowledge achievements big and small
- **Build Habits**: Transform occasional actions into consistent behaviors
- **Personalize Experience**: Adapt challenges to user's skill level and interests

## Gamification Core Elements

### System Architecture

```
┌────────────────────────────────────────────────────────┐
│                 GAMIFICATION SYSTEM                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌─────────────┐        ┌─────────────┐               │
│  │   Action    │        │  Progress   │               │
│  │  Tracking   │───────►│  Tracking   │               │
│  └─────────────┘        └─────────────┘               │
│         │                      │                       │
│         │                      ▼                       │
│         │               ┌─────────────┐                │
│         │               │  Experience │                │
│         └──────────────►│   System    │                │
│                         └─────────────┘                │
│                                │                       │
│                                ▼                       │
│  ┌─────────────┐        ┌─────────────┐               │
│  │ Achievement │◄───────│ Power Level │               │
│  │   System    │        │   System    │───────┐       │
│  └─────────────┘        └─────────────┘       │       │
│         │                                      │       │
│         ▼                                      ▼       │
│  ┌─────────────┐                       ┌─────────────┐ │
│  │   Rewards   │                       │ Progression │ │
│  │   System    │                       │ Visualization│ │
│  └─────────────┘                       └─────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Core Components

1. **Action Tracking**: Records user actions across the application
2. **Progress Tracking**: Measures improvement in various domains
3. **Experience System**: Awards XP for completed actions
4. **Power Level System**: Represents overall user growth
5. **Achievement System**: Recognizes specific accomplishments
6. **Reward System**: Provides incentives for continued engagement
7. **Progression Visualization**: Shows growth through visual indicators

## Power Level System

The Power Level is the central metric representing user growth and mastery.

### Power Level Calculation

```
Power Level = Base Value +
              (Task Completion * Task Weight) +
              (Habit Streaks * Streak Weight) +
              (Achievement Count * Achievement Weight) +
              (Daily Activity * Consistency Bonus)
```

### Power Level Tiers

| Tier | Power Level | Title                  | Benefits              |
| ---- | ----------- | ---------------------- | --------------------- |
| 1    | 0-99        | Novice Warrior         | Basic features        |
| 2    | 100-249     | Trained Fighter        | Custom themes         |
| 3    | 250-499     | Ki Controller          | Advanced insights     |
| 4    | 500-999     | Skilled Martial Artist | Workflow automation   |
| 5    | 1000-2499   | Energy Master          | Premium templates     |
| 6    | 2500-4999   | Legendary Warrior      | Advanced statistics   |
| 7    | 5000+       | Z-Fighter              | All features unlocked |

### Power Level Visualization

The Power Level is visualized through:

1. **KrilinPowerMeter**: Shows current level with animated bar
2. **Daily/Weekly Charts**: Tracks power level growth over time
3. **Comparative Stats**: Shows percentile among similar users
4. **Domain Breakdown**: Visualizes power distribution across workflows

## Achievement System

Achievements recognize specific accomplishments and milestones.

### Achievement Categories

1. **Workflow Achievements**: Tied to specific workflows

   - Task Master: Complete 1000 tasks
   - Calendar Guru: Maintain calendar consistency for 30 days
   - Email Zero: Clear inbox 5 times

2. **Habit Achievements**: Related to consistency

   - Streak Master: Maintain any habit for 30 days
   - Morning Routine: Complete morning sequence 20 times
   - Balanced Life: Use all core workflows in one day

3. **System Achievements**: Using application features
   - AI Collaborator: Implement 10 AI suggestions
   - Personal Developer: Create a custom workflow
   - Power User: Use the app for 100 consecutive days

### Achievement Structure

```typescript
interface Achievement {
  id: string;
  title: string;
  description: string;
  category: "workflow" | "habit" | "system";
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  xpReward: number;
  unlockedAt: string | null;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  relatedWorkflow?: string;
}
```

### Achievement Display

Achievements are displayed in multiple ways:

1. **Achievement Panel**: Dedicated section showing all achievements
2. **Recent Unlocks**: Celebration animations for new achievements
3. **Progress Trackers**: Show progress toward locked achievements
4. **Dashboard Highlights**: Showcase prestigious achievements

## Habit Tracking System

The habit tracking system helps users build and maintain positive behaviors.

### Habit Types

1. **Binary Habits**: Yes/no completion (meditation, journaling)
2. **Counted Habits**: Numeric goal (steps, glasses of water)
3. **Timed Habits**: Duration-based (reading, exercise minutes)
4. **Checklist Habits**: Multiple sub-items to complete

### Streak Mechanics

Streaks incentivize consistent behavior:

1. **Daily Streaks**: Consecutive days of habit completion
2. **Recovery Grace**: Miss one day without losing streak
3. **Streak Multipliers**: Increased rewards for longer streaks
4. **Streak Protection**: Special items to maintain streaks during planned breaks

### Habit Visualization

```
┌────────────────────────────────────────────────────────┐
│ MEDITATION HABIT                            ⚙️  📊     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Streak: 12 days 🔥                                   │
│                                                        │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │
│  │  M  │ │  T  │ │  W  │ │  T  │ │  F  │ │  S  │ │  S  │ │
│  │  ✓  │ │  ✓  │ │  ✓  │ │  ✓  │ │  ✓  │ │  ✓  │ │  -  │ │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │
│                                                        │
│  Monthly Pattern:                                      │
│  ⬜⬜🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜⬜🟩🟩🟩🟩🟨🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩   │
│                                                        │
│  Target: 10 minutes daily                              │
│  Average: 8.5 minutes                                  │
│                                                        │
│  [COMPLETE TODAY]                                      │
└────────────────────────────────────────────────────────┘
```

## Implementation Guide

### Gamification Context

Create a central context for managing gamification state:

```tsx
// components/gamification/gamification-context.tsx
import React, { createContext, useContext, useReducer, useEffect } from "react";

// Types
interface PowerLevel {
  current: number;
  tier: number;
  tierTitle: string;
  nextTierAt: number;
  breakdown: {
    [domain: string]: number;
  };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: "workflow" | "habit" | "system";
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  xpReward: number;
  unlockedAt: string | null;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  relatedWorkflow?: string;
}

interface Habit {
  id: string;
  name: string;
  description: string;
  type: "binary" | "counted" | "timed" | "checklist";
  target: number;
  unit?: string;
  frequency: "daily" | "weekly";
  streak: number;
  bestStreak: number;
  completedToday: boolean;
  history: Array<{
    date: string;
    completed: boolean;
    value?: number;
  }>;
}

interface GamificationState {
  powerLevel: PowerLevel;
  totalXp: number;
  achievements: Achievement[];
  habits: Habit[];
  logs: Array<{
    id: string;
    type: "xp_gain" | "achievement" | "level_up" | "streak";
    message: string;
    timestamp: string;
  }>;
}

type GamificationAction =
  | { type: "AWARD_XP"; payload: { amount: number; domain: string } }
  | { type: "UPDATE_ACHIEVEMENT"; payload: { id: string; progress: number } }
  | { type: "UNLOCK_ACHIEVEMENT"; payload: string }
  | {
      type: "UPDATE_HABIT";
      payload: { id: string; completed: boolean; value?: number };
    }
  | { type: "RESET_DAILY_HABITS" }
  | { type: "LOAD_STATE"; payload: GamificationState };

// Initial state
const initialState: GamificationState = {
  powerLevel: {
    current: 0,
    tier: 1,
    tierTitle: "Novice Warrior",
    nextTierAt: 100,
    breakdown: {},
  },
  totalXp: 0,
  achievements: [],
  habits: [],
  logs: [],
};

// Reducer
function gamificationReducer(
  state: GamificationState,
  action: GamificationAction
): GamificationState {
  switch (action.type) {
    case "AWARD_XP": {
      const { amount, domain } = action.payload;
      const newTotalXp = state.totalXp + amount;

      // Calculate new power level
      const newPowerLevel = calculatePowerLevel(newTotalXp, {
        ...state.powerLevel.breakdown,
        [domain]: (state.powerLevel.breakdown[domain] || 0) + amount,
      });

      // Check if leveled up
      const leveledUp = newPowerLevel.tier > state.powerLevel.tier;

      // Create log entry
      const log = {
        id: Date.now().toString(),
        type: leveledUp ? "level_up" : "xp_gain",
        message: leveledUp
          ? `Powered up to ${newPowerLevel.tierTitle}!`
          : `Gained ${amount} XP from ${domain}`,
        timestamp: new Date().toISOString(),
      };

      return {
        ...state,
        totalXp: newTotalXp,
        powerLevel: newPowerLevel,
        logs: [log, ...state.logs].slice(0, 100), // Keep last 100 logs
      };
    }

    case "UPDATE_ACHIEVEMENT": {
      const { id, progress } = action.payload;
      const updatedAchievements = state.achievements.map((achievement) => {
        if (achievement.id === id) {
          const percentage = Math.min(
            100,
            (progress / achievement.progress.target) * 100
          );
          return {
            ...achievement,
            progress: {
              current: progress,
              target: achievement.progress.target,
              percentage,
            },
          };
        }
        return achievement;
      });

      return {
        ...state,
        achievements: updatedAchievements,
      };
    }

    case "UNLOCK_ACHIEVEMENT": {
      const achievementId = action.payload;
      const achievement = state.achievements.find(
        (a) => a.id === achievementId
      );

      if (!achievement || achievement.unlockedAt) {
        return state; // Already unlocked or not found
      }

      const updatedAchievements = state.achievements.map((a) => {
        if (a.id === achievementId) {
          return {
            ...a,
            unlockedAt: new Date().toISOString(),
            progress: {
              ...a.progress,
              current: a.progress.target,
              percentage: 100,
            },
          };
        }
        return a;
      });

      // Create log entry
      const log = {
        id: Date.now().toString(),
        type: "achievement",
        message: `Achievement unlocked: ${achievement.title}`,
        timestamp: new Date().toISOString(),
      };

      // Award XP for achievement
      const domain = achievement.relatedWorkflow || "system";
      const newTotalXp = state.totalXp + achievement.xpReward;
      const newBreakdown = {
        ...state.powerLevel.breakdown,
        [domain]:
          (state.powerLevel.breakdown[domain] || 0) + achievement.xpReward,
      };

      return {
        ...state,
        achievements: updatedAchievements,
        totalXp: newTotalXp,
        powerLevel: calculatePowerLevel(newTotalXp, newBreakdown),
        logs: [log, ...state.logs].slice(0, 100),
      };
    }

    case "UPDATE_HABIT": {
      const { id, completed, value } = action.payload;
      const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      const updatedHabits = state.habits.map((habit) => {
        if (habit.id === id) {
          // Check if this is extending a streak
          const isStreakContinuation =
            !habit.completedToday && (habit.streak > 0 || completed);

          const newStreak =
            isStreakContinuation && completed
              ? habit.streak + 1
              : completed
              ? 1
              : 0;

          const bestStreak = Math.max(habit.bestStreak, newStreak);

          // Add to history
          const historyEntry = {
            date: now,
            completed,
            value: value !== undefined ? value : undefined,
          };

          // Remove existing entry for today if exists
          const filteredHistory = habit.history.filter((h) => h.date !== now);

          return {
            ...habit,
            completedToday: completed,
            streak: newStreak,
            bestStreak,
            history: [...filteredHistory, historyEntry],
          };
        }
        return habit;
      });

      // Create streak log if needed
      let logs = [...state.logs];
      const targetHabit = state.habits.find((h) => h.id === id);

      if (
        targetHabit &&
        completed &&
        targetHabit.streak + 1 >= 7 &&
        (targetHabit.streak + 1) % 7 === 0
      ) {
        const streakLog = {
          id: Date.now().toString(),
          type: "streak",
          message: `${targetHabit.streak + 1} day streak achieved for ${
            targetHabit.name
          }!`,
          timestamp: new Date().toISOString(),
        };
        logs = [streakLog, ...logs].slice(0, 100);
      }

      return {
        ...state,
        habits: updatedHabits,
        logs,
      };
    }

    case "RESET_DAILY_HABITS": {
      // Reset completedToday for all habits at the start of a new day
      const updatedHabits = state.habits.map((habit) => ({
        ...habit,
        completedToday: false,
      }));

      return {
        ...state,
        habits: updatedHabits,
      };
    }

    case "LOAD_STATE":
      return action.payload;

    default:
      return state;
  }
}

// Helper function to calculate power level
function calculatePowerLevel(
  xp: number,
  breakdown: PowerLevel["breakdown"]
): PowerLevel {
  // Define tiers
  const tiers = [
    { threshold: 0, title: "Novice Warrior" },
    { threshold: 100, title: "Trained Fighter" },
    { threshold: 250, title: "Ki Controller" },
    { threshold: 500, title: "Skilled Martial Artist" },
    { threshold: 1000, title: "Energy Master" },
    { threshold: 2500, title: "Legendary Warrior" },
    { threshold: 5000, title: "Z-Fighter" },
  ];

  // Find current tier
  let tier = 1;
  let tierTitle = tiers[0].title;
  let nextTierAt = tiers[1].threshold;

  for (let i = 0; i < tiers.length; i++) {
    if (xp >= tiers[i].threshold) {
      tier = i + 1;
      tierTitle = tiers[i].title;
      nextTierAt = i < tiers.length - 1 ? tiers[i + 1].threshold : Infinity;
    } else {
      break;
    }
  }

  return {
    current: xp,
    tier,
    tierTitle,
    nextTierAt,
    breakdown,
  };
}

// Context
interface GamificationContextValue {
  state: GamificationState;
  dispatch: React.Dispatch<GamificationAction>;
  awardXp: (amount: number, domain: string) => void;
  updateAchievementProgress: (id: string, progress: number) => void;
  updateHabit: (id: string, completed: boolean, value?: number) => void;
  getTopAchievements: (count?: number) => Achievement[];
  getPowerLevelForDomain: (domain: string) => number;
}

const GamificationContext = createContext<GamificationContextValue>({
  state: initialState,
  dispatch: () => null,
  awardXp: () => null,
  updateAchievementProgress: () => null,
  updateHabit: () => null,
  getTopAchievements: () => [],
  getPowerLevelForDomain: () => 0,
});

// Provider
export function GamificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(gamificationReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("krilin_gamification_state");
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: "LOAD_STATE", payload: parsedState });
      } catch (e) {
        console.error("Failed to load gamification state", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("krilin_gamification_state", JSON.stringify(state));
  }, [state]);

  // Reset daily habits at midnight
  useEffect(() => {
    const checkForNewDay = () => {
      const lastReset = localStorage.getItem("krilin_last_habit_reset");
      const today = new Date().toISOString().split("T")[0];

      if (lastReset !== today) {
        dispatch({ type: "RESET_DAILY_HABITS" });
        localStorage.setItem("krilin_last_habit_reset", today);
      }
    };

    // Check on mount
    checkForNewDay();

    // Set up interval to check periodically
    const interval = setInterval(checkForNewDay, 1000 * 60 * 15); // Check every 15 minutes

    return () => clearInterval(interval);
  }, []);

  // Utility functions
  const awardXp = (amount: number, domain: string) => {
    dispatch({ type: "AWARD_XP", payload: { amount, domain } });
  };

  const updateAchievementProgress = (id: string, progress: number) => {
    const achievement = state.achievements.find((a) => a.id === id);

    if (!achievement) return;

    dispatch({ type: "UPDATE_ACHIEVEMENT", payload: { id, progress } });

    // Auto-unlock if completed
    if (progress >= achievement.progress.target && !achievement.unlockedAt) {
      dispatch({ type: "UNLOCK_ACHIEVEMENT", payload: id });
    }
  };

  const updateHabit = (id: string, completed: boolean, value?: number) => {
    dispatch({ type: "UPDATE_HABIT", payload: { id, completed, value } });
  };

  const getTopAchievements = (count = 3) => {
    return [...state.achievements]
      .filter((a) => a.unlockedAt)
      .sort(
        (a, b) =>
          new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime()
      )
      .slice(0, count);
  };

  const getPowerLevelForDomain = (domain: string) => {
    return state.powerLevel.breakdown[domain] || 0;
  };

  return (
    <GamificationContext.Provider
      value={{
        state,
        dispatch,
        awardXp,
        updateAchievementProgress,
        updateHabit,
        getTopAchievements,
        getPowerLevelForDomain,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

// Hook
export function useGamification() {
  return useContext(GamificationContext);
}
```

## Integration with Workflows

Workflows should integrate with the gamification system to reward users for actions:

```tsx
// Example of workflow integration with gamification
import { useGamification } from "../components/gamification/gamification-context";

function TasksWorkflow() {
  const { state, dispatch } = useTasksWorkflow();
  const { awardXp, updateAchievementProgress } = useGamification();

  const handleCompleteTask = (taskId) => {
    // Update task in workflow state
    dispatch({ type: "COMPLETE_TASK", payload: taskId });

    // Get task details
    const task = state.tasks.find((t) => t.id === taskId);

    // Award XP based on task priority/complexity
    const xpAmount = calculateTaskXp(task);
    awardXp(xpAmount, "tasks");

    // Update achievements
    const completedCount =
      state.tasks.filter((t) => t.status === "completed").length + 1;
    updateAchievementProgress("tasks-complete-10", completedCount);
    updateAchievementProgress("tasks-complete-100", completedCount);
    updateAchievementProgress("tasks-complete-1000", completedCount);

    // Check for special achievements
    if (task.priority > 80) {
      updateAchievementProgress("complete-high-priority", 1);
    }
  };

  // Rest of component...
}

function calculateTaskXp(task) {
  // Base XP for any task
  let xp = 10;

  // Bonus for priority
  xp += Math.floor(task.priority / 10);

  // Bonus for complexity
  if (task.complexity) {
    xp += task.complexity * 5;
  }

  return xp;
}
```

## Integration with AI Advisor

The AI advisor can use gamification data to provide personalized insights:

```tsx
// Example of AI integration with gamification
import { useGamification } from "../components/gamification/gamification-context";
import { useAiAdvisor } from "../components/ai/ai-advisor-context";

function ProfileDashboard() {
  const { state: gamificationState } = useGamification();
  const { processData } = useAiAdvisor();

  // Submit gamification data for AI analysis
  useEffect(() => {
    processData("gamification", {
      powerLevel: gamificationState.powerLevel,
      achievements: gamificationState.achievements,
      habits: gamificationState.habits,
    });
  }, [gamificationState]);

  // Rest of component...
}
```

## Code Examples

### Power Level Component

```tsx
// components/gamification/krilin-power-level.tsx
import React from "react";
import { useGamification } from "./gamification-context";

interface KrilinPowerLevelProps {
  compact?: boolean;
  showBreakdown?: boolean;
}

export default function KrilinPowerLevel({
  compact = false,
  showBreakdown = false,
}: KrilinPowerLevelProps) {
  const { state } = useGamification();
  const { powerLevel } = state;

  // Calculate percentage to next level
  const currentTierProgress =
    powerLevel.nextTierAt === Infinity
      ? 100
      : ((powerLevel.current - getTierMinimum(powerLevel.tier)) /
          (powerLevel.nextTierAt - getTierMinimum(powerLevel.tier))) *
        100;

  // Get domain breakdown for visualization
  const domains = Object.keys(powerLevel.breakdown).filter(
    (domain) => powerLevel.breakdown[domain] > 0
  );

  const totalPower = powerLevel.current;

  // Sort domains by contribution
  const sortedDomains = domains.sort(
    (a, b) => powerLevel.breakdown[b] - powerLevel.breakdown[a]
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 flex items-center justify-center bg-yellow-400 rounded-full">
          <span className="text-xs font-bold">{powerLevel.tier}</span>
        </div>
        <div>
          <span className="font-pixel text-sm text-[#33272a]">
            Power: {powerLevel.current}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fffffc] border-2 border-[#33272a] p-4 rounded-lg">
      <div className="flex justify-between items-baseline mb-2">
        <h3 className="font-pixel text-lg text-[#33272a]">POWER LEVEL</h3>
        <span className="font-pixel text-xl text-[#ff8ba7] font-bold">
          {powerLevel.current}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span>{powerLevel.tierTitle}</span>
          {powerLevel.nextTierAt !== Infinity && (
            <span>Next: {powerLevel.nextTierAt}</span>
          )}
        </div>

        <div className="w-full h-4 bg-gray-200 rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
            style={{ width: `${currentTierProgress}%` }}
          ></div>
        </div>
      </div>

      {showBreakdown && domains.length > 0 && (
        <div className="mt-4">
          <h4 className="font-pixel text-sm mb-2">POWER SOURCES</h4>
          <div className="space-y-2">
            {sortedDomains.map((domain) => (
              <div key={domain}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize">{domain}</span>
                  <span>
                    {powerLevel.breakdown[domain]} (
                    {Math.round(
                      (powerLevel.breakdown[domain] / totalPower) * 100
                    )}
                    %)
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${
                        (powerLevel.breakdown[domain] / totalPower) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to get minimum power for a tier
function getTierMinimum(tier: number): number {
  const tiers = [0, 100, 250, 500, 1000, 2500, 5000];
  return tiers[tier - 1] || 0;
}
```

### Achievement Component

```tsx
// components/gamification/krilin-achievement.tsx
import React from "react";
import { useGamification } from "./gam
```
