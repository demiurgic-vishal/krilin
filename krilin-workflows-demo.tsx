"use client"

import { useState } from "react"
import KrilinButton from "./components/krilin-button"
import KrilinCard from "./components/krilin-card"
import KrilinHeader from "./components/krilin-header"
import KrilinPowerMeter from "./components/krilin-power-meter"

export default function KrilinWorkflowsDemo() {
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

// Task Management Workflow
function TasksWorkflow() {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Complete Krilin project proposal", status: "in-progress", priority: 85 },
    { id: 2, text: "Review code for team members", status: "pending", priority: 65 },
    { id: 3, text: "Attend daily standup meeting", status: "completed", priority: 70 },
    { id: 4, text: "Research new component libraries", status: "pending", priority: 40 },
  ])
  const [newTask, setNewTask] = useState("")

  const addTask = () => {
    if (!newTask.trim()) return
    setTasks([...tasks, { 
      id: Date.now(), 
      text: newTask, 
      status: "pending",
      priority: 50
    }])
    setNewTask("")
  }

  const toggleStatus = (id: number) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const newStatus = task.status === "completed" ? "pending" : "completed"
        return { ...task, status: newStatus }
      }
      return task
    }))
  }

  return (
    <div>
      <KrilinCard title="TASK MANAGEMENT" className="mb-6">
        <div className="mb-4 flex">
          <input 
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add new task..."
            className="flex-1 p-2 mr-2 font-pixel text-sm border-2 border-[#33272a] bg-[#fffffc]"
          />
          <KrilinButton onClick={addTask}>ADD</KrilinButton>
        </div>

        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task.id} className={`border-2 border-[#33272a] p-3 ${task.status === "completed" ? "bg-[#e9ecef]" : "bg-[#fffffc]"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={task.status === "completed"}
                    onChange={() => toggleStatus(task.id)}
                    className="w-4 h-4 accent-[#ff6b35]"
                  />
                  <span className={`font-pixel text-sm ${task.status === "completed" ? "line-through text-gray-500" : "text-[#33272a]"}`}>
                    {task.text}
                  </span>
                </div>
                <div className="w-24">
                  <KrilinPowerMeter 
                    value={task.priority} 
                    label="PRIORITY" 
                  />
                </div>
              </div>
              
              <div className="mt-2 flex justify-between">
                <span className="font-pixel text-xs text-[#594a4e]">
                  {task.status === "in-progress" ? "IN PROGRESS" : task.status.toUpperCase()}
                </span>
                <div className="flex gap-1">
                  <KrilinButton variant="secondary" className="px-2 py-1 text-xs">
                    EDIT
                  </KrilinButton>
                  <KrilinButton variant="secondary" className="px-2 py-1 text-xs">
                    DELETE
                  </KrilinButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </KrilinCard>
      
      <KrilinCard title="PRODUCTIVITY STATS">
        <div className="space-y-3">
          <KrilinPowerMeter value={75} label="DAILY PROGRESS" />
          <KrilinPowerMeter value={60} label="WEEKLY GOALS" />
          <KrilinPowerMeter value={82} label="FOCUS SCORE" />
        </div>
      </KrilinCard>
    </div>
  )
}

// Calendar & Scheduling Workflow
function CalendarWorkflow() {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
  const currentDay = new Date().getDay()
  
  const events = [
    { id: 1, title: "Team Meeting", time: "10:00 AM", duration: 60, type: "work" },
    { id: 2, title: "Lunch with Alex", time: "12:30 PM", duration: 90, type: "personal" },
    { id: 3, title: "Client Call", time: "3:00 PM", duration: 45, type: "work" },
    { id: 4, title: "Gym Session", time: "6:00 PM", duration: 60, type: "health" },
  ]

  return (
    <div>
      <KrilinCard title="CALENDAR" className="mb-6">
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <KrilinButton variant="secondary" className="px-3 py-1">&lt;</KrilinButton>
            <h3 className="font-pixel text-[#33272a]">APRIL 2025</h3>
            <KrilinButton variant="secondary" className="px-3 py-1">&gt;</KrilinButton>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map((day, i) => (
              <div key={day} className="text-center font-pixel text-xs text-[#594a4e]">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 30 }, (_, i) => (
              <div 
                key={i} 
                className={`aspect-square flex items-center justify-center border border-[#33272a] text-sm font-pixel
                  ${i === currentDay - 1 ? "bg-[#ff6b35] text-white" : "bg-[#fffffc]"}
                  ${[9, 15, 21, 22].includes(i) ? "border-2 border-[#ffc15e]" : ""}
                `}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        
        <KrilinButton className="w-full">ADD EVENT</KrilinButton>
      </KrilinCard>
      
      <KrilinCard title="TODAY'S SCHEDULE">
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className={`border-2 border-[#33272a] p-2 bg-[#fffffc]`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-pixel text-sm text-[#33272a]">{event.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-pixel text-xs text-[#594a4e]">{event.time}</span>
                    <span className="font-pixel text-xs text-[#594a4e]">({event.duration} min)</span>
                  </div>
                </div>
                <div 
                  className={`px-2 py-1 text-xs font-pixel text-white 
                    ${event.type === "work" ? "bg-[#ff6b35]" : 
                      event.type === "personal" ? "bg-[#ffc15e] text-[#33272a]" : 
                      "bg-[#4ecdc4]"}`}
                >
                  {event.type.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </KrilinCard>
    </div>
  )
}

// Email & Communication Workflow
function EmailWorkflow() {
  const emails = [
    { id: 1, from: "team@krilin.ai", subject: "Welcome to Krilin", preview: "Thank you for joining our platform. We're excited to...", unread: true, time: "10:23 AM" },
    { id: 2, from: "alex@example.com", subject: "Project Update", preview: "I've completed the initial design for the dashboard...", unread: false, time: "Yesterday" },
    { id: 3, from: "support@service.com", subject: "Your subscription", preview: "Your premium subscription has been successfully renewed...", unread: true, time: "Yesterday" },
    { id: 4, from: "newsletter@tech.com", subject: "Weekly Tech Digest", preview: "This week in tech: New framework releases, upcoming...", unread: false, time: "Apr 2" },
  ]

  return (
    <div>
      <KrilinCard title="INBOX" className="mb-6">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            <KrilinButton variant="secondary" className="px-2 py-1 text-xs">REFRESH</KrilinButton>
            <KrilinButton variant="secondary" className="px-2 py-1 text-xs">COMPOSE</KrilinButton>
          </div>
          <input 
            type="text"
            placeholder="Search emails..."
            className="w-1/3 p-1 font-pixel text-xs border-2 border-[#33272a] bg-[#fffffc]"
          />
        </div>

        <div className="space-y-2">
          {emails.map(email => (
            <div key={email.id} className={`border-l-4 border-[#33272a] p-2 ${email.unread ? "bg-[#fff8e8] border-l-[#ff6b35]" : "bg-[#fffffc]"}`}>
              <div className="flex justify-between">
                <span className={`font-pixel text-sm ${email.unread ? "font-semibold" : ""}`}>
                  {email.from}
                </span>
                <span className="font-pixel text-xs text-[#594a4e]">{email.time}</span>
              </div>
              <h4 className={`font-pixel text-sm ${email.unread ? "text-[#33272a] font-semibold" : "text-[#594a4e]"}`}>
                {email.subject}
              </h4>
              <p className="font-pixel text-xs text-[#594a4e] mt-1 truncate">
                {email.preview}
              </p>
            </div>
          ))}
        </div>
      </KrilinCard>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KrilinCard title="QUICK CONTACTS">
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 border-2 border-[#33272a] bg-[#fffffc]">
              <div className="w-8 h-8 bg-[#ff6b35] rounded-full flex items-center justify-center text-white font-pixel">KB</div>
              <div>
                <div className="font-pixel text-sm">Krillin Bot</div>
                <div className="font-pixel text-xs text-[#594a4e]">bot@krilin.ai</div>
              </div>
              <div className="ml-auto flex gap-1">
                <button className="p-1 bg-[#ffc15e] border border-[#33272a] text-[#33272a]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </button>
                <button className="p-1 bg-[#ffc15e] border border-[#33272a] text-[#33272a]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 border-2 border-[#33272a] bg-[#fffffc]">
              <div className="w-8 h-8 bg-[#4ecdc4] rounded-full flex items-center justify-center text-white font-pixel">AT</div>
              <div>
                <div className="font-pixel text-sm">Alex Toriyama</div>
                <div className="font-pixel text-xs text-[#594a4e]">alex@example.com</div>
              </div>
              <div className="ml-auto flex gap-1">
                <button className="p-1 bg-[#ffc15e] border border-[#33272a] text-[#33272a]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </button>
                <button className="p-1 bg-[#ffc15e] border border-[#33272a] text-[#33272a]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </KrilinCard>
        
        <KrilinCard title="COMMUNICATION STATS">
          <div className="space-y-3">
            <KrilinPowerMeter value={42} label="EMAILS TO RESPOND" />
            <KrilinPowerMeter value={88} label="RESPONSE RATE" />
            <KrilinPowerMeter value={65} label="AVG RESPONSE TIME" />
          </div>
        </KrilinCard>
      </div>
    </div>
  )
}

// Note Taking Workflow
function NotesWorkflow() {
  const notes = [
    { id: 1, title: "Project Ideas", content: "1. Krilin design system for mobile apps\n2. Workflow automation tool\n3. Pixel art generator", tags: ["ideas", "projects"], color: "#ffc15e" },
    { id: 2, title: "Meeting Notes", content: "Team sync on April 4th:\n- Reviewed sprint progress\n- Assigned new tasks\n- Discussed upcoming deadlines", tags: ["work", "meetings"], color: "#4ecdc4" },
    { id: 3, title: "Learning Resources", content: "UI Design Resources:\n- Design System Handbook\n- Atomic Design Principles\n- Color Theory Basics", tags: ["learning", "design"], color: "#ff6b35" },
  ]

  return (
    <div>
      <div className="flex justify-between mb-4">
        <KrilinButton>NEW NOTE</KrilinButton>
        <div className="flex gap-2">
          <KrilinButton variant="secondary" className="px-2 py-1">SORT</KrilinButton>
          <KrilinButton variant="secondary" className="px-2 py-1">FILTER</KrilinButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {notes.map(note => (
          <div key={note.id} className="relative">
            <div className="absolute inset-0 bg-[#33272a] translate-x-1 translate-y-1"></div>
            <KrilinCard title={note.title} className="relative z-10">
              <div 
                className={`absolute top-0 right-0 w-3 h-3`}
                style={{ backgroundColor: note.color }}
              ></div>
              <div className="min-h-[150px] mb-3 font-pixel text-sm text-[#33272a] whitespace-pre-line">
                {note.content}
              </div>
              <div className="flex flex-wrap gap-1">
                {note.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-2 py-1 bg-[#594a4e] text-white text-xs font-pixel"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </KrilinCard>
          </div>
        ))}
        
        <div className="relative">
          <div className="absolute inset-0 bg-[#33272a] translate-x-1 translate-y-1"></div>
          <div className="relative z-10 bg-[#fffaeb] border-4 border-[#33272a] border-dashed h-full min-h-[220px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl text-[#594a4e] mb-2">+</div>
              <div className="font-pixel text-sm text-[#594a4e]">ADD NOTE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Finance Management Workflow
function FinanceWorkflow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <KrilinCard title="MONTHLY BUDGET" className="mb-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">HOUSING</span>
                <span className="font-pixel text-sm text-[#33272a]">$1,500 / $1,500</span>
              </div>
              <KrilinPowerMeter value={100} />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">FOOD</span>
                <span className="font-pixel text-sm text-[#33272a]">$425 / $500</span>
              </div>
              <KrilinPowerMeter value={85} />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">TRANSPORTATION</span>
                <span className="font-pixel text-sm text-[#33272a]">$180 / $250</span>
              </div>
              <KrilinPowerMeter value={72} />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">ENTERTAINMENT</span>
                <span className="font-pixel text-sm text-[#33272a]">$120 / $150</span>
              </div>
              <KrilinPowerMeter value={80} />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">SAVINGS</span>
                <span className="font-pixel text-sm text-[#33272a]">$350 / $500</span>
              </div>
              <KrilinPowerMeter value={70} />
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <KrilinButton variant="secondary" className="px-2 py-1">ADD CATEGORY</KrilinButton>
            <KrilinButton className="px-2 py-1">ADD EXPENSE</KrilinButton>
          </div>
        </KrilinCard>
        
        <KrilinCard title="FINANCIAL GOALS">
          <div className="space-y-4">
            <div className="border-2 border-[#33272a] p-2 bg-[#fffffc]">
              <h4 className="font-pixel text-sm text-[#33272a]">EMERGENCY FUND</h4>
              <div className="flex justify-between mt-1 mb-1">
                <span className="font-pixel text-xs text-[#594a4e]">$5,200 / $10,000</span>
                <span className="font-pixel text-xs text-[#594a4e]">52%</span>
              </div>
              <KrilinPowerMeter value={52} label="" />
            </div>
            
            <div className="border-2 border-[#33272a] p-2 bg-[#fffffc]">
              <h4 className="font-pixel text-sm text-[#33272a]">VACATION FUND</h4>
              <div className="flex justify-between mt-1 mb-1">
                <span className="font-pixel text-xs text-[#594a4e]">$1,800 / $3,000</span>
                <span className="font-pixel text-xs text-[#594a4e]">60%</span>
              </div>
              <KrilinPowerMeter value={60} label="" />
            </div>
          </div>
        </KrilinCard>
      </div>
      
      <div>
        <KrilinCard title="RECENT TRANSACTIONS" className="mb-6">
          <div className="space-y-2">
            <div className="flex justify-between p-2 border-l-4 border-[#ff6b35] bg-[#fffffc]">
              <div>
                <div className="font-pixel text-sm text-[#33272a]">Grocery Store</div>
                <div className="font-pixel text-xs text-[#594a4e]">Apr 3, 2025</div>
              </div>
              <div className="font-pixel text-sm text-[#33272a]">-$85.43</div>
            </div>
            
            <div className="flex justify-between p-2 border-l-4 border-[#4ecdc4] bg-[#fffffc]">
              <div>
                <div className="font-pixel text-sm text-[#33272a]">Salary Deposit</div>
                <div className="font-pixel text-xs text-[#594a4e]">Apr 1, 2025</div>
              </div>
              <div className="font-pixel text-sm text-[#33272a] text-[#4ecdc4]">+$2,500.00</div>
            </div>
            
            <div className="flex justify-between p-2 border-l-4 border-[#ff6b35] bg-[#fffffc]">
              <div>
                <div className="font-pixel text-sm text-[#33272a]">Coffee Shop</div>
                <div className="font-pixel text-xs text-[#594a4e]">Apr 2, 2025</div>
              </div>
              <div className="font-pixel text-sm text-[#33272a]">-$4.75</div>
            </div>
            
            <div className="flex justify-between p-2 border-l-4 border-[#ff6b35] bg-[#fffffc]">
              <div>
                <div className="font-pixel text-sm text-[#33272a]">Online Subscription</div>
                <div className="font-pixel text-xs text-[#594a4e]">Apr 2, 2025</div>
              </div>
