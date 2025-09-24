"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Mic, Square, Loader2 } from "lucide-react"

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void
  maxDuration?: number // in seconds
  className?: string
}

export default function VoiceRecorder({ onRecordingComplete, maxDuration = 60, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        setIsProcessing(true)

        // Simulate processing time (in a real app, this would be actual processing)
        setTimeout(() => {
          onRecordingComplete(audioBlob)
          setIsProcessing(false)
          setRecordingTime(0)
        }, 1000)

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progressPercentage = (recordingTime / maxDuration) * 100

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center mb-2">
            {isRecording ? (
              <div className="text-lg font-medium">Recording...</div>
            ) : isProcessing ? (
              <div className="text-lg font-medium">Processing audio...</div>
            ) : (
              <div className="text-lg font-medium">Record a message</div>
            )}

            {isRecording && (
              <div className="text-sm text-muted-foreground mt-1">
                {formatTime(recordingTime)} / {formatTime(maxDuration)}
              </div>
            )}
          </div>

          {isRecording && <Progress value={progressPercentage} className="w-full h-2" />}

          <div className="flex justify-center mt-2">
            {isProcessing ? (
              <Button disabled size="lg" className="rounded-full h-16 w-16">
                <Loader2 className="h-6 w-6 animate-spin" />
              </Button>
            ) : isRecording ? (
              <Button onClick={stopRecording} variant="destructive" size="lg" className="rounded-full h-16 w-16">
                <Square className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                onClick={startRecording}
                variant="default"
                size="lg"
                className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
              >
                <Mic className="h-6 w-6" />
              </Button>
            )}
          </div>

          {!isRecording && !isProcessing && (
            <p className="text-sm text-muted-foreground mt-2">Tap the microphone to start recording</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

