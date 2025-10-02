"use client"

import React, { useState } from "react"
import { Button } from "@/components/retroui/Button"
import { Textarea } from "@/components/retroui/Textarea"
import { cn } from "@/lib/utils"
import { SendHorizonal, Mic, Paperclip, Sparkles } from "lucide-react"

interface KrilinMessageInputProps {
  onSend: (message: string) => void
  onVoiceInput?: () => void
  onFileUpload?: (file: File) => void
  isLoading?: boolean
  className?: string
}

export default function KrilinMessageInput({
  onSend,
  onVoiceInput,
  onFileUpload,
  isLoading = false,
  className,
}: KrilinMessageInputProps) {
  const [message, setMessage] = useState("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim())
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onFileUpload) {
      onFileUpload(e.target.files[0])
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-end gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your message..."
          className="flex-1 min-h-[60px] max-h-[200px] resize-none"
          disabled={isLoading}
        />

        <div className="flex flex-col gap-2">
          {onFileUpload && (
            <>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="h-10 w-10 p-0 flex items-center justify-center"
              >
                <Paperclip size={18} />
              </Button>

              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </>
          )}

          {onVoiceInput && (
            <Button
              variant="secondary"
              size="icon"
              onClick={onVoiceInput}
              disabled={isLoading}
              className="h-10 w-10 p-0 flex items-center justify-center"
            >
              <Mic size={18} />
            </Button>
          )}

          <Button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            size="icon"
            className="h-10 w-10 p-0 flex items-center justify-center"
          >
            <SendHorizonal size={18} />
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <Button variant="secondary" className="text-xs gap-1.5">
          <Sparkles size={12} />
          POWER COMMANDS
        </Button>
      </div>
    </div>
  )
}

