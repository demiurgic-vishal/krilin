"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { useSendMessage, useConversations } from "@/lib/hooks/useChat"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinChatContainer from "@/components/chat/krilin-chat-container"
import KrilinMessageBubble from "@/components/chat/krilin-message-bubble"
import KrilinMessageInput from "@/components/chat/krilin-message-input"
import { PixelLoader } from "@/components/ui/pixel-loader"

export default function ChatPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { conversations, loading: conversationsLoading, refetch } = useConversations({ limit: 1 })
  const { sendMessage, loading: sendingMessage } = useSendMessage()
  
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>>([])
  const [conversationId, setConversationId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Load most recent conversation
  useEffect(() => {
    if (conversations.length > 0 && !conversationId) {
      const latestConvo = conversations[0]
      setConversationId(latestConvo.id)
      
      // Load messages from conversation
      if (latestConvo.messages && latestConvo.messages.length > 0) {
        setMessages(latestConvo.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString()
        })))
      }
    }
  }, [conversations, conversationId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fef6e4]">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#33272a] font-pixel mb-4">LOADING...</div>
        </div>
      </div>
    )
  }

  const handleSendMessage = async (message: string) => {
    // Add user message immediately
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await sendMessage({
        conversationId: conversationId || undefined,
        message,
        agentType: 'general_assistant'
      })

      // Add AI response
      const aiMessage = {
        role: 'assistant' as const,
        content: response.message,
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, aiMessage])

      // Set conversation ID if this was a new conversation
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id)
        refetch()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Show error message
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const startNewConversation = () => {
    setConversationId(null)
    setMessages([{
      role: 'assistant',
      content: 'Greetings, warrior! I am your personal assistant. How can I help you power up your day?',
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  return (
    <KrilinPageLayout
      title="COMMUNICATION TERMINAL"
      showBackButton={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Chat" }
      ]}
      containerSize="xl"
      headerContent={
        <div className="flex justify-end">
          <button
            onClick={startNewConversation}
            className="px-4 py-2 bg-[#4ecdc4] hover:bg-[#4ecdc4]/80 text-[#33272a] font-bold border-2 border-[#33272a] transition-colors"
          >
            NEW CONVERSATION
          </button>
        </div>
      }
    >
      <div className="relative min-h-[600px]">
        {/* Chat Container */}
        <div className="border-4 border-[#33272a] bg-[#fffaeb]/95 backdrop-blur-sm relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          
          <KrilinChatContainer>
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-2xl font-bold text-[#33272a] font-pixel mb-4">
                  READY TO START TRAINING!
                </div>
                <p className="text-[#594a4e]">
                  Ask me anything - I'm here to help you level up!
                </p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <KrilinMessageBubble
                    key={index}
                    content={message.content}
                    role={message.role}
                    timestamp={message.timestamp}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
              
            {sendingMessage && (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#ff6b35] flex items-center justify-center">
                  <div className="w-2 h-2 bg-white animate-pixelPulse" />
                </div>
                <div className="bg-[#ff6b35]/10 border-2 border-[#ff6b35]/30 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <PixelLoader variant="dots" size="sm" text="" />
                    <span className="font-pixel text-sm text-[#ff6b35]">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </KrilinChatContainer>
        </div>

        {/* Input Container */}
        <div className="border-4 border-[#33272a] bg-[#fffaeb] relative hover-lift">
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#33272a]" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#33272a]" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-[#33272a]" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#33272a]" />
          
          <div className="p-4">
            <KrilinMessageInput 
              onSend={handleSendMessage}
              disabled={sendingMessage}
            />
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
        </div>
      </div>
    </KrilinPageLayout>
  )
}
