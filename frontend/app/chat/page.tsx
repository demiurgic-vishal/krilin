"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { useStreamingMessage, useConversations } from "@/lib/hooks/useChat"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Input } from "@/components/retroui/Input"
import { Home, Plus, MessageSquare, Send } from "lucide-react"

export default function ChatPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { conversations, loading: conversationsLoading, refetch } = useConversations({ limit: 20 })
  const { sendStreamingMessage, loading: sendingMessage } = useStreamingMessage()

  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>>([])
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (conversations.length > 0 && !conversationId) {
      loadConversation(conversations[0].id)
    }
  }, [conversations])

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendingMessage) return

    const message = inputMessage.trim()
    setInputMessage('')

    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, userMessage])

    const aiMessageIndex = messages.length + 1
    const aiMessage = {
      role: 'assistant' as const,
      content: '',
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, aiMessage])

    try {
      await sendStreamingMessage({
        conversationId: conversationId || undefined,
        message,
        agentType: 'general_assistant',
        onToken: (token: string) => {
          setMessages(prev => {
            const updated = [...prev]
            updated[aiMessageIndex] = {
              ...updated[aiMessageIndex],
              content: updated[aiMessageIndex].content + token
            }
            return updated
          })
        },
        onComplete: (fullMessage: string) => {
          setMessages(prev => {
            const updated = [...prev]
            updated[aiMessageIndex] = {
              ...updated[aiMessageIndex],
              content: fullMessage
            }
            return updated
          })
        },
        onError: (error: string) => {
          console.error('Streaming error:', error)
          setMessages(prev => {
            const updated = [...prev]
            updated[aiMessageIndex] = {
              ...updated[aiMessageIndex],
              content: 'Sorry, I encountered an error. Please try again.'
            }
            return updated
          })
        }
      }).then((response) => {
        if (!conversationId && response?.conversation_id) {
          setConversationId(response.conversation_id)
          refetch()
        }
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const startNewConversation = () => {
    setConversationId(null)
    setMessages([])
    setShowSidebar(false)
  }

  const loadConversation = async (convId: number) => {
    try {
      setConversationId(convId)
      setShowSidebar(false)

      const { apiClient } = await import('@/lib/api/client')
      const conv = await apiClient.getConversation(convId)

      if (conv && conv.messages) {
        setMessages(conv.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString()
        })))
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <Home size={24} />
                </Button>
              </Link>
              <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
                Chat
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowSidebar(!showSidebar)}
                variant="outline"
                size="sm"
              >
                <MessageSquare size={16} className="mr-2" />
                {showSidebar ? 'Hide' : 'Show'} History
              </Button>
              <Button onClick={startNewConversation} size="sm">
                <Plus size={16} className="mr-2" />
                New Chat
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <aside className="w-80 border-r-4 border-[var(--border)] bg-[var(--card)] overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-bold mb-4 uppercase">Chat History</h3>
              {conversationsLoading ? (
                <div className="text-center py-8 text-[var(--muted-foreground)]">Loading...</div>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No conversations yet</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`w-full text-left p-3 border-2 border-[var(--border)] transition-all ${
                        conversationId === conv.id
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                          : 'bg-[var(--card)] hover:shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                      }`}
                    >
                      <div className="font-bold text-sm truncate">{conv.title}</div>
                      <div className="text-xs opacity-70 mt-1 truncate">
                        {conv.messages.length > 0
                          ? conv.messages[conv.messages.length - 1].content.substring(0, 50) + '...'
                          : 'No messages yet'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Chat Area */}
        <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="text-5xl font-[var(--font-head)] mb-4 uppercase text-outlined">
                    Chat
                  </div>
                  <p className="text-lg text-[var(--muted-foreground)]">
                    Start a conversation with your AI assistant
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-4 border-2 border-[var(--border)] ${
                      message.role === 'user'
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'bg-[var(--card)] text-[var(--card-foreground)]'
                    } shadow-[2px_2px_0_0_var(--border)]`}
                  >
                    <div className="text-xs opacity-70 mb-2 uppercase">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    <div className="text-xs opacity-50 mt-2">{message.timestamp}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t-4 border-[var(--border)] bg-[var(--card)] p-4 sticky bottom-0">
            <div className="flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type your message..."
                disabled={sendingMessage}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={sendingMessage || !inputMessage.trim()}
                size="lg"
              >
                <Send size={20} />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
