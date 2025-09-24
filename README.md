# Krilin.AI - Your Personal Powering-Up Assistant

![Krilin.AI Logo](public/placeholder-logo.svg)

## 🥋 Introduction

Krilin.AI is a comprehensive personal assistant inspired by Dragon Ball's Krilin character - a loyal friend, dedicated martial artist, and determined fighter who constantly strives to improve despite limitations. This application combines productivity tools, wellness tracking, AI-powered insights, and gamification elements to help you automate tasks, improve your health, provide emotional support, and motivate you with Krilin's enthusiastic personality.

## 🔥 Core Philosophy

Like Krilin who consistently trains to increase his power level, this application helps you:

1. **Power Up Your Productivity**: Automate repetitive tasks and optimize your workflows
2. **Build Resilience**: Track health habits and emotional wellbeing
3. **Train Consistently**: Use gamification to build and maintain positive habits
4. **Get Wise Guidance**: Receive AI-powered insights and advice
5. **Celebrate Victories**: Acknowledge achievements big and small

## 🐉 Application Architecture

The application is organized into four primary interconnected systems:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ PRODUCTIVITY│    │  WELLNESS   │    │ INTELLIGENCE│     │
│  │             │    │             │    │             │     │
│  │ - Workflows │    │ - Health    │    │ - AI Advisor│     │
│  │ - Tasks     │    │ - Mood      │    │ - Insights  │     │
│  │ - Pomodoro  │    │ - Sleep     │    │ - Data      │     │
│  │ - Goals     │    │ - Mindful   │    │   Dashboard │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         ▲                  ▲                  ▲            │
│         │                  │                  │            │
│         └──────────────────┼──────────────────┘            │
│                            │                               │
│                            ▼                               │
│              ┌─────────────────────────────┐               │
│              │      GAMIFICATION LAYER     │               │
│              │                             │               │
│              │  Achievements, Power Levels │               │
│              │  Quotes, Habit Streaks      │               │
│              └─────────────────────────────┘               │
│                            ▲                               │
│                            │                               │
│                            ▼                               │
│              ┌─────────────────────────────┐               │
│              │       AGENTIC AI LAYER      │               │
│              │                             │               │
│              │    MCP Tools & Resources    │               │
│              │    External Integrations    │               │
│              └─────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🏆 How to Use Krilin.AI

### Getting Started

1. **Onboarding**: When first launching Krilin.AI, you'll be guided through a personality assessment to customize your experience
2. **Dashboard**: Your central hub showing your current "power level" (productivity score), active goals, and quick access to workflows
3. **Chat**: Interact directly with Krilin.AI through natural language to execute tasks or get advice

### Workflow System

Workflows are the heart of Krilin.AI, providing structured interfaces for common tasks. They leverage an agentic AI system with Model Context Protocol (MCP) to connect to external tools and services:

