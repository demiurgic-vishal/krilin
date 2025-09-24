"use client"
import KrilinHeader from "@/components/krilin-header"
import KrilinChatContainer from "@/components/chat/krilin-chat-container"
import KrilinMessageBubble from "@/components/chat/krilin-message-bubble"
import KrilinMessageInput from "@/components/chat/krilin-message-input"
import KrilinButton from "@/components/krilin-button"
import { ArrowLeft } from "lucide-react"

export default function ChatPage() {
  // Sample conversation
  const messages = [
    {
      role: "assistant" as const,
      content: "Greetings, warrior! I am Krilin.AI, your personal assistant. How can I help you power up your day?",
      timestamp: "9:30 AM",
    },
    {
      role: "user" as const,
      content: "I need to organize my schedule for next week. Can you help me?",
      timestamp: "9:31 AM",
    },
    {
      role: "assistant" as const,
      content: "Of course! Let's train your schedule to perfection. What are your main priorities for next week?",
      timestamp: "9:31 AM",
    },
    {
      role: "user" as const,
      content:
        "I have a big presentation on Tuesday at 2pm, and I need to prepare for it. Also, I need to schedule some time for exercise.",
      timestamp: "9:32 AM",
    },
    {
      role: "assistant" as const,
      content:
        "Excellent! Here's a training regimen for your week:\n\n1. **Monday**:\n   - Morning: Review presentation materials (2 hours)\n   - Afternoon: Create presentation slides (3 hours)\n   - Evening: 30-minute cardio workout\n\n2. **Tuesday**:\n   - Morning: Practice presentation (1 hour)\n   - 2:00 PM: MAIN EVENT - Deliver your presentation\n   - Evening: Recovery period - light stretching\n\n3. **Wednesday-Friday**:\n   - Morning: 45-minute strength training\n   - Work periods with 5-minute breaks every hour\n\nThis schedule balances your presentation preparation with regular exercise. Would you like me to add any specific details or make adjustments?",
      timestamp: "9:34 AM",
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

        <div className="pixel-border bg-[#594a4e] p-1 mb-4">
          <div className="bg-[#33272a] text-white p-2 text-center">
            <h1 className="text-xl">KRILIN.AI COMMUNICATION TERMINAL</h1>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 scanlines pointer-events-none"></div>
          <div className="crt-effect">
            <KrilinChatContainer>
              {messages.map((message, index) => (
                <KrilinMessageBubble
                  key={index}
                  content={message.content}
                  role={message.role}
                  timestamp={message.timestamp}
                />
              ))}
            </KrilinChatContainer>
          </div>
        </div>

        <div className="mt-4 pixel-border p-4 bg-[#fffaeb]">
          <KrilinMessageInput onSend={(message) => console.log("Sending message:", message)} />
        </div>
      </main>

      <footer className="bg-[#33272a] text-white p-4 text-center text-xs mt-8">
        <p>© 2025 KRILIN.AI - PERSONAL ASSISTANT</p>
        <p className="mt-2">POWER UP YOUR PRODUCTIVITY</p>
      </footer>
    </div>
  )
}

