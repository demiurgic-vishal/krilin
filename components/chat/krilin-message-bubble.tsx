"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Copy } from "lucide-react"
import KrilinButton from "@/components/krilin-button"

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

  return (
    <div className={cn("group", isUser ? "flex flex-row-reverse" : "flex flex-row", className)}>
      <div className={cn("max-w-[80%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "border-4 border-[#33272a] p-3",
            isUser ? "bg-[#ffc15e] text-[#33272a]" : "bg-[#ff6b35] text-white",
          )}
        >
          {/* Pixel corners */}
          <div className="absolute w-4 h-4 bg-[#33272a] top-[-4px] left-[-4px]"></div>
          <div className="absolute w-4 h-4 bg-[#33272a] top-[-4px] right-[-4px]"></div>
          <div className="absolute w-4 h-4 bg-[#33272a] bottom-[-4px] left-[-4px]"></div>
          <div className="absolute w-4 h-4 bg-[#33272a] bottom-[-4px] right-[-4px]"></div>

          {isLoading ? (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
              <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
              <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{content}</div>
          )}
        </div>

        {timestamp && <div className="text-xs mt-1 px-1">{timestamp}</div>}
      </div>

      {!isUser && !isLoading && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <KrilinButton
            variant="secondary"
            onClick={copyToClipboard}
            className="h-8 w-8 p-0 flex items-center justify-center"
          >
            <Copy size={14} />
          </KrilinButton>
        </div>
      )}
    </div>
  )
}