```
┌───────────────────────┐
│   WORKFLOW SYSTEM     │
├───────────────────────┴──────────────────────────────────────┐
│                                                              │
│  1. Select a workflow (Tasks, Calendar, Email, etc.)         │
│  2. View contextual data and controls for that domain        │
│  3. Execute actions via natural language or direct controls  │
│  4. Agentic AI translates user intent into tool operations   │
│  5. Earn experience points for completed activities          │
│  6. Receive contextual wisdom and insights from Krilin       │
│                                                              │
│  * Workflows utilize MCP servers to access external services │
│  * Workflows can be customized or combined into "sequences"  │
│  * AI advisor analyzes patterns across workflows             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Available Workflows

| Workflow          | Purpose               | Key Features                        |
| ----------------- | --------------------- | ----------------------------------- |
| **Tasks**         | Daily task management | Priority system, progress tracking  |
| **Calendar**      | Schedule management   | Event planning, time blocking       |
| **Email**         | Email organization    | Templates, scheduled sending        |
| **Notes**         | Knowledge capture     | Categorization, search              |
| **Finance**       | Financial tracking    | Budget monitoring, insights         |
| **Health**        | Health monitoring     | Exercise logging, metrics tracking  |
| **News**          | Information curation  | Personalized feeds, summaries       |
| **Shopping**      | Purchase management   | Lists, price tracking               |
| **Learning**      | Education tracking    | Study planning, resource management |
| **Entertainment** | Media consumption     | Recommendations, watch/play lists   |

### Creating Custom Workflows

Users can create custom workflows by:

1. Selecting "Create Workflow" from the workflows page
2. Choosing which data sources to include
3. Defining actions and triggers
4. Setting goals and metrics
5. Designing the interface layout
6. Adding gamification elements

### Workflow Sequences

Advanced users can create "sequences" - chains of workflow actions that execute automatically:

```
┌───────────┐    ┌────────────┐    ┌───────────┐
│  Morning  │    │  Get news  │    │Add events │
│  routine  │ -> │  headlines │ -> │to today's │
│  started  │    │  from API  │    │  tasks    │
└───────────┘    └────────────┘    └───────────┘
```

## 🤖 Agentic AI System

Krilin.AI implements an agentic AI system using the Model Context Protocol (MCP) to connect with external tools and services:

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENTIC AI SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐      ┌─────────────┐     ┌─────────────┐  │
│  │   Intent    │      │    Tool     │     │   Action    │  │
│  │   Parsing   │─────►│  Selection  │────►│  Execution  │  │
│  └─────────────┘      └─────────────┘     └─────────────┘  │
│         ▲                                        │         │
│         │                                        ▼         │
│  ┌─────────────┐                         ┌─────────────┐   │
│  │    User     │                         │   Result    │   │
│  │   Request   │                         │  Processing │   │
│  └─────────────┘                         └─────────────┘   │
│         ▲                                        │         │
│         │                                        ▼         │
│  ┌─────────────┐                         ┌─────────────┐   │
│  │  Workflow   │◄────────────────────────│  Response   │   │
│  │   Context   │                         │ Generation  │   │
│  └─────────────┘                         └─────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### MCP Tool Integration

Krilin.AI connects to specialized MCP servers that provide access to external services:

| MCP Server   | Purpose             | Tools                                                |
| ------------ | ------------------- | ---------------------------------------------------- |
| **Calendar** | Schedule management | Create events, get schedules, update meetings        |
| **Email**    | Email communication | Send messages, search inbox, manage labels           |
| **Notes**    | Note management     | Create notes, retrieve information, organize content |
| **Finance**  | Financial tracking  | Track expenses, categorize transactions, budget      |
| **Weather**  | Weather information | Get forecasts, check current conditions              |
| **Health**   | Health monitoring   | Log activities, track metrics, set goals             |

## 🧠 AI Advisor System

The AI Advisor acts as your personal Krilin, analyzing data across workflows to provide personalized insights:

```
┌─────────────────────────────────────────────────────────┐
│                    AI ADVISOR SYSTEM                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ROLE                     EXAMPLES                      │
│                                                         │
│  ┌─────────────┐          - "I notice you're more       │
│  │Life Coach   │            productive on Tuesdays"     │
│  └─────────────┘          - "Your evening meetings      │
│                             have low task completion"   │
│  ┌─────────────┐                                        │
│  │Health Guide │          - "Your sleep quality drops   │
│  └─────────────┘            when you exercise late"     │
│                           - "Your stress increases      │
│  ┌─────────────┐            after long meetings"        │
│  │Cheerleader  │                                        │
│  └─────────────┘          - "Great job maintaining      │
│                             your meditation streak!"    │
│  ┌─────────────┐          - "You're 30% more productive │
│  │Therapist    │            than last month!"           │
│  └─────────────┘                                        │
│                           - "I noticed you've been      │
│                             working late. How are you   │
│                             feeling about your workload?"|
└─────────────────────────────────────────────────────────┘
```

## 💪 Gamification System

Like Krilin's journey to become stronger, the app uses game mechanics to motivate personal growth:

```
┌────────────────────────────────────────────────────────┐
│                 GAMIFICATION SYSTEM                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ELEMENT               PURPOSE                         │
│                                                        │
│  ┌─────────────┐      Track overall progress and       │
│  │Power Level  │      visualize growth over time       │
│  └─────────────┘                                       │
│                                                        │
│  ┌─────────────┐      Reward specific accomplishments  │
│  │Achievements │      and milestone completions        │
│  └─────────────┘                                       │
│                                                        │
│  ┌─────────────┐      Build consistency through        │
│  │Habit Streaks│      daily practice visualization     │
│  └─────────────┘                                       │
│                                                        │
│  ┌─────────────┐      Maintain focus using time-based  │
│  │Pomodoro     │      work/break intervals             │
│  └─────────────┘                                       │
│                                                        │
│  ┌─────────────┐      Share wisdom and motivation in   │
│  │Krilin Quotes│      Krilin's distinctive voice       │
│  └─────────────┘                                       │
└────────────────────────────────────────────────────────┘
```

## 📊 Data Integration

Krilin.AI can connect to various data sources to enhance its capabilities:

| Integration | Purpose                | Source                  |
| ----------- | ---------------------- | ----------------------- |
| Calendar    | Schedule analysis      | Google/Apple Calendar   |
| Email       | Communication insights | Gmail/Outlook           |
| Health      | Wellness tracking      | Apple Health/Google Fit |
| Weather     | Environmental context  | Weather APIs            |
| Smart Home  | Environment control    | Home automation systems |
| Finance     | Money management       | Banking/budgeting apps  |

## 🛠️ Technical Implementation

### Core System Architecture

```
┌─────────────────┐     ┌────────────────┐    ┌────────────────┐
│ React Frontend  │◄───►│ State Contexts │◄──►│ MCP Servers &  │
│ (Next.js)       │     │ (React Context)│    │ Data Services  │
└─────────────────┘     └────────────────┘    └────────────────┘
        │                       ▲                     ▲
        │                       │                     │
        ▼                       │                     │
