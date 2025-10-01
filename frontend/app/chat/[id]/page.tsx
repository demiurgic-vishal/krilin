"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { useConversation, useSendMessage } from "@/lib/hooks/useChat"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinChatContainer from "@/components/chat/krilin-chat-container"
import KrilinMessageBubble from "@/components/chat/krilin-message-bubble"
import KrilinMessageInput from "@/components/chat/krilin-message-input"
import { PixelLoader } from "@/components/ui/pixel-loader"

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
      <div className="min-h-screen flex items-center justify-center bg-[#fef6e4]">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#33272a] font-pixel mb-4">LOADING...</div>
        </div>
      </div>
    )
  }

  if (convLoading) {
    return (
      <KrilinPageLayout title="LOADING CONVERSATION...">
        <div className="text-center py-12">
          <div className="text-xl text-[#594a4e]">LOADING CONVERSATION...</div>
        </div>
      </KrilinPageLayout>
    )
  }

  if (!conversation) {
    return (
      <KrilinPageLayout title="CONVERSATION NOT FOUND">
        <div className="text-center py-12">
          <p className="text-[#594a4e] mb-6">This conversation could not be found.</p>
        </div>
      </KrilinPageLayout>
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
    <KrilinPageLayout title={conversation.title} showBackButton={true} breadcrumbs={[{ label: "Home", href: "/" }, { label: "Chat", href: "/chat" }, { label: conversation.title }]} containerSize="xl">
      <div className="relative min-h-[600px]">
        <div className="border-4 border-[#33272a] bg-[#fffaeb]/95 backdrop-blur-sm relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <KrilinChatContainer>
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-2xl font-bold text-[#33272a] font-pixel mb-4">START CONVERSATION!</div>
                <p className="text-[#594a4e]">Send a message to begin.</p>
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
                <div className="w-8 h-8 rounded-full bg-[#ff6b35] flex items-center justify-center">
                  <div className="w-2 h-2 bg-white animate-pixelPulse" />
                </div>
                <div className="bg-[#ff6b35]/10 border-2 border-[#ff6b35]/30 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <PixelLoader variant="dots" size="sm" text="" />
                    <span className="font-pixel text-sm text-[#ff6b35]">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </KrilinChatContainer>
        </div>
        <div className="border-4 border-[#33272a] bg-[#fffaeb] relative hover-lift">
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#33272a]" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#33272a]" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-[#33272a]" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#33272a]" />
          <div className="p-4">
            <KrilinMessageInput onSend={handleSendMessage} disabled={sendingMessage} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
        </div>
      </div>
    </KrilinPageLayout>
  )
}
