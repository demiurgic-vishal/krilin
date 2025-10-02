"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Copy } from "lucide-react"
import { Button } from "@/components/retroui/Button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"

export type MessageRole = "user" | "assistant" | "system"

interface KrilinMessageBubbleProps {
  content: string
  role: MessageRole
  timestamp?: string
  isLoading?: boolean
  className?: string
}

export default function KrilinMessageBubble({
  content,
  role,
  timestamp,
  isLoading = false,
  className,
}: KrilinMessageBubbleProps) {
  const [isCopied, setIsCopied] = React.useState(false)

  const isUser = role === "user"

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Custom markdown components with Krillin styling
  const markdownComponents: Components = {
    // Headings
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold font-pixel mb-3 mt-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-bold font-pixel mb-2 mt-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-bold mb-2 mt-2">{children}</h3>
    ),
    // Paragraphs
    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
    // Lists
    ul: ({ children }) => <ul className="list-disc ml-6 mb-3 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal ml-6 mb-3 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:opacity-80 font-semibold"
      >
        {children}
      </a>
    ),
    // Code blocks
    code: ({ children, className }) => {
      const isInline = !className
      return isInline ? (
        <code className="bg-[var(--muted)] px-1.5 py-0.5 rounded font-mono text-sm">
          {children}
        </code>
      ) : (
        <code className="block bg-[var(--muted)] p-3 rounded font-mono text-sm overflow-x-auto mb-3 border-2 border-[var(--border)]">
          {children}
        </code>
      )
    },
    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-[var(--border)] pl-4 italic my-3">
        {children}
      </blockquote>
    ),
    // Strong/Bold
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    // Emphasis/Italic
    em: ({ children }) => <em className="italic">{children}</em>,
    // Horizontal rule
    hr: () => <hr className="border-t-2 border-[var(--border)] my-4" />,
  }

  return (
    <div className={cn("group", isUser ? "flex flex-row-reverse" : "flex flex-row", className)}>
      <div className={cn("max-w-[80%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "border-2 border-[var(--border)] p-3 shadow-md relative",
            isUser ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--card)] text-[var(--card-foreground)]",
          )}
        >

          {isLoading || (!isUser && !content) ? (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
              <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
              <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
            </div>
          ) : (
            <div className="markdown-content leading-relaxed">
              {isUser ? (
                // For user messages, just show plain text
                <div className="whitespace-pre-wrap">{content}</div>
              ) : (
                // For AI messages, render markdown
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {content}
                </ReactMarkdown>
              )}
            </div>
          )}
        </div>

        {timestamp && <div className="text-xs mt-1 px-1">{timestamp}</div>}
      </div>

      {!isUser && !isLoading && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={copyToClipboard}
            className="h-8 w-8 p-0 flex items-center justify-center"
          >
            <Copy size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}

