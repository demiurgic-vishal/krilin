"use client"

import React, { useState } from "react"
import KrilinButton from "@/components/krilin-button"
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
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your message..."
          className="flex-1 min-h-[60px] max-h-[200px] resize-none border-4 border-[#33272a] bg-white p-2 focus:outline-none"
          disabled={isLoading}
        />

        <div className="flex flex-col gap-2">
          {onFileUpload && (
            <>
              <KrilinButton
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="h-10 w-10 p-0 flex items-center justify-center"
              >
                <Paperclip size={18} />
              </KrilinButton>

              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </>
          )}

          {onVoiceInput && (
            <KrilinButton
              variant="secondary"
              onClick={onVoiceInput}
              disabled={isLoading}
              className="h-10 w-10 p-0 flex items-center justify-center"
            >
              <Mic size={18} />
            </KrilinButton>
          )}

          <KrilinButton
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className="h-10 w-10 p-0 flex items-center justify-center"
          >
            <SendHorizonal size={18} />
          </KrilinButton>
        </div>
      </div>

      <div className="flex justify-center">
        <KrilinButton variant="secondary" className="text-xs gap-1.5">
          <Sparkles size={12} />
          POWER COMMANDS
        </KrilinButton>
      </div>
    </div>
  )
}

