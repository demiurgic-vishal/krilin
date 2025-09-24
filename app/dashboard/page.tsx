"use client"
import KrilinHeader from "@/components/krilin-header"
import KrilinCard from "@/components/krilin-card"
import KrilinButton from "@/components/krilin-button"
import KrilinPowerMeter from "@/components/krilin-power-meter"
import { Calendar, MessageSquare, FileText, Clock, ArrowLeft } from "lucide-react"

export default function DashboardPage() {
  // Sample tasks
  const tasks = [
    {
      title: "Quarterly Report",
      dueDate: "Tomorrow, 5:00 PM",
      priority: "high",
      completion: 65,
    },
    {
      title: "Team Meeting",
      dueDate: "Today, 2:00 PM",
      priority: "medium",
      completion: 100,
    },
    {
      title: "Project Proposal",
      dueDate: "Friday, 12:00 PM",
      priority: "high",
      completion: 30,
    },
    {
      title: "Client Call",
      dueDate: "Wednesday, 10:00 AM",
      priority: "medium",
      completion: 0,
    },
  ]

  // Sample conversations
  const conversations = [
    {
      title: "Schedule Planning",
      preview: "Here's your optimized schedule for the week...",
      time: "2 hours ago",
    },
    {
      title: "Project Research",
      preview: "I've gathered information on the topic you asked about...",
      time: "Yesterday",
    },
    {
      title: "Email Draft",
      preview: "Here's the email draft to the marketing team...",
      time: "2 days ago",
    },
  ]

  return (
    <div className="min-h-screen bg-[#fffaeb] font-pixel">
      <KrilinHeader />

      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-4">
          <KrilinButton variant="secondary" onClick={() => (window.location.href = "/")} className="gap-2">
            <ArrowLeft size={16} />
            BACK
          </KrilinButton>
        </div>

        <div className="pixel-border bg-[#594a4e] p-1 mb-6">
          <div className="bg-[#33272a] text-white p-2 text-center">
            <h1 className="text-xl">COMMAND CENTER</h1>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <KrilinCard title="POWER STATS">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">PRODUCTIVITY LEVEL</span>
                    <span className="text-sm">8,423</span>
                  </div>
                  <KrilinPowerMeter value={84} label="POWER" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">TASKS COMPLETED</span>
                    <span className="text-sm">27/42</span>
                  </div>
                  <KrilinPowerMeter value={64} label="COMPLETION" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">TIME EFFICIENCY</span>
                    <span className="text-sm">12.5 HRS SAVED</span>
                  </div>
                  <KrilinPowerMeter value={78} label="EFFICIENCY" />
                </div>
              </div>
            </KrilinCard>
          </div>

          <div>
            <KrilinCard title="QUICK ACTIONS">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <KrilinButton variant="secondary" className="h-auto py-3 flex flex-col items-center gap-2">
                  <Calendar size={20} />
                  <span>SCHEDULE</span>
                </KrilinButton>
                <KrilinButton variant="secondary" className="h-auto py-3 flex flex-col items-center gap-2">
                  <MessageSquare size={20} />
                  <span>NEW CHAT</span>
                </KrilinButton>
                <KrilinButton variant="secondary" className="h-auto py-3 flex flex-col items-center gap-2">
                  <FileText size={20} />
                  <span>DOCUMENTS</span>
                </KrilinButton>
                <KrilinButton variant="secondary" className="h-auto py-3 flex flex-col items-center gap-2">
                  <Clock size={20} />
                  <span>REMINDERS</span>
                </KrilinButton>
              </div>
            </KrilinCard>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <KrilinCard title="ACTIVE MISSIONS">
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div key={index} className="border-2 border-[#33272a] p-3">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-bold">{task.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs ${
                        task.priority === "high" ? "bg-[#ff6b35] text-white" : "bg-[#ffc15e] text-[#33272a]"
                      }`}
                    >
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs mb-2">Due: {task.dueDate}</p>
                  <KrilinPowerMeter value={task.completion} label="PROGRESS" />
                </div>
              ))}
            </div>
          </KrilinCard>

          <KrilinCard title="RECENT COMMUNICATIONS">
            <div className="space-y-4">
              {conversations.map((convo, index) => (
                <div key={index} className="border-2 border-[#33272a] p-3 hover:bg-[#ffc15e]/10 cursor-pointer">
                  <div className="flex justify-between mb-1">
                    <h3 className="font-bold">{convo.title}</h3>
                    <span className="text-xs">{convo.time}</span>
                  </div>
                  <p className="text-xs truncate">{convo.preview}</p>
                </div>
              ))}
              <KrilinButton className="w-full">VIEW ALL COMMUNICATIONS</KrilinButton>
            </div>
          </KrilinCard>
        </div>
      </main>

      <footer className="bg-[#33272a] text-white p-4 text-center text-xs">
        <p>© 2025 KRILIN.AI - PERSONAL ASSISTANT</p>
        <p className="mt-2">POWER UP YOUR PRODUCTIVITY</p>
      </footer>
    </div>
  )
}

