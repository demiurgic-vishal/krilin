# Krilin.AI AI Architecture

This document outlines the AI architecture for the Krilin.AI personal assistant application, focusing on how AI integrates with workflows, gamification, and user data to create personalized experiences.

## 📋 Table of Contents

1. [Overview](#overview)
2. [AI Advisor System Architecture](#ai-advisor-system-architecture)
3. [Data Integration Framework](#data-integration-framework)
4. [Personalization Engine](#personalization-engine)
5. [Implementation Guide](#implementation-guide)
6. [Performance Considerations](#performance-considerations)
7. [Future AI Enhancements](#future-ai-enhancements)
8. [Code Examples](#code-examples)

## Overview

The Krilin.AI application uses AI to transform raw user data into personalized insights, recommendations, and automated actions. The AI system acts as:

1. **Personal Coach**: Analyzes patterns and provides guidance
2. **Task Optimizer**: Suggests efficient approaches to tasks
3. **Habit Builder**: Reinforces positive behaviors
4. **Wellness Advisor**: Monitors health metrics and provides recommendations
5. **Data Analyst**: Finds patterns across different areas of life

## AI Advisor System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                      AI ADVISOR SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐        ┌─────────────┐    ┌─────────────┐  │
│  │   Data      │        │  Pattern    │    │ Insight     │  │
│  │ Collection  │───────►│ Recognition │───►│ Generation  │  │
│  └─────────────┘        └─────────────┘    └─────────────┘  │
│         │                                        │          │
│         │                                        ▼          │
│         │                                  ┌─────────────┐  │
│         │                                  │ Action      │  │
│         └──────────────────────────────────► Suggestion  │  │
│                                            └─────────────┘  │
│                                                  │          │
│                                                  ▼          │
│  ┌─────────────┐        ┌─────────────┐    ┌─────────────┐  │
│  │ Personality │        │ Natural     │    │ Response    │  │
│  │ Adaptation  │◄───────│ Language    │◄───│ Formatting  │  │
│  └─────────────┘        │ Generation  │    └─────────────┘  │
│                         └─────────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### System Layers

1. **Data Integration Layer**

   - Collects and normalizes data from workflows
   - Maintains historical user data
   - Implements privacy and data security measures

2. **Analysis Layer**

   - Identifies patterns and correlations
   - Calculates metrics and trends
   - Detects anomalies and significant changes

3. **Insight Layer**

   - Generates personalized insights
   - Prioritizes relevant information
   - Contextualizes findings based on user goals

4. **Action Layer**

   - Suggests specific actions
   - Creates automation sequences
   - Predicts outcomes of potential actions

5. **Presentation Layer**
   - Formats insights in Krilin's personality
   - Generates natural language responses
   - Adapts communication style to user preferences

## Data Integration Framework

### Data Sources

The AI system integrates data from multiple sources:

1. **Workflow Data**

   - Task completion rates and patterns
   - Calendar events and scheduling patterns
   - Note-taking habits and content topics
   - Financial transactions and patterns
   - Health metrics and activities

2. **Application Usage Data**

   - Feature engagement metrics
   - Session timing and duration
   - Navigation patterns
   - Frequently accessed information

3. **External Integrations**
   - Weather data affecting productivity
   - News and information relevance
   - Smart home environment data
   - Third-party health device data

### Data Flow Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Workflow   │     │   External   │     │  Application │
│     Data     │     │     APIs     │     │  Usage Data  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────┐
│                  Data Connectors                     │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│                 Data Normalization                   │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│                 Data Aggregation                     │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│              Privacy Filter & Access Control         │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│                AI Analysis Engine                    │
└──────────────────────────────────────────────────────┘
```

### Data Schema Example

```typescript
// Example data schema for AI analysis
interface AiAnalysisData {
  // User metadata
  userId: string;
  timestamp: string;
  sessionId: string;

  // Core metrics
  workflows: {
    [workflowId: string]: {
      usage: {
        frequency: number; // How often used (times per week)
        duration: number; // Average session length
        lastUsed: string; // ISO date
      };
      metrics: {
        [metricId: string]: {
          value: number;
          trend: "increasing" | "decreasing" | "stable";
          historical: Array<{
            timestamp: string;
            value: number;
          }>;
        };
      };
      actions: {
        [actionId: string]: {
          count: number;
          successRate: number;
        };
      };
    };
  };

  // Cross-workflow correlations
  correlations: Array<{
    source: {
      workflowId: string;
      metricId: string;
    };
    target: {
      workflowId: string;
      metricId: string;
    };
    strength: number; // -1 to 1
    confidence: number; // 0 to 1
  }>;

  // External factors
  externalFactors: {
    weather?: {
      condition: string;
      temperature: number;
    };
    time?: {
      dayOfWeek: number;
      timeOfDay: number;
    };
    // Other external data
  };
}
```

## Personalization Engine

The AI system adapts to individual users through:

### User Modeling

1. **Preference Learning**

   - Tracks user responses to suggestions
   - Identifies preferred communication styles
   - Adapts to user's vocabulary and terminology

2. **Behavioral Patterns**

   - Maps productive time periods
   - Identifies focus habits
   - Recognizes motivation patterns

3. **Goal Alignment**
   - Connects insights to user-stated goals
   - Prioritizes actions based on goal importance
   - Tracks progress toward goals

### Personality Adaptation

The system embodies Krilin's personality traits while adapting to user preferences:

```
┌────────────────────────────────────────────────────────┐
│               PERSONALITY DIMENSIONS                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ► Enthusiasm       Low ────────●──── High             │
│                                                        │
│  ► Directness       Low ──────●────── High             │
│                                                        │
│  ► Detail Level     Low ────────●──── High             │
│                                                        │
│  ► Formality        Low ●──────────── High             │
│                                                        │
│  ► Humor            Low ───────●───── High             │
│                                                        │
│  ► Encouragement    Low ────────────●─ High            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Adaptive Response Generation

The system adjusts communication based on:

1. **Context Awareness**

   - Time of day adaptation
   - Recent user activities
   - Current workflow context

2. **Emotional Intelligence**

   - Recognizes user frustration or success
   - Provides appropriate encouragement
   - Adjusts tone based on situation

3. **Progressive Disclosure**
   - Starts with simple insights
   - Gradually introduces more complex analysis
   - Reveals advanced features as user sophistication grows

## Implementation Guide

### AI Advisor Context

Create a central context for managing AI features:

```tsx
// components/ai/ai-advisor-context.tsx
import React, { createContext, useContext, useReducer, useEffect } from "react";

// Types
interface AiInsight {
  id: string;
  workflowId: string;
  category: "productivity" | "health" | "finance" | "learning";
  title: string;
  description: string;
  confidence: number;
  createdAt: string;
  sources: string[];
  action?: {
    type: string;
    params: Record<string, any>;
  };
}

interface AiState {
  insights: AiInsight[];
  isProcessing: boolean;
  lastProcessed: string | null;
  userPreferences: {
    insightFrequency: "low" | "medium" | "high";
    categories: string[];
    detailLevel: "basic" | "detailed" | "comprehensive";
  };
}

type AiAction =
  | { type: "ADD_INSIGHT"; payload: AiInsight }
  | { type: "PROCESS_DATA_START" }
  | { type: "PROCESS_DATA_COMPLETE" }
  | { type: "UPDATE_PREFERENCES"; payload: Partial<AiState["userPreferences"]> }
  | { type: "ACKNOWLEDGE_INSIGHT"; payload: string };

// Initial state
const initialState: AiState = {
  insights: [],
  isProcessing: false,
  lastProcessed: null,
  userPreferences: {
    insightFrequency: "medium",
    categories: ["productivity", "health", "finance", "learning"],
    detailLevel: "detailed",
  },
};

// Reducer
function aiReducer(state: AiState, action: AiAction): AiState {
  switch (action.type) {
    case "ADD_INSIGHT":
      // Avoid duplicates
      if (state.insights.some((i) => i.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        insights: [action.payload, ...state.insights].slice(0, 50), // Keep last 50 insights
      };

    case "PROCESS_DATA_START":
      return {
        ...state,
        isProcessing: true,
      };

    case "PROCESS_DATA_COMPLETE":
      return {
        ...state,
        isProcessing: false,
        lastProcessed: new Date().toISOString(),
      };

    case "UPDATE_PREFERENCES":
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload,
        },
      };

    case "ACKNOWLEDGE_INSIGHT":
      return {
        ...state,
        insights: state.insights.filter((i) => i.id !== action.payload),
      };

    default:
      return state;
  }
}

// Context
interface AiContextValue {
  state: AiState;
  dispatch: React.Dispatch<AiAction>;
  processData: (workflowId: string, data: any) => void;
  getInsights: (workflowId?: string) => AiInsight[];
  suggestActions: (workflowId: string) => any[];
  acknowledgeInsight: (insightId: string) => void;
}

const AiAdvisorContext = createContext<AiContextValue>({
  state: initialState,
  dispatch: () => null,
  processData: () => null,
  getInsights: () => [],
  suggestActions: () => [],
  acknowledgeInsight: () => null,
});

// Provider
export function AiAdvisorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(aiReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("krilin_ai_state");
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Restore insights and preferences only, not processing state
        if (parsedState.insights) {
          parsedState.insights.forEach((insight: AiInsight) => {
            dispatch({ type: "ADD_INSIGHT", payload: insight });
          });
        }

        if (parsedState.userPreferences) {
          dispatch({
            type: "UPDATE_PREFERENCES",
            payload: parsedState.userPreferences,
          });
        }
      } catch (e) {
        console.error("Failed to restore AI state", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(
      "krilin_ai_state",
      JSON.stringify({
        insights: state.insights,
        userPreferences: state.userPreferences,
      })
    );
  }, [state.insights, state.userPreferences]);

  // Data processing function
  const processData = async (workflowId: string, data: any) => {
    dispatch({ type: "PROCESS_DATA_START" });

    // In a real implementation, this might call an API
    // For now, we'll simulate insight generation

    setTimeout(() => {
      // Example insight generation based on workflow
      if (workflowId === "tasks") {
        const completedTasks =
          data.tasks?.filter((t: any) => t.status === "completed")?.length || 0;
        const totalTasks = data.tasks?.length || 0;

        if (totalTasks > 0 && completedTasks / totalTasks < 0.3) {
          const insight: AiInsight = {
            id: `task-completion-${Date.now()}`,
            workflowId: "tasks",
            category: "productivity",
            title: "Task Completion Rate Low",
            description:
              "Your task completion rate is below 30%. Consider breaking tasks into smaller, more manageable items.",
            confidence: 0.85,
            createdAt: new Date().toISOString(),
            sources: ["tasks"],
            action: {
              type: "SHOW_TASK_SPLITTING_GUIDE",
              params: {},
            },
          };

          dispatch({ type: "ADD_INSIGHT", payload: insight });
        }
      }

      dispatch({ type: "PROCESS_DATA_COMPLETE" });
    }, 500);
  };

  // Get insights filtered by workflow
  const getInsights = (workflowId?: string) => {
    if (!workflowId) {
      return state.insights;
    }
    return state.insights.filter((i) => i.workflowId === workflowId);
  };

  // Get suggested actions for a workflow
  const suggestActions = (workflowId: string) => {
    const relevantInsights = state.insights.filter(
      (i) => i.workflowId === workflowId && i.action
    );

    return relevantInsights.map((i) => i.action);
  };

  // Acknowledge an insight
  const acknowledgeInsight = (insightId: string) => {
    dispatch({ type: "ACKNOWLEDGE_INSIGHT", payload: insightId });
  };

  return (
    <AiAdvisorContext.Provider
      value={{
        state,
        dispatch,
        processData,
        getInsights,
        suggestActions,
        acknowledgeInsight,
      }}
    >
      {children}
    </AiAdvisorContext.Provider>
  );
}

// Hook
export function useAiAdvisor() {
  return useContext(AiAdvisorContext);
}
```

### Integration with Workflows

Use the AI Advisor in workflow components:

```tsx
// Example workflow with AI integration
import { useAiAdvisor } from "../components/ai/ai-advisor-context";

function HealthWorkflow() {
  const { state, dispatch } = useHealthWorkflow();
  const { processData, getInsights, suggestActions } = useAiAdvisor();

  // Submit data for analysis whenever it changes
  useEffect(() => {
    const healthData = {
      metrics: state.metrics,
      activities: state.activities,
      sleep: state.sleepData,
      goals: state.goals,
    };

    processData("health", healthData);
  }, [state.metrics, state.activities, state.sleepData, state.goals]);

  // Get insights specific to health
  const healthInsights = getInsights("health");

  // Render insights
  return (
    <div>
      {/* Workflow UI */}

      {/* AI Insights Section */}
      {healthInsights.length > 0 && (
        <KrilinCard title="KRILIN'S ADVICE">
          {healthInsights.map((insight) => (
            <div
              key={insight.id}
              className="p-3 mb-2 bg-[#fffaeb] border border-[#ff8ba7] rounded-lg"
            >
              <h4 className="font-bold text-[#33272a]">{insight.title}</h4>
              <p className="text-sm text-[#594a4e]">{insight.description}</p>

              {insight.action && (
                <button
                  className="mt-2 px-3 py-1 bg-[#ffc6c7] text-[#33272a] rounded text-xs"
                  onClick={() => handleSuggestedAction(insight.action)}
                >
                  Try This
                </button>
              )}
            </div>
          ))}
        </KrilinCard>
      )}
    </div>
  );
}
```

## Performance Considerations

### Client-side Optimization

1. **Selective Processing**

   - Process data on significant changes only
   - Use debouncing for frequent updates
   - Implement worker threads for intensive calculations

2. **Data Efficiency**

   - Limit historical data stored in browser
   - Aggregate data before analysis
   - Use efficient data structures

3. **Rendering Optimization**
   - Limit insight rendering to visible sections
   - Implement virtualization for long lists
   - Memoize components that display AI content

### Future Server-side Processing

In future versions, consider:

1. **API-based Analysis**

   - Offload intensive processing to server
   - Implement secure data transmission
   - Maintain privacy through data minimization

2. **Hybrid Approach**
   - Process basic insights on client
   - Use server for complex correlations
   - Implement caching strategy for results

## Future AI Enhancements

### Short-term Roadmap

1. **Enhanced Pattern Recognition**

   - Implement more sophisticated correlation detection
   - Add seasonal pattern recognition
   - Develop productivity cycle detection

2. **Improved Natural Language**

   - Enhance personality traits in responses
   - Implement more varied response templates
   - Add context-aware humor

3. **Expanded Integration**
   - Connect insights across more workflows
   - Add third-party data source integration
   - Implement richer visualization of insights

### Long-term Vision

1. **Predictive Analytics**

   - Forecast productivity patterns
   - Predict potential obstacles
   - Suggest preemptive actions

2. **Voice Interface**

   - Implement voice-based interaction
   - Develop Krilin's voice personality
   - Create contextual voice responses

3. **Advanced Personalization**
   - Learn from user feedback on insights
   - Adapt to changing user preferences over time
   - Create user-specific insight models

## Code Examples

### AI Insight Component

```tsx
// components/ai/krilin-insight.tsx
import React from "react";
import { useAiAdvisor } from "./ai-advisor-context";

interface KrilinInsightProps {
  workflowId?: string;
  maxInsights?: number;
  showActions?: boolean;
}

export default function KrilinInsight({
  workflowId,
  maxInsights = 3,
  showActions = true,
}: KrilinInsightProps) {
  const { getInsights, acknowledgeInsight } = useAiAdvisor();

  // Get insights, optionally filtered by workflow
  const insights = getInsights(workflowId).slice(0, maxInsights);

  if (insights.length === 0) {
    return null;
  }

  // Get random Krilin phrases for variety
  const getKrilinPhrase = () => {
    const phrases = [
      "Hey there! I noticed something interesting!",
      "Power up your day with this insight!",
      "Check this out - it might help your training!",
      "Based on my analysis, I found something cool!",
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <div
          key={insight.id}
          className="border-2 border-[#ffc6c7] bg-[#fff5f5] p-4 rounded-lg"
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-pixel text-md font-bold text-[#33272a]">
              {insight.title}
            </h4>
            <span className="text-xs bg-[#ffadad] px-2 py-1 rounded">
              {insight.category.toUpperCase()}
            </span>
          </div>

          <p className="text-sm mb-3">
            {getKrilinPhrase()} {insight.description}
          </p>

          <div className="flex justify-between items-center">
            <div className="text-xs text-[#594a4e]">
              Confidence: {(insight.confidence * 100).toFixed(0)}%
            </div>

            <div className="flex gap-2">
              {showActions && insight.action && (
                <button className="px-3 py-1 bg-[#ffc6c7] text-[#33272a] rounded text-xs">
                  Try This
                </button>
              )}

              <button
                onClick={() => acknowledgeInsight(insight.id)}
                className="px-3 py-1 bg-[#e9ecef] text-[#33272a] rounded text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### AI Data Collection Hook

```tsx
// hooks/use-ai-data-collection.ts
import { useEffect } from "react";
import { useAiAdvisor } from "../components/ai/ai-advisor-context";

// Generic hook for AI data collection with debouncing
export function useAiDataCollection<T>(
  workflowId: string,
  data: T,
  dependencies: any[],
  debounceMs: number = 2000
) {
  const { processData } = useAiAdvisor();

  useEffect(() => {
    // Don't process immediately, wait for user to finish making changes
    const handler = setTimeout(() => {
      processData(workflowId, data);
    }, debounceMs);

    // Clean up timeout if dependencies change before timeout completes
    return () => clearTimeout(handler);
  }, dependencies);
}

// Usage example:
// In a workflow component:
// useAiDataCollection('tasks', taskData, [tasks, filters, sortOrder]);
```

---

By implementing this AI architecture, Krilin.AI will provide users with personalized insights, suggestions, and assistance while maintaining the application's distinctive personality and approach to personal development.
