# Krilin.AI Workflow Framework

This document provides a comprehensive guide to structuring workflows in the Krilin.AI application, creating a consistent development framework and enhancing user experience.

## 📋 Table of Contents

1. [Introduction to Workflows](#introduction-to-workflows)
2. [Workflow Architecture](#workflow-architecture)
3. [Creating New Workflows](#creating-new-workflows)
4. [Workflow Sequences](#workflow-sequences)
5. [Workflow-AI Integration](#workflow-ai-integration)
6. [Gamification Integration](#gamification-integration)
7. [State Management](#state-management)
8. [Best Practices](#best-practices)
9. [Code Examples](#code-examples)

## Introduction to Workflows

### What is a Workflow?

In Krilin.AI, a workflow is a specialized interface designed to help users accomplish a specific category of tasks. Each workflow combines:

- **Task-Specific UI**: Tailored interfaces for different types of activities
- **Data Management**: Logic for storing and manipulating domain-specific data
- **Automation Capabilities**: Tools to reduce repetitive actions
- **Insight Generation**: Analytics and AI-powered suggestions
- **Gamification Elements**: Motivation through achievements and rewards

### Core Workflow Principles

1. **Single Responsibility**: Each workflow should focus on a specific domain
2. **Composability**: Workflows should be able to interact and share data
3. **Consistency**: Similar patterns should be used across workflows
4. **Personalization**: Users should be able to customize workflow behavior
5. **Gamification**: All workflows should contribute to the user's overall progress

## Workflow Architecture

### Technical Structure

```
workflows/
├── index.ts                  # Export all workflow components
├── core/                     # Core workflow logic
│   ├── workflow-context.tsx  # Shared workflow context
│   ├── workflow-types.ts     # TypeScript interfaces for workflows
│   ├── workflow-utils.ts     # Shared utilities
│   └── workflow-store.ts     # Data persistence layer
├── templates/                # Base workflow templates
│   ├── list-workflow.tsx     # Template for list-based workflows
│   ├── calendar-workflow.tsx # Template for time-based workflows
│   └── tracker-workflow.tsx  # Template for metric-based workflows
└── [domain]/                 # Domain-specific workflows
    ├── [domain]-workflow.tsx # Main workflow component
    ├── [domain]-actions.ts   # Domain-specific actions
    ├── [domain]-insights.ts  # Domain-specific analytics
    └── [domain]-store.ts     # Domain-specific persistence
```

### Component Architecture

Each workflow should follow this layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                  Workflow Component                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐       ┌─────────────────────┐     │
│  │    Header       │       │   Action Buttons    │     │
│  └─────────────────┘       └─────────────────────┘     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │                 Main Content                    │   │
│  │                                                 │   │
│  │   (Task List, Calendar, Tracker, etc.)          │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────┐   ┌─────────────────────┐     │
│  │  Metrics/Analytics  │   │    Krilin Wisdom    │     │
│  └─────────────────────┘   └─────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User Action  │────►│  Workflow    │────►│  Workflow    │
│              │     │  Context     │     │  Store       │
└──────────────┘     └──────────────┘     └──────────────┘
       ▲                    │                    │
       │                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ UI Update    │◄────│  Render      │     │  Persistence │
│              │     │  Logic       │     │  (localStorage)│
└──────────────┘     └──────────────┘     └──────────────┘
                           │                    │
                           ▼                    ▼
                     ┌──────────────┐     ┌──────────────┐
                     │ Gamification │     │ AI Analysis  │
                     │ Integration  │     │ Integration  │
                     └──────────────┘     └──────────────┘
```

## Creating New Workflows

### Workflow Creation Process

1. **Identify the domain** the workflow will address
2. **Choose a template** that matches the workflow's primary pattern:
   - List-based workflows (Tasks, Notes, Shopping)
   - Time-based workflows (Calendar, Pomodoro)
   - Metric-based workflows (Health, Finance)
3. **Define the data model** for the workflow
4. **Create workflow actions** that will manipulate the data
5. **Design the UI** with consistent components
6. **Add gamification elements** to reward user progress
7. **Integrate AI** for intelligent assistance
8. **Implement data persistence** to save user data

### Workflow Component Structure

New workflows should follow this component structure:

```tsx
// Example workflow structure
export default function ExampleWorkflow() {
  // 1. State management
  const [items, setItems] = useState([...]);

  // 2. Action handlers
  const handleAddItem = () => {...};
  const handleUpdateItem = () => {...};

  // 3. Effect hooks for side effects
  useEffect(() => {
    // Load data, setup listeners, etc.
  }, []);

  // 4. Helper functions/calculations
  const calculateMetrics = () => {...};

  // 5. Rendering
  return (
    <div>
      {/* Header */}
      <KrilinCard title="EXAMPLE WORKFLOW" className="mb-6">
        {/* Action Interface */}
        <div className="mb-4 flex">
          <input ... />
          <KrilinButton onClick={handleAddItem}>ADD</KrilinButton>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="...">
              {/* Item rendering */}
            </div>
          ))}
        </div>
      </KrilinCard>

      {/* Metrics Panel */}
      <KrilinCard title="METRICS">
        <div className="space-y-3">
          <KrilinPowerMeter ... />
          {/* Additional metrics */}
        </div>
      </KrilinCard>
    </div>
  );
}
```

## Workflow Sequences

Workflow sequences connect multiple workflow actions into automated chains.

### Sequence Structure

A workflow sequence consists of:

1. **Trigger**: An event that starts the sequence
2. **Steps**: A series of actions across one or more workflows
3. **Conditions**: Optional logic that determines the flow between steps
4. **Outcome**: The final result of the sequence

### Sequence Definition Example

```tsx
// Example sequence definition
const morningSequence = {
  id: "morning-routine",
  name: "Morning Routine",
  description: "Start your day with weather, news, and task planning",
  trigger: { type: "time", value: "08:00" },
  steps: [
    {
      workflowId: "weather",
      action: "fetchWeather",
      params: { location: "current" },
    },
    {
      workflowId: "news",
      action: "fetchHeadlines",
      params: { categories: ["tech", "business"] },
    },
    {
      workflowId: "tasks",
      action: "createTasksFromEvents",
      params: { date: "today" },
    },
  ],
  conditions: [
    {
      if: { data: "weather", field: "condition", value: "rainy" },
      then: {
        workflowId: "tasks",
        action: "addTask",
        params: { text: "Remember umbrella", priority: "high" },
      },
    },
  ],
};
```

## Workflow-AI Integration

Each workflow should expose data and patterns to the AI advisor for analysis and insights.

### Integration Points

1. **Data Export**: Workflows should provide structured data to the AI system
2. **Action Import**: Workflows should accept AI-suggested actions
3. **Pattern Recognition**: AI should identify patterns across workflows
4. **Contextual Advice**: AI should provide workflow-specific guidance

### Implementation Example

```tsx
// Example AI integration in a workflow
import { useAiAdvisor } from "../components/ai/ai-advisor-context";

function TasksWorkflow() {
  const { state, dispatch } = useTasksWorkflow();
  const { getInsights, suggestActions } = useAiAdvisor();

  // Export task data to AI
  useEffect(() => {
    // Provide AI with task completion patterns
    const taskData = {
      type: "tasks",
      completionRates: calculateCompletionRates(state.tasks),
      timeOfDayPatterns: analyzeTimePatterns(state.tasks),
      priorityDistribution: analyzePriorities(state.tasks),
    };

    // Send data to AI system
    aiAdvisor.processData(taskData);
  }, [state.tasks]);

  // Get AI insights for this workflow
  const aiInsights = getInsights("tasks");

  // Get AI suggested actions
  const suggestedActions = suggestActions("tasks");

  // Render insights and suggestions in the UI
  // ...
}
```

## Gamification Integration

Workflows should contribute to the user's overall progress and gamification elements.

### Integration Points

1. **XP Generation**: Define how workflow actions earn experience points
2. **Achievement Triggers**: Define milestones that unlock achievements
3. **Habit Formation**: Track consecutive usage for streak rewards
4. **Power Level Contribution**: How the workflow affects overall power level

### Implementation Example

```tsx
// Example gamification integration
import { useGamification } from "../components/gamification/gamification-context";

function TasksWorkflow() {
  const { state, dispatch } = useTasksWorkflow();
  const { awardXp, updatePowerLevel, checkAchievements } = useGamification();

  // Award XP for completing tasks
  const handleCompleteTask = (taskId) => {
    dispatch({ type: "COMPLETE_TASK", payload: taskId });

    // Award XP based on task priority
    const task = state.tasks.find((t) => t.id === taskId);
    const xpAmount = calculateXpForTask(task);
    awardXp(xpAmount, "task_completion");

    // Check for achievements
    checkAchievements("tasks", {
      tasksCompleted: state.completedTasks + 1,
      priorityLevel: task.priority,
    });

    // Update power level
    updatePowerLevel("tasks", calculatePowerContribution(state));
  };

  // ...
}
```

## State Management

### Context Structure

Each workflow should have its own context for state management:

```tsx
// Example workflow context
import { createContext, useReducer, useContext } from 'react';

// Define the state shape
interface TasksState {
  tasks: Task[];
  filter: string;
  sortBy: string;
  metrics: {
    completed: number;
    pending: number;
    averagePriority: number;
  };
}

// Define action types
type TasksAction =
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id'> }
  | { type: 'COMPLETE_TASK'; payload: string }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_FILTER'; payload: string }
  | { type: 'SET_SORT'; payload: string };

// Create initial state
const initialState: TasksState = {
  tasks: [],
  filter: 'all',
  sortBy: 'priority',
  metrics: {
    completed: 0,
    pending: 0,
    averagePriority: 0
  }
};

// Create reducer
function tasksReducer(state: TasksState, action: TasksAction): TasksState {
  switch (action.type) {
    case 'ADD_TASK':
      // Handle adding task
      return { ... };

    case 'COMPLETE_TASK':
      // Handle completing task
      return { ... };

    // Handle other actions

    default:
      return state;
  }
}

// Create context
const TasksContext = createContext<{
  state: TasksState;
  dispatch: React.Dispatch<TasksAction>;
}>({
  state: initialState,
  dispatch: () => null
});

// Create provider
export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tasksReducer, initialState);

  return (
    <TasksContext.Provider value={{ state, dispatch }}>
      {children}
    </TasksContext.Provider>
  );
}

// Create hook
export function useTasksWorkflow() {
  return useContext(TasksContext);
}
```

### Persistence

Use a unified approach to persist workflow data:

```tsx
// Example persistence hook
import { useEffect } from "react";

export function useWorkflowPersistence<T>(
  key: string,
  state: T,
  dispatch: React.Dispatch<any>
) {
  // Load data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`krilin_workflow_${key}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: "RESTORE_STATE", payload: parsedData });
      } catch (e) {
        console.error("Failed to load saved workflow data", e);
      }
    }
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem(`krilin_workflow_${key}`, JSON.stringify(state));
  }, [state, key]);
}
```

## Best Practices

### User Experience

1. **Consistency**: Use the same patterns across workflows
2. **Progressive Disclosure**: Start simple, reveal advanced features as needed
3. **Feedback**: Provide clear feedback for all actions
4. **Error Handling**: Handle errors gracefully with helpful messages
5. **Performance**: Optimize for speed, especially for large datasets

### Code Quality

1. **TypeScript**: Use strong typing for all workflow components
2. **Pure Functions**: Keep reducer functions pure and predictable
3. **Component Isolation**: Minimize dependencies between workflows
4. **Testing**: Write unit tests for workflow logic
5. **Documentation**: Document all workflow interfaces and APIs

## Code Examples

### Basic Workflow Template

```tsx
// Example of a structured workflow template
import { useState, useEffect } from "react";
import KrilinCard from "../components/krilin-card";
import KrilinButton from "../components/krilin-button";
import KrilinPowerMeter from "../components/krilin-power-meter";
import { useGamification } from "../components/gamification/gamification-context";
import { useAiAdvisor } from "../components/ai/ai-advisor-context";

