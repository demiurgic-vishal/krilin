# Krilin.AI Implementation Guide

This document provides a structured approach to implementing and organizing the Krilin.AI application, combining all the architectural components into a cohesive, maintainable system.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Core Systems Integration](#core-systems-integration)
4. [State Management Architecture](#state-management-architecture)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Component Guidelines](#component-guidelines)
7. [Development Best Practices](#development-best-practices)
8. [Testing Strategy](#testing-strategy)

## Project Overview

Krilin.AI consists of three primary interconnected systems:

1. **Workflow System**: Task-specific interfaces for daily productivity and life management activities
2. **AI Advisor System**: Intelligent analysis and guidance based on user data and patterns
3. **Gamification System**: Motivation and progress tracking through game-like mechanics

These systems work together to create a personal assistant that is both functional and engaging:

```
┌─────────────────────────────────────────────────────────────┐
│                     KRILIN.AI ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐         ┌─────────────┐                   │
│  │  WORKFLOW   │◄────────►     AI      │                   │
│  │   SYSTEM    │         │   SYSTEM    │                   │
│  └─────────────┘         └─────────────┘                   │
│        ▲                        ▲                          │
│        │                        │                          │
│        ▼                        ▼                          │
│  ┌─────────────────────────────────────────────┐          │
│  │              GAMIFICATION SYSTEM            │          │
│  └─────────────────────────────────────────────┘          │
│                        ▲                                   │
│                        │                                   │
│                        ▼                                   │
│  ┌─────────────────────────────────────────────┐          │
│  │               UI COMPONENTS                 │          │
│  └─────────────────────────────────────────────┘          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Directory Structure

Reorganize the project with this improved structure:

```
krilin-ai/
├── app/                              # Next.js app directory
│   ├── (auth)/                       # Authentication routes
│   ├── dashboard/                    # Main dashboard
│   ├── productivity/                 # Productivity features
│   ├── wellness/                     # Wellness features
│   ├── settings/                     # Settings pages
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Homepage
│
├── components/                       # Reusable UI components
│   ├── core/                         # Core app components
│   │   ├── krilin-button.tsx
│   │   ├── krilin-card.tsx
│   │   ├── krilin-header.tsx
│   │   └── ...
│   │
│   ├── ui/                           # Basic UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   ├── workflows/                    # Workflow-specific components
│   │   ├── tasks/
│   │   ├── calendar/
│   │   ├── email/
│   │   └── ...
│   │
│   ├── gamification/                 # Gamification components
│   │   ├── achievement-system/
│   │   ├── habit-tracker/
│   │   ├── power-level/
│   │   └── ...
│   │
│   └── ai/                           # AI-related components
│       ├── advisor/
│       ├── insights/
│       └── ...
│
├── contexts/                         # React Context providers
│   ├── workflow-context.tsx
│   ├── ai-context.tsx
│   ├── gamification-context.tsx
│   └── ...
│
├── lib/                              # Utility functions and services
│   ├── api/                          # API clients and services
│   ├── utils/                        # Helper functions
│   └── hooks/                        # Custom React hooks
│
├── data/                             # Data models and mock data
│   ├── models/                       # TypeScript interfaces
│   ├── mock/                         # Mock data for development
│   └── storage/                      # Data persistence utilities
│
├── workflows/                        # Workflow definitions
│   ├── core/                         # Core workflow logic
│   ├── templates/                    # Workflow templates
│   └── [domain]/                     # Domain-specific workflows
│
├── public/                           # Static assets
│   ├── images/
│   └── icons/
│
└── styles/                           # Global styles
    └── globals.css
```

## Core Systems Integration

The three core systems should interact through well-defined interfaces:

### Workflow ⟷ AI Integration

```typescript
// Example integration point in a workflow
import { useAiAdvisor } from "@/contexts/ai-context";
import { useWorkflow } from "@/contexts/workflow-context";

function TaskWorkflow() {
  // Workflow state
  const { tasks, completionRate } = useWorkflow("tasks");

  // AI integration
  const { processData, getInsights } = useAiAdvisor();

  // Submit workflow data to AI
  useEffect(() => {
    if (tasks.length > 0) {
      processData("tasks", {
        tasks,
        metrics: { completionRate },
        patterns: analyzeTaskPatterns(tasks),
      });
    }
  }, [tasks, completionRate]);

  // Get AI insights for this workflow
  const insights = getInsights("tasks");

  // Rest of component...
}
```

### Workflow ⟷ Gamification Integration

```typescript
// Example integration point in a workflow
import { useGamification } from "@/contexts/gamification-context";
import { useWorkflow } from "@/contexts/workflow-context";

function TaskWorkflow() {
  // Workflow state
  const { tasks, dispatch } = useWorkflow("tasks");

  // Gamification integration
  const { awardXp, updateAchievement } = useGamification();

  // Handle task completion with gamification
  const completeTask = (taskId) => {
    // Update workflow state
    dispatch({ type: "COMPLETE_TASK", payload: taskId });

    // Award XP based on task complexity
    const task = tasks.find((t) => t.id === taskId);
    const xpAmount = calculateTaskXp(task);
    awardXp(xpAmount, "tasks");

    // Update relevant achievements
    const totalCompleted =
      tasks.filter((t) => t.status === "completed").length + 1;
    updateAchievement("task-master", totalCompleted);
  };

  // Rest of component...
}
```

### AI ⟷ Gamification Integration

```typescript
// Example integration in AI advisor component
import { useAiAdvisor } from "@/contexts/ai-context";
import { useGamification } from "@/contexts/gamification-context";

function AiInsightDisplay() {
  // AI state
  const { insights, acknowledgeInsight } = useAiAdvisor();

  // Gamification integration
  const { awardXp } = useGamification();

  // Handle applying an AI insight with gamification reward
  const applyInsight = (insightId) => {
    // Find the insight
    const insight = insights.find((i) => i.id === insightId);

    // Apply the suggested action
    if (insight?.action) {
      executeInsightAction(insight.action);

      // Award XP for following AI advice
      awardXp(15, "ai_collaboration");

      // Mark as acknowledged in AI system
      acknowledgeInsight(insightId);
    }
  };

  // Rest of component...
}
```

## State Management Architecture

Implement a consistent state management approach across all systems:

### Context Structure

1. **Root App Context**: Provides global app state
2. **Domain-Specific Contexts**: Separate contexts for workflows, AI, and gamification
3. **Feature-Specific Contexts**: For specific features that need isolated state

```
┌─────────────────────────────────────────────────┐
│               AppContextProvider                │
└───────────────────────┬─────────────────────────┘
                        │
    ┌───────────────────┼───────────────────┐
    ▼                   ▼                   ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Workflow   │   │     AI      │   │Gamification │
│  Context    │   │   Context   │   │  Context    │
└──┬───────┬──┘   └─────────────┘   └─────────────┘
   │       │
   ▼       ▼
┌─────┐ ┌─────┐
│Tasks│ │Email│  ... (Feature-specific contexts)
│     │ │     │
└─────┘ └─────┘
```

### Context Implementation Pattern

Use a consistent pattern for all contexts:

```typescript
// contexts/example-context.tsx
import React, { createContext, useContext, useReducer, useEffect } from "react";
import { persistData, loadData } from "@/lib/storage";

// State interface
interface ExampleState {
  // State properties
}

// Action types
type ExampleAction =
  | { type: "ACTION_ONE"; payload: any }
  | { type: "ACTION_TWO"; payload: any };

// Create context
const ExampleContext = createContext<{
  state: ExampleState;
  dispatch: React.Dispatch<ExampleAction>;
  // Additional helper functions
}>({
  // Default values
});

// Initial state
const initialState: ExampleState = {
  // Initial values
};

// Reducer
function exampleReducer(
  state: ExampleState,
  action: ExampleAction
): ExampleState {
  switch (action.type) {
    case "ACTION_ONE":
      // Handle action
      return { ...state /* updated values */ };
    // Other cases
    default:
      return state;
  }
}

// Provider component
export function ExampleProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(exampleReducer, initialState);

  // Load data on mount
  useEffect(() => {
    const savedData = loadData("example_data");
    if (savedData) {
      dispatch({ type: "LOAD_DATA", payload: savedData });
    }
  }, []);

  // Save data on state change
  useEffect(() => {
    persistData("example_data", state);
  }, [state]);

  // Helper functions
  const helperFunction = () => {
    // Implementation
  };

  return (
    <ExampleContext.Provider
      value={{
        state,
        dispatch,
        helperFunction,
      }}
    >
      {children}
    </ExampleContext.Provider>
  );
}

// Hook for consumers
export function useExample() {
  return useContext(ExampleContext);
}
```

## Implementation Roadmap

Follow this phased approach to implement the application:

### Phase 1: Foundation (1-2 weeks)

1. **Project Setup**

   - Reorganize project structure
   - Configure build system
   - Set up styling framework

2. **Core Components**

   - Create base UI components
   - Implement theming system
   - Build core layout components

3. **State Management**
   - Implement context architecture
   - Create data persistence utilities
   - Set up mock data services

### Phase 2: Core Systems (2-3 weeks)

1. **Workflow System**

   - Implement workflow templates
   - Create task workflow
   - Add calendar workflow
   - Build notes workflow

2. **AI Foundation**

   - Create AI context
   - Implement insight generation logic
   - Build AI advisor component

3. **Gamification System**
   - Implement power level system
   - Create achievement tracking
   - Build habit tracker

### Phase 3: Integration (2 weeks)

1. **Cross-System Integration**

   - Connect workflows with AI
   - Integrate gamification with workflows
   - Link AI with gamification

2. **Dashboard**

   - Create main dashboard
   - Implement workflow switcher
   - Add progress visualizations

3. **Data Synchronization**
   - Implement local storage persistence
   - Add export/import functionality
   - Create data backup utilities

### Phase 4: Polish (1-2 weeks)

1. **Visual Polish**

   - Refine UI components
   - Add animations and transitions
   - Implement responsive design

2. **Performance Optimization**

   - Optimize component rendering
   - Implement lazy loading
   - Add caching strategies

3. **Testing and Refinement**
   - Perform usability testing
   - Fix bugs and issues
   - Refine user experience

## Component Guidelines

Follow these guidelines for consistent component development:

### Component Structure

1. **Imports**: Group imports by type (React, external libraries, internal components, styles)
2. **Types**: Define component props and other types at the top
3. **Component**: Main component function with descriptive name
4. **Hooks**: Place hooks at the top of the component function
5. **Helper Functions**: Define component-specific functions inside the component
6. **Return**: Render JSX with proper formatting and comments for complex sections

```tsx
// Example component structure
import React, { useState, useEffect } from "react";
import classNames from "classnames";

// Internal imports
import { KrilinButton } from "@/components/core";
import { useWorkflow } from "@/contexts/workflow-context";
import { useGamification } from "@/contexts/gamification-context";

// Types
interface ExampleComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export default function ExampleComponent({
  title,
  description = "Default description",
  onAction,
}: ExampleComponentProps) {
  // Hooks
  const [isActive, setIsActive] = useState(false);
  const { data, actions } = useWorkflow();
  const { awardXp } = useGamification();

  // Side effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // Event handlers
  const handleClick = () => {
    setIsActive(!isActive);
    if (onAction) onAction();
    awardXp(5, "interaction");
  };

  // Helper functions
  const getStatusText = () => {
    return isActive ? "Active" : "Inactive";
  };

  // Classes
  const containerClasses = classNames("base-class", {
    "active-class": isActive,
    "special-class": data.isSpecial,
  });

  // Render
  return (
    <div className={containerClasses}>
      <h3 className="title">{title}</h3>

      {description && <p className="description">{description}</p>}

      <div className="status">Status: {getStatusText()}</div>

      <KrilinButton onClick={handleClick}>Toggle Status</KrilinButton>
    </div>
  );
}
```

### Component Types

Organize components into these categories:

1. **Page Components**: Full pages rendered by Next.js routes
2. **Layout Components**: Structure the page layout
3. **Container Components**: Manage state and data flow
4. **Presentational Components**: Render UI based on props
5. **Core Components**: Base UI building blocks

### Component Naming

Use consistent naming conventions:

1. **Krilin-prefixed components**: Used for app-specific styled components (`KrilinButton`, `KrilinCard`)
2. **Workflow components**: Named by domain (`TasksWorkflow`, `CalendarWorkflow`)
3. **Feature components**: Named by purpose (`AchievementDisplay`, `HabitTracker`)
4. **UI components**: Basic name for basic UI elements (`Button`, `Card`, `Input`)

## Development Best Practices

Follow these practices for sustainable development:

### Code Organization

1. **Single Responsibility**: Each component, function, and file should have a single purpose
2. **DRY (Don't Repeat Yourself)**: Extract reusable logic into utilities and hooks
3. **Modular Architecture**: Build loosely coupled modules that communicate through well-defined interfaces
4. **Progressive Enhancement**: Start with core functionality, then add features incrementally

### TypeScript Best Practices

1. **Strong Typing**: Use explicit types rather than `any`
2. **Interface-First Design**: Define interfaces before implementation
3. **Union Types**: Use discriminated unions for state with multiple forms
4. **Generic Components**: Implement generics for reusable components

### Performance Considerations

1. **Memoization**: Use `React.memo`, `useMemo`, and `useCallback` for expensive operations
2. **Virtualizing Lists**: Implement virtualization for long lists
3. **Code Splitting**: Split code by route and feature
4. **Lazy Loading**: Defer loading of non-critical components

### Styling Approach

1. **Tailwind CSS**: Use for most styling needs
2. **CSS Variables**: Use for theming and dynamic values
3. **Component-Specific Styles**: Keep styles close to components
4. **Responsive Design**: Design for mobile first, then expand to larger screens

## Testing Strategy

Implement a comprehensive testing approach:

### Unit Testing

1. **Component Tests**: Test individual components in isolation
2. **Hook Tests**: Verify custom hooks behave correctly
3. **Utility Tests**: Ensure helper functions work as expected

### Integration Testing

1. **Workflow Tests**: Test complete workflows
2. **Context Tests**: Verify context providers and consumers work together
3. **Feature Tests**: Test features that span multiple components

### E2E Testing

1. **User Journeys**: Test end-to-end user flows
2. **Cross-System Interactions**: Verify systems work together correctly
3. **Performance Testing**: Measure and optimize performance

---

By following this implementation guide, you'll create a structured, maintainable Krilin.AI application that delivers a cohesive user experience across all its systems.

For more detailed information on specific subsystems, refer to:

- [WORKFLOW_FRAMEWORK.md](./WORKFLOW_FRAMEWORK.md): Details on workflow architecture
- [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md): AI system design and integration
- [GAMIFICATION_SYSTEM.md](./GAMIFICATION_SYSTEM.md): Gamification implementation
