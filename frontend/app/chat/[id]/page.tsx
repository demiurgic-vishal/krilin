"use client"

import { useState, useEffect, useRef, memo, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { useAuth } from "@/lib/auth/AuthContext"
import { useStreamingMessage, useConversations } from "@/lib/hooks/useChat"
import { Button } from "@/components/retroui/Button"
import { Input } from "@/components/retroui/Input"
import { AnimatedTitle } from "@/components/AnimatedTitle"
import { Home, Plus, MessageSquare, Send, Trash2, Loader2, Paperclip, X } from "lucide-react"

// Retro terminal-style code theme (dark background for all modes)
const retroCodeTheme = {
  'code[class*="language-"]': {
    color: '#f5f5f5',
    background: '#2d2d2d',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.875rem',
    textAlign: 'left' as const,
    whiteSpace: 'pre' as const,
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.6',
    tabSize: 2,
    hyphens: 'none' as const,
  },
  'pre[class*="language-"]': {
    color: '#f5f5f5',
    background: '#2d2d2d',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.875rem',
    textAlign: 'left' as const,
    whiteSpace: 'pre' as const,
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.6',
    tabSize: 2,
    hyphens: 'none' as const,
    padding: '1em',
    margin: '0',
    overflow: 'auto',
  },
  'comment': { color: '#a0a0a0', fontStyle: 'italic' },
  'prolog': { color: '#a0a0a0' },
  'doctype': { color: '#a0a0a0' },
  'cdata': { color: '#a0a0a0' },
  'punctuation': { color: '#f5f5f5' },
  'property': { color: '#ff6b7a', fontWeight: 'bold' },
  'tag': { color: '#ff6b7a', fontWeight: 'bold' },
  'boolean': { color: '#00ffe5', fontWeight: 'bold' },
  'number': { color: '#00ffe5', fontWeight: 'bold' },
  'constant': { color: '#00ffe5', fontWeight: 'bold' },
  'symbol': { color: '#00ffe5' },
  'deleted': { color: '#ff6b7a' },
  'selector': { color: '#b8b1ff', fontWeight: 'bold' },
  'attr-name': { color: '#b8b1ff' },
  'string': { color: '#fffa65' },
  'char': { color: '#fffa65' },
  'builtin': { color: '#ffc799', fontWeight: 'bold' },
  'inserted': { color: '#00ffe5' },
  'operator': { color: '#ffd700', fontWeight: 'bold' },
  'entity': { color: '#ffd700' },
  'url': { color: '#b8b1ff' },
  'variable': { color: '#ffc799' },
  'atrule': { color: '#ff6b7a', fontWeight: 'bold' },
  'attr-value': { color: '#fffa65' },
  'function': { color: '#ffd700', fontWeight: 'bold' },
  'class-name': { color: '#ffc799', fontWeight: 'bold' },
  'keyword': { color: '#ff6b7a', fontWeight: 'bold' },
  'regex': { color: '#b8b1ff' },
  'important': { color: '#ff6b7a', fontWeight: 'bold' },
}

// Code block wrapper component
const CodeBlock = ({ language, children }: { language: string; children: string }) => (
  <div className="my-3 border-2 border-[var(--border)] shadow-[3px_3px_0_0_var(--border)] overflow-hidden">
    {/* Terminal header bar */}
    <div className="bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1 border-b-2 border-[var(--border)] flex items-center justify-between">
      <span className="text-xs font-bold uppercase font-[var(--font-head)]">{language || 'code'}</span>
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 bg-[var(--destructive)] border border-[var(--border)]"></div>
        <div className="w-2.5 h-2.5 bg-[var(--warning)] border border-[var(--border)]"></div>
        <div className="w-2.5 h-2.5 bg-[var(--success)] border border-[var(--border)]"></div>
      </div>
    </div>
    {/* Code content */}
    <SyntaxHighlighter
      style={retroCodeTheme}
      language={language || 'text'}
      PreTag="div"
      customStyle={{
        margin: 0,
        borderRadius: 0,
        background: '#2d2d2d',
        border: 'none',
      }}
      codeTagProps={{
        style: {
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        }
      }}
    >
      {children}
    </SyntaxHighlighter>
  </div>
)

// Memoized Message Component to prevent re-renders
const MessageBubble = memo(({ message, index }: { message: { role: 'user' | 'assistant', content: string, timestamp: string, thinking?: string, toolCalls?: Array<{ tool: string; input: any }> }, index: number }) => {
  const [showThinking, setShowThinking] = useState(false)
  const [showToolCalls, setShowToolCalls] = useState(false)

  return (
    <div
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

        {/* Tool Calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setShowToolCalls(!showToolCalls)}
              className="text-xs bg-[var(--muted)] px-2 py-1 border border-[var(--border)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-colors"
            >
              🛠️ {message.toolCalls.length} tool{message.toolCalls.length > 1 ? 's' : ''} used {showToolCalls ? '▼' : '▶'}
            </button>
            {showToolCalls && (
              <div className="mt-2 space-y-1">
                {message.toolCalls.map((call, i) => (
                  <div key={i} className="text-xs bg-[var(--muted)] p-2 border border-[var(--border)]">
                    <div className="font-bold">{call.tool}</div>
                    {call.input && <pre className="mt-1 text-xs overflow-x-auto">{JSON.stringify(call.input, null, 2)}</pre>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Thinking */}
        {message.thinking && (
          <div className="mb-3">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="text-xs bg-[var(--muted)] px-2 py-1 border border-[var(--border)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-colors"
            >
              💭 View thinking {showThinking ? '▼' : '▶'}
            </button>
            {showThinking && (
              <div className="mt-2 text-xs bg-[var(--muted)] p-2 border border-[var(--border)] opacity-70">
                <div className="prose prose-sm max-w-none retro-markdown">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        const language = match ? match[1] : ''
                        return !inline && language ? (
                          <CodeBlock language={language}>
                            {String(children).replace(/\n$/, '')}
                          </CodeBlock>
                        ) : !inline ? (
                          <pre className="bg-[#2d2d2d] text-[#f5f5f5] p-2 my-2 border-2 border-[var(--border)] shadow-[2px_2px_0_0_var(--border)] overflow-x-auto">
                            <code className="text-xs font-mono" {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code className="bg-[#2d2d2d] text-[#ffd700] px-1.5 py-0.5 border border-[var(--border)] text-xs font-mono font-bold" {...props}>
                            {children}
                          </code>
                        )
                      },
                      p: ({ children }) => <p className="mb-1 leading-relaxed italic">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1 ml-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1 ml-2">{children}</ol>,
                      li: ({ children }) => <li className="ml-1 text-xs">{children}</li>,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                    }}
                  >
                    {message.thinking}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
        {message.role === 'assistant' ? (
          <div className="prose prose-sm max-w-none retro-markdown">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  const language = match ? match[1] : ''
                  return !inline && language ? (
                    <CodeBlock language={language}>
                      {String(children).replace(/\n$/, '')}
                    </CodeBlock>
                  ) : !inline ? (
                    <pre className="bg-[#2d2d2d] text-[#f5f5f5] p-3 my-2 border-2 border-[var(--border)] shadow-[3px_3px_0_0_var(--border)] overflow-x-auto">
                      <code className="text-sm font-mono" {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code className="bg-[#2d2d2d] text-[#ffd700] px-1.5 py-0.5 border border-[var(--border)] text-sm font-mono font-bold" {...props}>
                      {children}
                    </code>
                  )
                },
                h1: ({ children }) => <h1 className="text-2xl font-[var(--font-head)] uppercase border-b-2 border-[var(--border)] pb-2 mb-3 mt-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-[var(--font-head)] uppercase border-b-2 border-[var(--border)] pb-2 mb-2 mt-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-bold uppercase mb-2 mt-2">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 ml-4">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 ml-4">{children}</ol>,
                li: ({ children }) => <li className="ml-2">{children}</li>,
                p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                a: ({ children, href }) => <a href={href} className="text-[var(--primary)] underline font-bold hover:opacity-80" target="_blank" rel="noopener noreferrer">{children}</a>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-[var(--primary)] pl-4 py-2 my-2 bg-[var(--muted)] italic">{children}</blockquote>,
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                hr: () => <hr className="my-4 border-t-2 border-[var(--border)]" />,
                table: ({ children }) => <div className="overflow-x-auto my-2"><table className="border-2 border-[var(--border)] w-full">{children}</table></div>,
                thead: ({ children }) => <thead className="bg-[var(--primary)]">{children}</thead>,
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => <tr className="border-b-2 border-[var(--border)]">{children}</tr>,
                th: ({ children }) => <th className="border-2 border-[var(--border)] px-3 py-2 text-left font-bold">{children}</th>,
                td: ({ children }) => <td className="border-2 border-[var(--border)] px-3 py-2">{children}</td>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        )}
        <div className="text-xs opacity-50 mt-2">{message.timestamp}</div>
      </div>
    </div>
  )
})

MessageBubble.displayName = 'MessageBubble'

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id ? parseInt(params.id as string) : null
  const { user, loading: authLoading } = useAuth()
  const { conversations, loading: conversationsLoading, refetch, updateConversationTitle } = useConversations({ limit: 20 })
  const { sendStreamingMessage, loading: sendingMessage } = useStreamingMessage()

  const [lastUpdatedConversationId, setLastUpdatedConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    thinking?: string
    toolCalls?: Array<{ tool: string; input: any }>
  }>>([])
  const [currentThinking, setCurrentThinking] = useState<string>('')
  const [currentToolCalls, setCurrentToolCalls] = useState<Array<{ tool: string; input: any }>>([])
  const [responseComplete, setResponseComplete] = useState<boolean>(true) // Track if AI response is complete
  const [showSidebar, setShowSidebar] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatSidebarOpen')
      return saved !== null ? JSON.parse(saved) : true
    }
    return true
  })
  const [inputMessage, setInputMessage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; path: string; size: number }>>([])
  const [uploading, setUploading] = useState(false)
  const hasAddedMessageRef = useRef(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Define functions before useEffects
  const loadConversation = async (convId: number) => {
    try {
      const { apiClient } = await import('@/lib/api/client')
      const conv = await apiClient.getConversation(convId)

      if (conv && conv.messages) {
        setMessages(conv.messages.map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString()
        })))
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
      router.push('/chat')
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
    }
  }, [conversationId])

  useEffect(() => {
    localStorage.setItem('chatSidebarOpen', JSON.stringify(showSidebar))
  }, [showSidebar])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const { apiClient } = await import('@/lib/api/client')

      for (const file of Array.from(files)) {
        const response = await apiClient.uploadFile(file)
        setUploadedFiles(prev => [...prev, {
          name: response.filename,
          path: response.file_path,
          size: response.file_size
        }])
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeFile = (path: string) => {
    setUploadedFiles(prev => prev.filter(f => f.path !== path))
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendingMessage || !conversationId) return

    const message = inputMessage.trim()
    const filePaths = uploadedFiles.map(f => f.path)
    setInputMessage('')
    setUploadedFiles([])

    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, userMessage])

    // Reset the ref for this new message - do it right before streaming starts
    hasAddedMessageRef.current = false
    setCurrentThinking('')
    setCurrentToolCalls([])
    setResponseComplete(false) // Mark response as incomplete

    try {
      await sendStreamingMessage({
        conversationId,
        message,
        agentType: 'general_assistant',
        filePaths,
        onThinking: (thinking: string) => {
          setCurrentThinking(prev => prev + thinking)
        },
        onToolUse: (tool: string, input: any) => {
          setCurrentToolCalls(prev => [...prev, { tool, input }])
        },
        onTitleUpdate: (newTitle: string) => {
          // Update conversation title in sidebar immediately
          if (conversationId) {
            updateConversationTitle(conversationId, newTitle)
            setLastUpdatedConversationId(conversationId)
          }
        },
        onToken: (token: string) => {
          setMessages(prev => {
            // Check if the last message is from assistant (streaming in progress)
            const lastMessage = prev[prev.length - 1]
            const isStreamingToAssistant = lastMessage?.role === 'assistant' && hasAddedMessageRef.current

            if (!hasAddedMessageRef.current) {
              // First token: add new assistant message
              hasAddedMessageRef.current = true
              return [...prev, {
                role: 'assistant' as const,
                content: token,
                timestamp: new Date().toLocaleTimeString()
              }]
            } else if (isStreamingToAssistant) {
              // Subsequent tokens: append to last assistant message
              const updated = [...prev]
              const lastIndex = updated.length - 1
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: updated[lastIndex].content + token
              }
              return updated
            } else {
              // Safety fallback: create new assistant message if somehow out of sync
              return [...prev, {
                role: 'assistant' as const,
                content: token,
                timestamp: new Date().toLocaleTimeString()
              }]
            }
          })
        },
        onComplete: (fullMessage: string) => {
          setMessages(prev => {
            if (!hasAddedMessageRef.current) {
              // If no tokens were received, add the full message
              hasAddedMessageRef.current = true
              return [...prev, {
                role: 'assistant' as const,
                content: fullMessage,
                timestamp: new Date().toLocaleTimeString(),
                thinking: currentThinking,
                toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined
              }]
            } else {
              // Update the last message with the complete content
              const updated = [...prev]
              const lastIndex = updated.length - 1
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: fullMessage,
                thinking: currentThinking,
                toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined
              }
              return updated
            }
          })

          // Mark response as complete - hides "Processing..." indicator
          setResponseComplete(true)

          // Clear after adding to message
          setCurrentThinking('')
          setCurrentToolCalls([])
        },
        onError: (error: string) => {
          console.error('Streaming error:', error)
          setMessages(prev => {
            if (!hasAddedMessageRef.current) {
              hasAddedMessageRef.current = true
              return [...prev, {
                role: 'assistant' as const,
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toLocaleTimeString()
              }]
            } else {
              const updated = [...prev]
              const lastIndex = updated.length - 1
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: 'Sorry, I encountered an error. Please try again.'
              }
              return updated
            }
          })
          // Ensure any active indicators are cleared on error
          setResponseComplete(true)
          setCurrentThinking('')
          setCurrentToolCalls([])
        }
      }).then(() => {
        refetch()
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const startNewConversation = async () => {
    setCreatingNew(true)
    try {
      const { apiClient } = await import('@/lib/api/client')
      const conversation = await apiClient.createConversation({
        title: 'New Conversation',
        agent_type: 'general_assistant'
      })
      router.push(`/chat/${conversation.id}`)
    } catch (error) {
      console.error('Failed to create conversation:', error)
      setCreatingNew(false)
    }
  }

  const handleDeleteConversation = async (convId: number) => {
    try {
      const { apiClient } = await import('@/lib/api/client')
      await apiClient.deleteConversation(convId)

      await refetch()

      if (convId === conversationId) {
        router.push('/chat')
      }

      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  return (
    <div className="h-screen bg-[var(--background)] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)] flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
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
              <Button onClick={startNewConversation} size="sm" disabled={creatingNew}>
                {creatingNew ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    New Chat
                  </>
                )}
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
                    <div key={conv.id} className="relative group">
                      {deleteConfirm === conv.id ? (
                        <div className="p-3 border-2 border-[var(--danger)] bg-[var(--card)]">
                          <p className="text-sm mb-2">Delete this conversation?</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteConversation(conv.id)}
                            >
                              Delete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => router.push(`/chat/${conv.id}`)}
                            className={`w-full text-left p-3 border-2 border-[var(--border)] transition-all ${
                              conversationId === conv.id
                                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                                : 'bg-[var(--card)] hover:shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                            }`}
                          >
                            <div className="font-bold text-sm pr-8 overflow-hidden">
                              <AnimatedTitle key={conv.id} title={conv.title} animateOnMount={lastUpdatedConversationId === conv.id} />
                            </div>
                            <div className="text-xs opacity-70 mt-1 line-clamp-2 prose prose-sm max-w-none">
                              {conv.messages.length > 0 ? (
                                <ReactMarkdown
                                  components={{
                                    code: ({ children }) => <code className="bg-[var(--muted)] px-1 text-xs">{children}</code>,
                                    p: ({ children }) => <span>{children}</span>,
                                    ul: ({ children }) => <span>{children}</span>,
                                    ol: ({ children }) => <span>{children}</span>,
                                    li: ({ children }) => <span>{children} </span>,
                                    h1: ({ children }) => <span className="font-bold">{children}</span>,
                                    h2: ({ children }) => <span className="font-bold">{children}</span>,
                                    h3: ({ children }) => <span className="font-bold">{children}</span>,
                                    strong: ({ children }) => <strong>{children}</strong>,
                                    em: ({ children }) => <em>{children}</em>,
                                    a: ({ children }) => <span>{children}</span>,
                                    blockquote: ({ children }) => <span>{children}</span>,
                                  }}
                                >
                                  {conv.messages[conv.messages.length - 1].content.substring(0, 80)}
                                </ReactMarkdown>
                              ) : (
                                'No messages yet'
                              )}
                            </div>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(conv.id)}
                            className="absolute top-3 right-3 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--danger)] hover:text-white border-2 border-[var(--border)]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Chat Area */}
        <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full overflow-hidden">
          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4 min-h-full flex flex-col justify-end">
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
              <>
                {messages.map((message, index) => (
                  <MessageBubble key={index} message={message} index={index} />
                ))}
                {!responseComplete && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] p-4 border-2 border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-[2px_2px_0_0_var(--border)]">
                      <div className="text-xs opacity-70 mb-2 uppercase">Assistant</div>

                      {/* Show active thinking */}
                      {currentThinking && (
                        <div className="mb-2 text-xs bg-[var(--muted)] p-2 border border-[var(--border)] opacity-70 max-h-20 overflow-y-auto">
                          <div className="prose prose-sm max-w-none retro-markdown">
                            <ReactMarkdown
                              components={{
                                code({ node, inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || '')
                                  const language = match ? match[1] : ''
                                  return !inline && language ? (
                                    <CodeBlock language={language}>
                                      {String(children).replace(/\n$/, '')}
                                    </CodeBlock>
                                  ) : !inline ? (
                                    <pre className="bg-[#2d2d2d] text-[#f5f5f5] p-2 my-2 border-2 border-[var(--border)] shadow-[2px_2px_0_0_var(--border)] overflow-x-auto">
                                      <code className="text-xs font-mono" {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  ) : (
                                    <code className="bg-[#2d2d2d] text-[#ffd700] px-1.5 py-0.5 border border-[var(--border)] text-xs font-mono font-bold" {...props}>
                                      {children}
                                    </code>
                                  )
                                },
                                p: ({ children }) => <p className="mb-1 leading-relaxed italic">💭 {children}</p>,
                                ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1 ml-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1 ml-2">{children}</ol>,
                                li: ({ children }) => <li className="ml-1 text-xs">{children}</li>,
                              }}
                            >
                              {currentThinking}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {/* Show active tool calls */}
                      {currentToolCalls.length > 0 && (
                        <div className="mb-2 space-y-1">
                          {currentToolCalls.map((call, i) => (
                            <div key={i} className="text-xs bg-[var(--muted)] p-2 border border-[var(--border)]">
                              🛠️ Using: <span className="font-bold">{call.tool}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-[var(--primary)] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-[var(--primary)] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-[var(--primary)] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm text-[var(--muted-foreground)]">
                          {currentThinking ? 'Thinking...' : currentToolCalls.length > 0 ? 'Working...' : 'Processing...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            </div>
          </div>

          {/* Input */}
          <div className="border-t-4 border-[var(--border)] bg-[var(--card)] p-4 sticky bottom-0">
            {/* Uploaded files display */}
            {uploadedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center gap-2 px-3 py-2 bg-[var(--muted)] border-2 border-[var(--border)] text-sm"
                  >
                    <Paperclip size={14} />
                    <span className="font-mono text-xs max-w-[200px] truncate" title={file.path}>
                      {file.path}
                    </span>
                    <span className="text-xs opacity-50">
                      ({(file.size / 1024).toFixed(1)}KB)
                    </span>
                    <button
                      onClick={() => removeFile(file.path)}
                      className="ml-2 p-1 hover:bg-[var(--danger)] hover:text-white transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 items-end">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="icon"
                disabled={uploading || sendingMessage}
                title="Attach files"
              >
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
              </Button>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Type your message... (Shift+Enter for new line)"
                disabled={sendingMessage}
                rows={1}
                className="flex-1 resize-none overflow-y-auto max-h-40 px-4 py-3 bg-[var(--background)] text-[var(--foreground)] border-2 border-[var(--border)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed font-[var(--font-body)]"
                style={{
                  minHeight: '48px',
                  height: 'auto',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 160) + 'px'
                }}
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