export default function WorkflowTemplate() {
  // State
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState({
    progress: 0,
    efficiency: 0,
    streak: 0
  });

  // Integration hooks
  const gamification = useGamification();
  const aiAdvisor = useAiAdvisor();

  // Load initial data
  useEffect(() => {
    // Load from localStorage or mock service
    const savedItems = localStorage.getItem("workflow_items");
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  // Save data when it changes
  useEffect(() => {
    localStorage.setItem("workflow_items", JSON.stringify(items));

    // Update metrics
    const newMetrics = calculateMetrics(items);
    setMetrics(newMetrics);

    // Update gamification
    gamification.updateProgress("workflow", newMetrics.progress);

    // Provide data to AI
    aiAdvisor.analyzeData("workflow", {
      items,
      metrics: newMetrics
    });
  }, [items]);

  // Action handlers
  const handleAddItem = (newItem) => {
    setItems([...items, { ...newItem, id: Date.now() }]);
    gamification.awardXp(5, "workflow_add_item");
  };

  const handleCompleteItem = (id) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, status: "completed" }
        : item
    ));
    gamification.awardXp(10, "workflow_complete_item");
  };

  // Helper functions
  const calculateMetrics = (itemList) => {
    // Calculate metrics based on items
    const completed = itemList.filter(i => i.status === "completed").length;
    const total = itemList.length;

    return {
      progress: total > 0 ? (completed / total) * 100 : 0,
      efficiency: /* calculate efficiency */,
      streak: /* calculate streak */
    };
  };

  // Get AI insights
  const aiInsights = aiAdvisor.getInsights("workflow");

  // Render
  return (
    <div className="space-y-6">
      {/* Main workflow card */}
      <KrilinCard title="WORKFLOW TEMPLATE" className="mb-6">
        {/* Input area */}
        <div className="mb-4 flex">
          <input
            type="text"
            placeholder="Add new item..."
            className="flex-1 p-2 mr-2 font-pixel text-sm border-2 border-[#33272a] bg-[#fffffc]"
          />
          <KrilinButton onClick={() => handleAddItem({ text: "New item", status: "pending" })}>
            ADD
          </KrilinButton>
        </div>

        {/* Items list */}
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="border-2 border-[#33272a] p-3 bg-[#fffffc]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.status === "completed"}
                    onChange={() => handleCompleteItem(item.id)}
                    className="w-4 h-4 accent-[#ff6b35]"
                  />
                  <span className="font-pixel text-sm text-[#33272a]">
                    {item.text}
                  </span>
                </div>
                <div>
                  <KrilinButton variant="secondary" className="px-2 py-1 text-xs">
                    EDIT
                  </KrilinButton>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Insights */}
        {aiInsights && (
          <div className="mt-4 p-3 border-2 border-[#ffc6c7] bg-[#fff5f5]">
            <h4 className="font-pixel text-sm mb-2">KRILIN'S INSIGHT:</h4>
            <p className="text-sm">{aiInsights}</p>
          </div>
        )}
      </KrilinCard>

      {/* Metrics card */}
      <KrilinCard title="WORKFLOW METRICS">
        <div className="space-y-3">
          <KrilinPowerMeter value={metrics.progress} label="PROGRESS" />
          <KrilinPowerMeter value={metrics.efficiency} label="EFFICIENCY" />
          <KrilinPowerMeter value={metrics.streak} label="STREAK" />
        </div>
      </KrilinCard>
    </div>
  );
}
```

### Workflow Context Example

```tsx
// Example of a complete workflow context with persistence
import React, { createContext, useContext, useReducer, useEffect } from "react";

