"use client"

import KrilinButton from "../components/krilin-button"
import KrilinCard from "../components/krilin-card"

export default function NotesWorkflow() {
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
