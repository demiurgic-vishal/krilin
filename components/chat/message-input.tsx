"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { SendHorizonal, Mic, MicOff, Paperclip, Sparkles } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface MessageInputProps {
  onSend: (message: string) => void
  onVoiceInput?: () => void
  onFileUpload?: (file: File) => void
  isLoading?: boolean
  placeholder?: string
  className?: string
}

export default function MessageInput({
  onSend,
  onVoiceInput,
  onFileUpload,
  isLoading = false,
  placeholder = "Message your assistant...",
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleVoiceInput = () => {
    setIsRecording(!isRecording)
    if (onVoiceInput) {
      onVoiceInput()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onFileUpload) {
      onFileUpload(e.target.files[0])
    }
  }

  return (
    <div className={cn("flex flex-col gap-2 p-4 border-t bg-background", className)}>
      <div className="flex items-end gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[60px] max-h-[200px] resize-none"
          disabled={isLoading}
        />

        <div className="flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Paperclip size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload file</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

          {onVoiceInput && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    onClick={handleVoiceInput}
                    disabled={isLoading}
                  >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isRecording ? "Stop recording" : "Start recording"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Button onClick={handleSend} disabled={!message.trim() || isLoading} size="icon">
            <SendHorizonal size={18} />
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" size="sm" className="text-xs gap-1.5">
          <Sparkles size={12} />
          Suggest commands
        </Button>
      </div>
    </div>
  )
}

