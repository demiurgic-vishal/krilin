"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useConversation, useSendMessage } from "@/lib/hooks/useChat"
import { Button } from "@/components/retroui/Button"
import KrilinChatContainer from "@/components/chat/krilin-chat-container"
import KrilinMessageBubble from "@/components/chat/krilin-message-bubble"
import KrilinMessageInput from "@/components/chat/krilin-message-input"
import { PixelLoader } from "@/components/ui/pixel-loader"
import { ArrowLeft } from "lucide-react"

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = parseInt(params.id as string)
  const { user, loading: authLoading } = useAuth()
  const { conversation, loading: convLoading, refetch } = useConversation(conversationId)
  const { sendMessage, loading: sendingMessage } = useSendMessage()
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (conversation && conversation.messages) {
      setMessages(conversation.messages.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content, timestamp: new Date(msg.created_at).toLocaleTimeString() })))
    }
  }, [conversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="text-3xl font-[var(--font-head)] mb-4 uppercase">Loading...</div>
          <div className="w-32 h-4 bg-[var(--muted)] mx-auto border-2 border-[var(--border)]">
            <div className="h-full bg-[var(--primary)] pixel-pulse w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (convLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="text-center py-12">
          <div className="text-xl text-[var(--muted-foreground)]">Loading conversation...</div>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="text-center py-12">
          <p className="text-[var(--muted-foreground)] mb-6">This conversation could not be found.</p>
          <Link href="/chat">
            <Button>Back to Chat</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSendMessage = async (message: string) => {
    const userMessage = { role: 'user' as const, content: message, timestamp: new Date().toLocaleTimeString() }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await sendMessage(conversationId, message)
      const aiMessage = { role: 'assistant' as const, content: response.message, timestamp: new Date().toLocaleTimeString() }
      setMessages(prev => [...prev, aiMessage])
      refetch()
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage = { role: 'assistant' as const, content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date().toLocaleTimeString() }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/chat">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
              {conversation.title}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative min-h-[600px]">
          <div className="border-4 border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-sm relative mb-6 shadow-[4px_4px_0_0_var(--border)]">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <KrilinChatContainer>
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-2xl font-bold font-[var(--font-head)] mb-4 uppercase">Start Conversation!</div>
                  <p className="text-[var(--muted-foreground)]">Send a message to begin.</p>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <KrilinMessageBubble key={index} content={message.content} role={message.role} timestamp={message.timestamp} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
              {sendingMessage && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center">
                    <div className="w-2 h-2 bg-white animate-pixelPulse" />
                  </div>
                  <div className="bg-[var(--primary)]/10 border-2 border-[var(--primary)]/30 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <PixelLoader variant="dots" size="sm" text="" />
                      <span className="text-sm text-[var(--primary)]">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </KrilinChatContainer>
          </div>
          <div className="border-4 border-[var(--border)] bg-[var(--card)] relative shadow-[4px_4px_0_0_var(--border)]">
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-[var(--border)]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--border)]" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-[var(--border)]" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--border)]" />
            <div className="p-4">
              <KrilinMessageInput onSend={handleSendMessage} disabled={sendingMessage} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
          </div>
        </div>
      </main>
    </div>
  )
}