┌─────────────────┐             │                     │
│ UI Components   │─────────────┘                     │
│ & Workflows     │                                   │
└─────────────────┘                                   │
        │                                             │
        ▼                                             │
┌─────────────────┐    ┌────────────────┐             │
│ Gamification    │◄──►│  Agentic AI    │◄────────────┘
│ System          │    │  System        │
└─────────────────┘    └────────────────┘
```

### State Management

- User data and preferences stored in `UserContext`
- Workflow-specific data managed in dedicated contexts
- Gamification elements tracked in `GamificationContext`
- AI insights managed in `AdvisorContext`
- Agentic functions managed in `AgenticAiContext`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/krilin-ai.git
cd krilin-ai

# Install dependencies
npm install
# or
pnpm install

# Start the development server
npm run dev
# or
pnpm dev
```

Visit `http://localhost:3000` to see the application.

## 🗺️ Development Roadmap & Documentation

For detailed development and architectural documentation, refer to:

- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md): Development plans and timelines
- [WORKFLOW_FRAMEWORK.md](./WORKFLOW_FRAMEWORK.md): Workflow architecture details
- [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md): AI system design
- [GAMIFICATION_SYSTEM.md](./GAMIFICATION_SYSTEM.md): Gamification implementation
- [AGENTIC_AI_FRAMEWORK.md](./AGENTIC_AI_FRAMEWORK.md): MCP tool integration
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md): Overall system implementation

## 📝 Example User Journeys

### Morning Routine Enhancement

1. User opens Krilin.AI at the start of their day
2. System shows a morning greeting with Krilin's enthusiasm: "Rise and shine! Ready to power up your day!"
3. The dashboard displays:
   - Today's top priorities from Tasks workflow
   - Calendar events for the day
   - A "morning sequence" button to trigger automated actions
4. User activates the morning sequence which:
   - Retrieves weather and news summaries
   - Adds appropriate tasks based on weather (indoor/outdoor activities)
   - Shows health recommendations
   - Activates the Pomodoro timer for the first work session

### Work Productivity Optimization

1. User switches to Tasks workflow during work hours
2. System shows prioritized work items with contextual AI insights
3. As tasks are completed:
   - Power meter increases
   - Encouraging messages appear ("You're on fire today!")
   - Streaks are updated
4. After extended focus periods, system suggests breaks with mindfulness exercises

### Evening Wind-Down

1. As evening approaches, system transitions to wellness recommendations
2. Sleep preparation sequence is suggested:
   - Review of day's accomplishments
   - Gratitude journal prompt
   - Sleep environment recommendations (connected to smart home if available)
   - Mindfulness exercise

## 🔮 Future Enhancements

- **Voice Interface**: Interact with Krilin.AI using voice commands
- **AR Integration**: Visualize Krilin as an AR companion
- **Team Collaboration**: Share workflows and goals with teammates
- **Advanced AI Coaching**: More personalized development plans
- **Expanded MCP Tool Ecosystem**: Add more specialized service integrations
- **Workflow Marketplace**: Community-created workflows and tool configurations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
