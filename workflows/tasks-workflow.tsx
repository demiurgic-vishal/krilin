"use client"

import { useState } from "react"
import KrilinButton from "../components/krilin-button"
import KrilinCard from "../components/krilin-card"
import KrilinPowerMeter from "../components/krilin-power-meter"

export default function TasksWorkflow() {
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
