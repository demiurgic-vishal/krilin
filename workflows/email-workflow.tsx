"use client"

import KrilinButton from "../components/krilin-button"
import KrilinCard from "../components/krilin-card"
import KrilinPowerMeter from "../components/krilin-power-meter"

export default function EmailWorkflow() {
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
