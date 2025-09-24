# Krilin.AI Agentic AI Framework

This document outlines the architecture for implementing an agentic AI system using Model Context Protocol (MCP) within Krilin.AI, enabling the application to interact with external tools and services.

## 📋 Table of Contents

1. [Introduction to Agentic AI](#introduction-to-agentic-ai)
2. [Model Context Protocol Integration](#model-context-protocol-integration)
3. [MCP Server Architecture](#mcp-server-architecture)
4. [Workflow Integration](#workflow-integration)
5. [Data Structures](#data-structures)
6. [Tool Registry](#tool-registry)
7. [Implementation Guide](#implementation-guide)
8. [Code Examples](#code-examples)

## Introduction to Agentic AI

An agentic AI system acts as an intelligent intermediary that can access tools, make decisions, and execute actions on behalf of the user. Within Krilin.AI, this system:

1. **Understands User Intent**: Interprets natural language requests
2. **Selects Appropriate Tools**: Determines which MCP tools can fulfill the request
3. **Executes Operations**: Makes API calls or performs actions
4. **Processes Results**: Transforms raw outputs into user-friendly insights
5. **Learns User Preferences**: Adapts to individual user patterns over time

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

## Model Context Protocol Integration

The Model Context Protocol (MCP) enables Krilin.AI to communicate with local servers that provide access to external tools and data sources.

### MCP Overview

MCP provides two primary capabilities:

1. **Tool Access**: Execute external actions (send email, schedule events, fetch data)
2. **Resource Access**: Retrieve information from external systems (calendar events, emails, documents)

### MCP Architecture in Krilin.AI

```
┌─────────────────────────────────────────────────────────────┐
│                    KRILIN.AI APPLICATION                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐                         ┌─────────────┐    │
│  │  Workflow   │                         │     UI      │    │
│  │   System    │◄────────────────────────┤ Components  │    │
│  └──────┬──────┘                         └─────────────┘    │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐      ┌─────────────┐     ┌─────────────┐   │
│  │  Agentic    │      │  MCP Client │     │   MCP Tool  │   │
│  │  AI System  │─────►│   Module    │────►│    Usage    │   │
│  └─────────────┘      └─────────────┘     └──────┬──────┘   │
│                                                   │          │
└───────────────────────────────────────────────────┼──────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      MCP SERVERS                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐      ┌─────────────┐     ┌─────────────┐   │
│  │   Calendar  │      │    Email    │     │  External   │   │
│  │    Server   │      │   Server    │     │    APIs     │   │
│  └─────────────┘      └─────────────┘     └─────────────┘   │
│                                                             │
│  ┌─────────────┐      ┌─────────────┐     ┌─────────────┐   │
│  │    Notes    │      │   Finance   │     │   Weather   │   │
│  │    Server   │      │    Server   │     │    Server   │   │
│  └─────────────┘      └─────────────┘     └─────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## MCP Server Architecture

Each MCP server implements a specific domain of functionality:

### Core MCP Servers

1. **Calendar MCP Server**

   - Tools: `create_event`, `get_events`, `update_event`, `delete_event`
   - Resources: `calendar://[user_id]/events/[event_id]`

2. **Email MCP Server**

   - Tools: `send_email`, `search_emails`, `create_draft`, `apply_label`
   - Resources: `email://[user_id]/messages/[message_id]`

3. **Notes MCP Server**

   - Tools: `create_note`, `search_notes`, `update_note`, `delete_note`
   - Resources: `notes://[user_id]/notes/[note_id]`

4. **Finance MCP Server**

   - Tools: `get_transactions`, `categorize_expense`, `create_budget`
   - Resources: `finance://[user_id]/transactions/[transaction_id]`

5. **Weather MCP Server**

   - Tools: `get_forecast`, `get_current_conditions`
   - Resources: `weather://[location]/current`

6. **Health MCP Server**
   - Tools: `log_activity`, `get_health_metrics`, `set_health_goal`
   - Resources: `health://[user_id]/metrics/[metric_type]`

### MCP Server Implementation

Each MCP server follows a standard structure:

```typescript
// Example MCP server structure
class ExampleMcpServer {
  private server: Server;
  private toolHandlers: Map<string, ToolHandler>;
  private resourceHandlers: Map<string, ResourceHandler>;

  constructor() {
    this.server = new Server({
      name: "example-server",
      version: "1.0.0",
    });

    this.toolHandlers = new Map();
    this.resourceHandlers = new Map();

    this.registerTools();
    this.registerResources();
    this.setupErrorHandling();
  }

  private registerTools() {
    // Register tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, this.handleListTools);
    this.server.setRequestHandler(CallToolRequestSchema, this.handleCallTool);

    // Define tool handlers
    this.toolHandlers.set("example_tool", async (params) => {
      // Tool implementation
      return { result: "example_result" };
    });
  }

  private registerResources() {
    // Register resource handlers
    this.server.setRequestHandler(
      ListResourcesRequestSchema,
      this.handleListResources
    );
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      this.handleReadResource
    );

    // Define resource handlers
    this.resourceHandlers.set("example_resource", async (uri) => {
      // Resource implementation
      return { content: "example_content" };
    });
  }

  private setupErrorHandling() {
    // Error handling
    this.server.onerror = (error) => console.error("MCP error:", error);
  }

  // Handler methods
  private handleListTools = async () => {
    // Return list of available tools
  };

  private handleCallTool = async (request) => {
    // Execute the requested tool
  };

  private handleListResources = async () => {
    // Return list of available resources
  };

  private handleReadResource = async (request) => {
    // Read the requested resource
  };

  public async start() {
    // Start the server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("MCP server running");
  }
}
```

## Workflow Integration

The Krilin.AI workflow system integrates with MCP through an agentic AI bridge.

### Workflow ⟷ Agentic AI Connection

```
┌─────────────────────────────────────────────────────────────┐
│                      WORKFLOW SYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐       ┌─────────────┐    ┌─────────────┐   │
│  │  Workflow   │       │   Workflow  │    │   Workflow  │   │
│  │  Selection  │──────►│  Interface  │───►│    State    │   │
│  └─────────────┘       └─────────────┘    └─────────────┘   │
│                              │                  ▲           │
│                              │                  │           │
│                              ▼                  │           │
│                        ┌─────────────┐          │           │
│                        │ Agentic AI  │          │           │
│                        │  Connector  │          │           │
│                        └─────────────┘          │           │
│                              │                  │           │
│                              ▼                  │           │
│                        ┌─────────────┐          │           │
│                        │  MCP Tool   │          │           │
│                        │   Registry  │          │           │
│                        └─────────────┘          │           │
│                              │                  │           │
│                              ▼                  │           │
│                        ┌─────────────┐          │           │
│                        │  Tool Call  │          │           │
│                        │  Execution  │──────────┘           │
│                        └─────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

Each workflow has the following integration points with the agentic AI system:

1. **Intent Mapping**: Maps user intents to specific MCP tools
2. **Context Provider**: Supplies workflow context to agentic AI operations
3. **Result Handler**: Processes and incorporates results from MCP tools
4. **Error Recovery**: Manages error states and provides fallbacks
5. **Suggestion Generator**: Creates AI-suggested next actions

## Data Structures

### Workflow Data Structure

```typescript
// Core workflow data structure
interface Workflow {
  // Workflow metadata
  id: string; // Unique identifier
  name: string; // Display name
  description: string; // Description
  icon: string; // Icon identifier
  category: WorkflowCategory; // Categorization

  // State management
  initialState: WorkflowState; // Default state
  reducer: WorkflowReducer; // State reducer function

  // UI components
  MainView: React.ComponentType<WorkflowViewProps>; // Primary interface
  ConfigView?: React.ComponentType<WorkflowConfigProps>; // Configuration

  // MCP integration
  mcpTools: McpToolConfig[]; // Required MCP tools
  mcpResources: McpResourceConfig[]; // Required MCP resources

  // AI integration
  intents: WorkflowIntent[]; // Supported user intents
  suggestedActions: WorkflowSuggestedAction[]; // AI suggestions

  // Gamification hooks
  achievements: WorkflowAchievement[]; // Associated achievements
  experiencePoints: WorkflowXpConfig; // XP award configuration
}

// Workflow state
interface WorkflowState {
  // Generic properties all workflows have
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
  lastUpdated?: string;

  // Workflow-specific data (extended by each workflow type)
  [key: string]: any;
}

// MCP Tool configuration
interface McpToolConfig {
  serverId: string; // MCP server identifier
  toolId: string; // Tool identifier
  requiredParams: string[]; // Required parameters
  optionalParams: string[]; // Optional parameters
  fallbacks?: {
    // Fallback configurations
    alternateTools: string[];
    mockImplementation?: boolean;
  };
}

// User intent mapping
interface WorkflowIntent {
  id: string; // Intent identifier
  phrases: string[]; // Example user phrases
  parameters: IntentParameter[]; // Expected parameters
  mcpToolMapping: {
    // Maps to MCP tools
    toolId: string;
    parameterMapping: Record<string, string>;
  };
  responseTemplate: string; // Template for responses
}
```

### Agentic AI Data Structure

```typescript
// Agentic AI system data structure
interface AgenticAiSystem {
  // Core components
  intentProcessor: IntentProcessor;
  toolSelector: ToolSelector;
  actionExecutor: ActionExecutor;
  resultProcessor: ResultProcessor;
  responseGenerator: ResponseGenerator;

  // System state
  state: AgenticAiState;

  // Context awareness
  contextProviders: ContextProvider[];

  // Learning and adaptation
  userPreferences: UserPreferenceStore;
  interactionHistory: InteractionHistoryStore;

  // Methods
  processUserRequest(
    request: string,
    context?: WorkflowContext
  ): Promise<AgenticResponse>;
  executeToolAction(toolId: string, params: any): Promise<ToolResult>;
  generateSuggestions(context: WorkflowContext): Promise<Suggestion[]>;
}

// Agentic AI state
interface AgenticAiState {
  status: "idle" | "processing" | "executing" | "responding" | "error";
  currentIntent?: ParsedIntent;
  selectedTools?: SelectedTool[];
  executionResults?: ExecutionResult[];
  processingErrors?: ProcessingError[];
  confidence: number;
}

// Context provider
interface ContextProvider {
  id: string;
  priority: number;
  getContext(): Promise<any>;
}

// Parsed intent
interface ParsedIntent {
  type: string;
  confidence: number;
  entities: IntentEntity[];
  originalText: string;
  normalizedText: string;
}

// Selected tool
interface SelectedTool {
  toolId: string;
  serverId: string;
  confidence: number;
  parameters: Record<string, any>;
  expectedResponseType: string;
}

// Execution result
interface ExecutionResult {
  toolId: string;
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
}
```

## Tool Registry

The Tool Registry manages all available MCP tools and their mappings to natural language intents.

### Tool Registry Structure

```typescript
// Tool registry
interface ToolRegistry {
  // Tool management
  tools: Map<string, ToolDefinition>;

  // Tool lookup methods
  getToolById(id: string): ToolDefinition | undefined;
  findToolsByCategory(category: string): ToolDefinition[];
  findToolsByIntent(intent: string): ToolDefinition[];

  // Tool registration
  registerTool(tool: ToolDefinition): void;
  unregisterTool(toolId: string): boolean;

  // Tool status
  isToolAvailable(toolId: string): boolean;
  getToolStatus(toolId: string): ToolStatus;
}

// Tool definition
interface ToolDefinition {
  id: string; // Unique identifier
  name: string; // Display name
  description: string; // Description
  category: string; // Categorization
  serverId: string; // MCP server identifier

  // Parameters
  parameters: ToolParameter[];

  // Intent mapping
  intents: string[]; // Associated intents
  keywords: string[]; // Keywords for matching

  // Execution details
  responseType: string; // Expected response type
  timeoutMs: number; // Execution timeout
  cacheable: boolean; // Can results be cached

  // Authorization
  requiresAuth: boolean; // Requires authentication
  permissionLevel: PermissionLevel; // Required permissions
}

// Tool parameter
interface ToolParameter {
  name: string; // Parameter name
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string; // Description
  required: boolean; // Is required
  default?: any; // Default value
  validation?: {
    // Validation rules
    pattern?: string;
    min?: number;
    max?: number;
    options?: any[];
  };
  mappableToEntities: string[]; // Entity types that can map to this
}

// Tool status
type ToolStatus = "available" | "unavailable" | "degraded" | "unauthorized";
```

## Implementation Guide

### Setting Up MCP Servers

1. **Create MCP Server Directory**:

   ```bash
   mkdir -p mcp-servers/{calendar,email,notes,finance,weather,health}
   ```

2. **Initialize Server Projects**:

   ```bash
   cd mcp-servers/calendar
   npm init -y
   npm install @modelcontextprotocol/sdk @googleapis/calendar
   # Repeat for other servers with appropriate dependencies
   ```

3. **Implement Server Logic**:
   Create `index.ts` in each server directory with appropriate implementations

4. **Build Servers**:

   ```bash
   npm run build
   # This will produce executable JavaScript files
   ```

5. **Configure MCP Settings**:
   Update `cline_mcp_settings.json` with server configurations

### Implementing Agentic AI System

1. **Create Agentic AI Directory**:

   ```bash
   mkdir -p src/agentic-ai/{core,intent,tools,execution,response}
   ```

2. **Implement Core System**:
   Create the main system interface in `src/agentic-ai/core/system.ts`

3. **Implement Intent Processing**:
   Create intent parsing logic in `src/agentic-ai/intent/processor.ts`

4. **Implement Tool Selection**:
   Create tool selection logic in `src/agentic-ai/tools/selector.ts`

5. **Implement Action Execution**:
   Create execution logic in `src/agentic-ai/execution/executor.ts`

6. **Implement Result Processing**:
   Create result handling in `src/agentic-ai/response/processor.ts`

### Connecting to Workflows

1. **Create Agentic AI Context**:
   Implement a React context for agentic AI in `src/contexts/agentic-ai-context.tsx`

2. **Implement Workflow Connector**:
   Create connector logic in `src/workflows/core/agentic-connector.ts`

3. **Update Workflow Types**:
   Extend workflow types in `src/workflows/core/workflow-types.ts`

4. **Create Intent Mapping Configuration**:
   Define mappings in `src/workflows/[domain]/intents.ts` for each workflow

## Code Examples

### MCP Calendar Server Example

```typescript
// mcp-servers/calendar/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { google } from "googleapis";

class CalendarMcpServer {
  private server: Server;
  private calendar: any; // Google Calendar API client

  constructor() {
    this.server = new Server({
      name: "calendar-server",
      version: "1.0.0",
    });

    // Initialize Calendar API client
    this.initializeCalendarClient();

    // Register handlers
    this.registerToolHandlers();

    // Error handling
    this.server.onerror = (error) =>
      console.error("Calendar MCP error:", error);
  }

  private initializeCalendarClient() {
    // Initialize Google Calendar API client
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    this.calendar = google.calendar({ version: "v3", auth });
  }

  private registerToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "create_event",
            description: "Create a new calendar event",
            inputSchema: {
              type: "object",
              properties: {
                summary: { type: "string", description: "Event title" },
                description: {
                  type: "string",
                  description: "Event description",
                },
                start: {
                  type: "string",
                  description: "Start time (ISO string)",
                },
                end: { type: "string", description: "End time (ISO string)" },
                attendees: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of attendee email addresses",
                },
                location: { type: "string", description: "Event location" },
              },
              required: ["summary", "start", "end"],
            },
          },
          // Add other tool definitions here
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "create_event":
          return await this.handleCreateEvent(request.params.arguments);

        // Add other tool handlers here

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  private async handleCreateEvent(args: any) {
    try {
      const { summary, description, start, end, attendees, location } = args;

      // Create event
      const event = {
        summary,
        description,
        location,
        start: { dateTime: start },
        end: { dateTime: end },
        attendees: attendees?.map((email: string) => ({ email })),
      };

      const response = await this.calendar.events.insert({
        calendarId: "primary",
        resource: event,
      });

      return {
        content: [
          {
            type: "text",
            text: `Event created successfully! Event ID: ${response.data.id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating event: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  public async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("Calendar MCP server running");
  }
}

// Start server
const server = new CalendarMcpServer();
server.start().catch(console.error);
```

### Agentic AI Core System

```typescript
// src/agentic-ai/core/system.ts
import { IntentProcessor } from "../intent/processor";
import { ToolSelector } from "../tools/selector";
import { ActionExecutor } from "../execution/executor";
import { ResultProcessor } from "../response/processor";
import { ResponseGenerator } from "../response/generator";
import { ToolRegistry } from "../tools/registry";
import { ContextManager } from "./context-manager";
import { WorkflowContext } from "../../workflows/core/workflow-types";

export class AgenticAiSystem {
  private intentProcessor: IntentProcessor;
  private toolSelector: ToolSelector;
  private actionExecutor: ActionExecutor;
  private resultProcessor: ResultProcessor;
  private responseGenerator: ResponseGenerator;
  private toolRegistry: ToolRegistry;
  private contextManager: ContextManager;

  constructor() {
    this.toolRegistry = new ToolRegistry();
    this.contextManager = new ContextManager();
    this.intentProcessor = new IntentProcessor();
    this.toolSelector = new ToolSelector(this.toolRegistry);
    this.actionExecutor = new ActionExecutor();
    this.resultProcessor = new ResultProcessor();
    this.responseGenerator = new ResponseGenerator();
  }

  public async processUserRequest(
    request: string,
    workflowContext?: WorkflowContext
  ): Promise<AgenticResponse> {
    try {
      // Set context if provided
      if (workflowContext) {
        this.contextManager.setActiveWorkflow(workflowContext);
      }

      // 1. Parse intent
      const parsedIntent = await this.intentProcessor.parseIntent(
        request,
        this.contextManager.getContext()
      );

      // 2. Select appropriate tools
      const selectedTools = await this.toolSelector.selectTools(
        parsedIntent,
        this.contextManager.getContext()
      );

      // 3. Execute actions with selected tools
      const executionResults = await this.actionExecutor.executeActions(
        selectedTools,
        parsedIntent
      );

      // 4. Process results
      const processedResults = await this.resultProcessor.processResults(
        executionResults,
        parsedIntent
      );

      // 5. Generate response
      const response = await this.responseGenerator.generateResponse(
        processedResults,
        parsedIntent,
        this.contextManager.getContext()
      );

      return response;
    } catch (error) {
      console.error("Agentic AI error:", error);

      // Generate error response
      return {
        type: "error",
        message: `I encountered an error: ${error.message}`,
        originalRequest: request,
        suggestedActions: this.getErrorRecoverySuggestions(error),
      };
    }
  }

  public async executeToolAction(
    toolId: string,
    params: any
  ): Promise<ToolResult> {
    const tool = this.toolRegistry.getToolById(toolId);

    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    return await this.actionExecutor.executeSingleAction({
      toolId,
      serverId: tool.serverId,
      parameters: params,
      confidence: 1.0,
      expectedResponseType: tool.responseType,
    });
  }

  public async generateSuggestions(
    context: WorkflowContext
  ): Promise<Suggestion[]> {
    this.contextManager.setActiveWorkflow(context);
    return await this.toolSelector.generateSuggestions(
      this.contextManager.getContext()
    );
  }

  private getErrorRecoverySuggestions(error: any): Suggestion[] {
    // Generate suggestions to recover from errors
    return [
      {
        text: "Try a different approach",
        action: "retry",
        confidence: 0.8,
      },
      {
        text: "Provide more details",
        action: "clarify",
        confidence: 0.7,
      },
    ];
  }
}

// Response types
export interface AgenticResponse {
  type: "success" | "error" | "clarification";
  message: string;
  originalRequest: string;
  results?: any;
  suggestedActions?: Suggestion[];
}

export interface Suggestion {
  text: string;
  action: string;
  confidence: number;
  parameters?: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}
```

### Workflow with Agentic AI Integration

```typescript
// src/workflows/calendar/calendar-workflow.tsx
import React, { useEffect, useState } from 'react';
import { useAgenticAi } from '../../contexts/agentic-ai-context';
import { useWorkflow } from '../../contexts/workflow-context';
import { useGamification } from '../../contexts/gamification-context';
import { CalendarView } from './calendar-view';
import { EventForm } from './event-form';
import intents from './intents';

// Calendar workflow component
export function CalendarWorkflow() {
  // State and context hooks
  const { state, dispatch } = useWorkflow('calendar');
  const { processUserRequest, generateSuggestions } = useAgenticAi();
  const { awardXp } = useGamification();
  const [suggestions, setSuggestions] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);

  // Load suggestions based on current context
  useEffect(() => {
    const loadSuggestions = async () => {
      const workflowContext = {
        id: 'calendar',
        state,
        intents
      };

      const newSuggestions = await generateSuggestions(workflowContext);
      setSuggestions(newSuggestions);
    };

    loadSuggestions();
  }, [state, generateSuggestions]);

  // Handle user request (natural language input)
  const handleUserRequest = async (request) => {
    setProcessing(true);

    try {
      const workflowContext = {
        id: 'calendar',
        state,
        intents
      };

      const response = await processUserRequest(request, workflowContext);

      if (response.type ===
```
