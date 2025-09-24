"use client"

import { useState } from "react"
import KrilinButton from "./krilin-button"
import KrilinHeader from "./krilin-header"
import {
  TasksWorkflow,
  CalendarWorkflow,
  EmailWorkflow,
  NotesWorkflow,
  FinanceWorkflow,
  HealthWorkflow,
  NewsWorkflow,
  ShoppingWorkflow,
  LearningWorkflow,
  EntertainmentWorkflow
} from "../workflows"

export default function KrilinWorkflows() {
  const [activeWorkflow, setActiveWorkflow] = useState("tasks")

  return (
    <div className="min-h-screen bg-[#fffffc]">
      <KrilinHeader />
      
      <main className="container mx-auto p-4">
        <h1 className="font-pixel text-2xl text-[#33272a] mb-6 text-center">DAILY WORKFLOWS</h1>
        
        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <KrilinButton 
            variant={activeWorkflow === "tasks" ? "primary" : "secondary"}
            onClick={() => setActiveWorkflow("tasks")}
          >
            TASKS
          </KrilinButton>
          
          <KrilinButton 
            variant={activeWorkflow === "calendar" ? "primary" : "secondary"}
            onClick={() => setActiveWorkflow("calendar")}
          >
            CALENDAR
          </KrilinButton>
          
          <KrilinButton 
            variant={activeWorkflow === "email" ? "primary" : "secondary"}
            onClick={() => setActiveWorkflow("email")}
          >
            EMAIL
          </KrilinButton>
          
          <KrilinButton 
            variant={activeWorkflow === "notes" ? "primary" : "secondary"}
            onClick={() => setActiveWorkflow("notes")}
          >
            NOTES
          </KrilinButton>
          
          <KrilinButton 
            variant={activeWorkflow === "finance" ? "primary" : "secondary"}
            onClick={() => setActiveWorkflow("finance")}
          >
            FINANCE
          </KrilinButton>
          
          <KrilinButton 
            variant={activeWorkflow === "health" ? "primary" : "secondary"}
            onClick={() => setActiveWorkflow("health")}
          >
            HEALTH
          </KrilinButton>
          
          <KrilinButton 
            variant={activeWorkflow === "news" ? "primary" : "secondary"}
            onClick={() => setActiveWorkflow("news")}
          >
            NEWS
          </KrilinButton>
          
          <KrilinButton 
            variant={activeWorkflow === "shopping" ? "primary" : "secondary"}
            onClick={() => setActiveWorkflow("shopping")}
          >
            SHOPPING
          </KrilinButton>
          
          <KrilinButton 
            variant={activeWorkflow === "learning" ? "primary" : "secondary"}
            onClick={() => setActiveWorkflow("learning")}
          >
            LEARNING
          </KrilinButton>
          
          <KrilinButton 
            variant={activeWorkflow === "entertainment" ? "primary" : "secondary"}
            onClick={() => setActiveWorkflow("entertainment")}
          >
            ENTERTAINMENT
          </KrilinButton>
        </div>
        
        {/* Workflow Content */}
        <div className="mb-8">
          {activeWorkflow === "tasks" && <TasksWorkflow />}
          {activeWorkflow === "calendar" && <CalendarWorkflow />}
          {activeWorkflow === "email" && <EmailWorkflow />}
          {activeWorkflow === "notes" && <NotesWorkflow />}
          {activeWorkflow === "finance" && <FinanceWorkflow />}
          {activeWorkflow === "health" && <HealthWorkflow />}
          {activeWorkflow === "news" && <NewsWorkflow />}
          {activeWorkflow === "shopping" && <ShoppingWorkflow />}
          {activeWorkflow === "learning" && <LearningWorkflow />}
          {activeWorkflow === "entertainment" && <EntertainmentWorkflow />}
        </div>
      </main>
    </div>
  )
}
