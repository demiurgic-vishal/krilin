"use client"

import KrilinButton from "../components/krilin-button"
import KrilinCard from "../components/krilin-card"

export default function CalendarWorkflow() {
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
            {days.map((day) => (
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
