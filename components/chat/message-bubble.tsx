"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Copy, Check, Bookmark, BookmarkCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type MessageRole = "user" | "assistant" | "system"

interface MessageBubbleProps {
  content: string
  role: MessageRole
  timestamp?: string
  avatarSrc?: string
  isLoading?: boolean
  className?: string
}

export default function MessageBubble({
  content,
  role,
  timestamp,
  avatarSrc,
  isLoading = false,
  className,
}: MessageBubbleProps) {
  const [isCopied, setIsCopied] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)

  const isUser = role === "user"

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const saveMessage = () => {
    // Implementation for saving message
    setIsSaved(!isSaved)
  }

  return (
    <div className={cn("flex items-start gap-3 group", isUser ? "flex-row-reverse" : "flex-row", className)}>
      <Avatar className={cn("h-8 w-8 mt-0.5", isUser ? "bg-primary" : "bg-muted")}>
        <AvatarImage src={avatarSrc} />
        <AvatarFallback>{isUser ? "U" : "AI"}</AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col max-w-[80%] md:max-w-[70%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-lg px-4 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-none"
              : "bg-muted text-muted-foreground rounded-tl-none",
          )}
        >
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

        {timestamp && <span className="text-xs text-muted-foreground mt-1">{timestamp}</span>}
      </div>

      {!isUser && !isLoading && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyToClipboard}>
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isCopied ? "Copied!" : "Copy message"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveMessage}>
                  {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isSaved ? "Saved" : "Save message"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}