// Types
export interface WorkflowItem {
  id: number;
  text: string;
  status: "pending" | "in-progress" | "completed";
  priority: number;
  created: string;
  modified: string;
}

interface WorkflowState {
  items: WorkflowItem[];
  filter: string;
  metrics: {
    completion: number;
    priority: number;
    streak: number;
  };
}

type WorkflowAction =
  | {
      type: "ADD_ITEM";
      payload: Omit<WorkflowItem, "id" | "created" | "modified">;
    }
  | { type: "UPDATE_ITEM"; payload: Partial<WorkflowItem> & { id: number } }
  | { type: "DELETE_ITEM"; payload: number }
  | { type: "SET_FILTER"; payload: string }
  | { type: "RESTORE_STATE"; payload: WorkflowState };

// Initial state
const initialState: WorkflowState = {
  items: [],
  filter: "all",
  metrics: {
    completion: 0,
    priority: 0,
    streak: 0,
  },
};

// Reducer
function workflowReducer(
  state: WorkflowState,
  action: WorkflowAction
): WorkflowState {
  switch (action.type) {
    case "ADD_ITEM":
      const newItem: WorkflowItem = {
        id: Date.now(),
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        ...action.payload,
      };
      return {
        ...state,
        items: [...state.items, newItem],
        metrics: calculateMetrics([...state.items, newItem]),
      };

    case "UPDATE_ITEM":
      const updatedItems = state.items.map((item) =>
        item.id === action.payload.id
          ? { ...item, ...action.payload, modified: new Date().toISOString() }
          : item
      );
      return {
        ...state,
        items: updatedItems,
        metrics: calculateMetrics(updatedItems),
      };

    case "DELETE_ITEM":
      const filteredItems = state.items.filter(
        (item) => item.id !== action.payload
      );
      return {
        ...state,
        items: filteredItems,
        metrics: calculateMetrics(filteredItems),
      };

    case "SET_FILTER":
      return {
        ...state,
        filter: action.payload,
      };

    case "RESTORE_STATE":
      return action.payload;

    default:
      return state;
  }
}

