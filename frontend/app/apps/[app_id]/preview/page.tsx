"use client";

import { useState, useEffect, useRef, memo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { AppRunner } from "@/components/AppRunner";
import {
  ArrowLeft,
  Eye,
  MessageSquare,
  Upload,
  Edit,
  Loader2,
  X,
  Send,
  FileText,
  History
} from "lucide-react";

// Retro terminal-style code theme
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
  'punctuation': { color: '#f5f5f5' },
  'property': { color: '#ff6b7a', fontWeight: 'bold' },
  'tag': { color: '#ff6b7a', fontWeight: 'bold' },
  'boolean': { color: '#00ffe5', fontWeight: 'bold' },
  'number': { color: '#00ffe5', fontWeight: 'bold' },
  'constant': { color: '#00ffe5', fontWeight: 'bold' },
  'selector': { color: '#b8b1ff', fontWeight: 'bold' },
  'attr-name': { color: '#b8b1ff' },
  'string': { color: '#fffa65' },
  'char': { color: '#fffa65' },
  'builtin': { color: '#ffc799', fontWeight: 'bold' },
  'inserted': { color: '#00ffe5' },
  'operator': { color: '#ffd700', fontWeight: 'bold' },
  'entity': { color: '#ffd700' },
  'function': { color: '#ffd700', fontWeight: 'bold' },
  'class-name': { color: '#ffc799', fontWeight: 'bold' },
  'keyword': { color: '#ff6b7a', fontWeight: 'bold' },
};