// Helper function to calculate metrics
function calculateMetrics(items: WorkflowItem[]): WorkflowState["metrics"] {
  if (items.length === 0) {
    return { completion: 0, priority: 0, streak: 0 };
  }

  const completed = items.filter((i) => i.status === "completed").length;
  const totalPriority = items.reduce((sum, item) => sum + item.priority, 0);

  return {
    completion: (completed / items.length) * 100,
    priority: totalPriority / items.length,
    streak: 0, // Calculate streak based on business logic
  };
}

// Context
interface WorkflowContextType {
  state: WorkflowState;
  dispatch: React.Dispatch<WorkflowAction>;
}

const WorkflowContext = createContext<WorkflowContextType>({
  state: initialState,
  dispatch: () => null,
});

// Provider
export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  // Load data on mount
  useEffect(() => {
    const savedData = localStorage.getItem("krilin_workflow_data");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: "RESTORE_STATE", payload: parsedData });
      } catch (e) {
        console.error("Failed to load workflow data", e);
      }
    }
  }, []);

  // Save data when it changes
  useEffect(() => {
    localStorage.setItem("krilin_workflow_data", JSON.stringify(state));
  }, [state]);

  return (
    <WorkflowContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkflowContext.Provider>
  );
}

// Hook
export function useWorkflow() {
  return useContext(WorkflowContext);
}
```

---

By following this framework, you'll create a consistent, maintainable, and feature-rich workflow system that forms the backbone of the Krilin.AI application. The structured approach ensures both developers and users have a clear understanding of how workflows function and interact.