// Code block component
const CodeBlock = ({ language, children }: { language: string; children: string }) => (
  <div className="my-2 border-2 border-[var(--border)] shadow-[2px_2px_0_0_var(--border)] overflow-hidden">
    <div className="bg-[var(--primary)] text-[var(--primary-foreground)] px-2 py-1 border-b-2 border-[var(--border)] flex items-center justify-between">
      <span className="text-xs font-bold uppercase">{language || 'code'}</span>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-[var(--destructive)] border border-[var(--border)]"></div>
        <div className="w-2 h-2 bg-[var(--warning)] border border-[var(--border)]"></div>
        <div className="w-2 h-2 bg-[var(--success)] border border-[var(--border)]"></div>
      </div>
    </div>
    <SyntaxHighlighter
      style={retroCodeTheme}
      language={language || 'text'}
      PreTag="div"
      customStyle={{
        margin: 0,
        borderRadius: 0,
        background: '#2d2d2d',
        border: 'none',
        fontSize: '0.75rem',
        padding: '0.5rem'
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
);

// Helper function to detect if content contains markdown
const hasMarkdown = (content: string): boolean => {
  // Check for common markdown patterns
  const markdownPatterns = [
    /^\s*#+ /m,           // Headers
    /```/,                 // Code blocks
    /\*\*.*\*\*/,         // Bold
    /\*.*\*/,             // Italic
    /\[.*\]\(.*\)/,       // Links
    /^\s*[-*+] /m,        // Unordered lists
    /^\s*\d+\. /m,        // Ordered lists
    /^\s*>/m,             // Blockquotes
  ];

  return markdownPatterns.some(pattern => pattern.test(content));
};

// Message Bubble Component
const MessageBubble = memo(({ message }: { message: { role: 'user' | 'assistant', content: string } }) => {
  const shouldRenderMarkdown = message.role === 'assistant' && hasMarkdown(message.content);

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] p-3 border-2 border-[var(--border)] shadow-[2px_2px_0_0_var(--border)] ${
          message.role === 'user'
            ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
            : 'bg-[var(--card)] text-[var(--card-foreground)]'
        }`}
      >
        <div className="text-xs opacity-70 uppercase mb-1">
          {message.role === 'user' ? 'You' : 'AI Assistant'}
        </div>
        {shouldRenderMarkdown ? (
          <div className="prose prose-sm max-w-none retro-markdown">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  return !inline && language ? (
                    <CodeBlock language={language}>
                      {String(children).replace(/\n$/, '')}
                    </CodeBlock>
                  ) : !inline ? (
                    <pre className="bg-[#2d2d2d] text-[#f5f5f5] p-2 my-1 border-2 border-[var(--border)] shadow-[2px_2px_0_0_var(--border)] overflow-x-auto text-xs">
                      <code className="font-mono" {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code className="bg-[#2d2d2d] text-[#ffd700] px-1 py-0.5 border border-[var(--border)] text-xs font-mono font-bold" {...props}>
                      {children}
                    </code>
                  );
                },
                h1: ({ children }) => <h1 className="text-lg font-bold uppercase border-b-2 border-[var(--border)] pb-1 mb-2 mt-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold uppercase border-b border-[var(--border)] pb-1 mb-1 mt-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold uppercase mb-1 mt-1">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1 ml-2 text-sm">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1 ml-2 text-sm">{children}</ol>,
                li: ({ children }) => <li className="ml-1 text-sm">{children}</li>,
                p: ({ children }) => <p className="mb-1 leading-relaxed text-sm">{children}</p>,
                a: ({ children, href }) => <a href={href} className="text-[var(--primary)] underline font-bold hover:opacity-80" target="_blank" rel="noopener noreferrer">{children}</a>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-[var(--primary)] pl-2 py-1 my-1 bg-[var(--muted)] italic text-sm">{children}</blockquote>,
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                hr: () => <hr className="my-2 border-t-2 border-[var(--border)]" />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

interface AppData {
  id: string;
  name: string;
  description: string;
  status: string;
}

export default function AppPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params?.app_id as string;
  const { user, loading: authLoading } = useAuth();

  const [app, setApp] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant'; content: string}>>([]);
  const [authToken, setAuthToken] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [showConversationSidebar, setShowConversationSidebar] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [appKey, setAppKey] = useState(0); // Used to force AppRunner reload
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasAddedMessageRef = useRef(false);

  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isStreaming, currentStatus]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && user && appId) {
      loadApp();
    }
  }, [user, authLoading, router, appId]);

  const loadApp = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const appResponse = await fetch(`http://localhost:8001/api/v1/apps/drafts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!appResponse.ok) throw new Error('Failed to fetch app');

      const appsData = await appResponse.json();
      const appData = appsData.apps.find((a: any) => a.id === appId);

      if (!appData) {
        throw new Error('App not found');
      }

      setApp(appData);
    } catch (err: any) {
      console.error('Failed to load app:', err);
      setError(err.message || 'Failed to load app');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this app to your library?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`http://localhost:8001/api/v1/apps/${appId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to publish app');
      }

      alert('App published successfully!');
      router.push('/apps?tab=library');
    } catch (err: any) {
      console.error('Failed to publish:', err);
      setError(err.message || 'Failed to publish app');
    }
  };

  const handleSelectConversation = (conversationId: number | null, messages: Array<{role: string; content: string}>) => {
    setCurrentConversationId(conversationId);
    setChatHistory(messages as Array<{role: 'user' | 'assistant'; content: string}>);
    setShowConversationSidebar(false);
    if (!showChat) {
      setShowChat(true);
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setChatHistory([]);
    setShowConversationSidebar(false);
    if (!showChat) {
      setShowChat(true);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatMessage.trim() || isStreaming) return;

    // Add user message to history
    const userMessage = { role: 'user' as const, content: chatMessage.trim() };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    const currentMessage = chatMessage;
    setChatMessage("");

    // Reset streaming state
    hasAddedMessageRef.current = false;
    setIsStreaming(true);
    setCurrentStatus("");

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`http://localhost:8001/api/v1/apps/${appId}/refine`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: currentMessage,
          conversation_history: newHistory,
          conversation_id: currentConversationId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let modifiedFiles: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'conversation_id':
                  // Save conversation ID for future requests
                  setCurrentConversationId(data.conversation_id);
                  break;

                case 'status':
                  // Update status indicator
                  setCurrentStatus(data.content);
                  break;

                case 'token':
                  // Append token to response
                  setChatHistory(prev => {
                    const lastMessage = prev[prev.length - 1];
                    const isStreamingToAssistant = lastMessage?.role === 'assistant' && hasAddedMessageRef.current;

                    if (!hasAddedMessageRef.current) {
                      // First token: add new assistant message
                      hasAddedMessageRef.current = true;
                      return [...prev, {
                        role: 'assistant' as const,
                        content: data.content
                      }];
                    } else if (isStreamingToAssistant) {
                      // Subsequent tokens: append to last assistant message
                      const updated = [...prev];
                      const lastIndex = updated.length - 1;
                      updated[lastIndex] = {
                        ...updated[lastIndex],
                        content: updated[lastIndex].content + data.content
                      };
                      return updated;
                    } else {
                      // Safety fallback
                      return [...prev, {
                        role: 'assistant' as const,
                        content: data.content
                      }];
                    }
                  });
                  break;

                case 'done':
                  // Refinement complete
                  modifiedFiles = data.modified_files || [];
                  if (modifiedFiles.length > 0) {
                    setChatHistory(prev => {
                      const updated = [...prev];
                      const lastIndex = updated.length - 1;
                      if (updated[lastIndex]?.role === 'assistant') {
                        updated[lastIndex] = {
                          ...updated[lastIndex],
                          content: updated[lastIndex].content + `\n\n**Modified files:** ${modifiedFiles.join(', ')}`
                        };
                      }
                      return updated;
                    });

                    // Reload app if files were modified
                    setTimeout(() => {
                      setAppKey(prev => prev + 1);
                    }, 500);
                  }
                  setIsStreaming(false);
                  setCurrentStatus("");
                  break;

                case 'error':
                  throw new Error(data.message);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to refine app:', err);
      setChatHistory(prev => {
        if (!hasAddedMessageRef.current) {
          return [...prev, {
            role: 'assistant' as const,
            content: `Sorry, I encountered an error: ${err.message || 'Failed to process your request'}`
          }];
        } else {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex]?.role === 'assistant') {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: `Sorry, I encountered an error: ${err.message || 'Failed to process your request'}`
            };
          }
          return updated;
        }
      });
      setIsStreaming(false);
      setCurrentStatus("");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="text-3xl font-[var(--font-head)] mb-4 uppercase">Loading...</div>
          <div className="w-32 h-4 bg-[var(--muted)] mx-auto border-2 border-[var(--border)]">
            <div className="h-full bg-[var(--primary)] pixel-pulse w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Card>
          <Card.Content className="py-16 text-center">
            <h2 className="text-2xl font-[var(--font-head)] mb-4 uppercase">App Not Found</h2>
            <p className="text-[var(--muted-foreground)] mb-8">
              {error || "The app you're looking for doesn't exist or you don't have access to it."}
            </p>
            <Link href="/apps">
              <Button>Back to Apps</Button>
            </Link>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/apps?tab=drafts">
                <Button variant="ghost" size="icon">
                  <ArrowLeft size={24} />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-[var(--font-head)] uppercase tracking-wider flex items-center gap-3">
                  <Eye size={28} />
                  {app.name} Preview
                </h1>
                <p className="text-xs text-[var(--muted-foreground)] mt-1 uppercase">
                  {app.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowConversationSidebar(!showConversationSidebar)}
                variant="outline"
                size="sm"
              >
                <History size={16} className="mr-2" />
                Chats
              </Button>

              <Button
                onClick={() => setShowChat(!showChat)}
                variant="outline"
                size="sm"
              >
                <MessageSquare size={16} className="mr-2" />
                {showChat ? "Hide" : "Show"} AI Chat
              </Button>

              <Link href={`/apps/${appId}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit size={16} className="mr-2" />
                  Edit Code
                </Button>
              </Link>

              <Button
                onClick={handlePublish}
                variant="success"
                size="sm"
              >
                <Upload size={16} className="mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="px-4 sm:px-6 lg:px-8 py-4 bg-[var(--destructive)]/10 border-b-2 border-[var(--destructive)]">
          <p className="text-sm text-[var(--destructive)] font-bold uppercase">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Section */}
        <div className={`flex flex-col ${showChat ? 'w-2/3' : 'w-full'} bg-[var(--background)]`}>
          <div className="flex-1 p-6 overflow-auto">
            <AppRunner
              key={appKey}
              appId={appId}
              authToken={authToken}
              onError={(error) => setError(error)}
            />
          </div>
        </div>

        {/* AI Chat Section */}
        {showChat && (
          <div className="w-1/3 flex flex-col border-l-4 border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[var(--border)] bg-[var(--primary)]">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} />
                <span className="font-bold uppercase text-sm">AI Assistant</span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="hover:opacity-70 transition-opacity"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm text-[var(--muted-foreground)] uppercase mb-4">
                    Ask AI to refine your app
                  </p>
                  <div className="text-xs text-[var(--muted-foreground)] text-left space-y-2">
                    <p className="font-bold">Examples:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Add a dark mode toggle</li>
                      <li>Make the buttons bigger</li>
                      <li>Add a search feature</li>
                      <li>Change the color scheme</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <>
                  {chatHistory.map((msg, idx) => (
                    <MessageBubble key={idx} message={msg} />
                  ))}

                  {/* Streaming indicator */}
                  {isStreaming && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] p-3 border-2 border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-[2px_2px_0_0_var(--border)]">
                        <div className="text-xs opacity-70 uppercase mb-2">AI Assistant</div>

                        {/* Status */}
                        {currentStatus && (
                          <div className="mb-2 text-xs bg-[var(--muted)] p-2 border border-[var(--border)] opacity-70">
                            <span className="italic">{currentStatus}</span>
                          </div>
                        )}

                        {/* Processing indicator */}
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-[var(--primary)] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-[var(--primary)] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-[var(--primary)] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {currentStatus ? 'Working...' : 'Processing...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t-2 border-[var(--border)]">
              <div className="flex gap-2 items-end">
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit();
                    }
                  }}
                  placeholder="Ask AI to refine your app... (Shift+Enter for new line)"
                  disabled={isStreaming}
                  rows={1}
                  className="flex-1 resize-none overflow-y-auto max-h-32 px-3 py-2 bg-[var(--background)] text-[var(--foreground)] border-2 border-[var(--border)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  style={{
                    minHeight: '42px',
                    height: 'auto',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />
                <Button
                  onClick={handleChatSubmit}
                  disabled={!chatMessage.trim() || isStreaming}
                  size="icon"
                  title="Send message"
                >
                  {isStreaming ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conversation History Sidebar */}
      <ConversationSidebar
        appId={appId}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        isOpen={showConversationSidebar}
        onClose={() => setShowConversationSidebar(false)}
      />
    </div>
  );
}
