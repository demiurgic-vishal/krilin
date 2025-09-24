"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { FileUp, File, X, Check, Loader2 } from "lucide-react"

interface FileProcessorProps {
  onFileProcessed: (result: any) => void
  acceptedFileTypes?: string
  maxFileSizeMB?: number
  className?: string
}

export default function FileProcessor({
  onFileProcessed,
  acceptedFileTypes = ".pdf,.docx,.txt",
  maxFileSizeMB = 10,
  className,
}: FileProcessorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file: File) => {
    setError(null)

    // Check file size
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      setError(`File size exceeds the ${maxFileSizeMB}MB limit`)
      return
    }

    // Check file type
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`
    const acceptedTypes = acceptedFileTypes.split(",")

    if (!acceptedTypes.includes(fileExtension) && acceptedTypes[0] !== "*") {
      setError(`File type not supported. Please upload ${acceptedFileTypes}`)
      return
    }

    setFile(file)
  }

  const processFile = () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(0)

    // Simulate file processing with progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 10

        if (newProgress >= 100) {
          clearInterval(interval)

          // Simulate completion after reaching 100%
          setTimeout(() => {
            setIsProcessing(false)
            onFileProcessed({
              fileName: file.name,
              fileSize: file.size,
              content: "Processed file content would be here",
            })
          }, 500)

          return 100
        }

        return newProgress
      })
    }, 300)
  }

  const removeFile = () => {
    setFile(null)
    setError(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Process Document</CardTitle>
        <CardDescription>Upload a document to analyze with your AI assistant</CardDescription>
      </CardHeader>
      <CardContent>
        {!file ? (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50",
              error && "border-destructive/50 bg-destructive/5",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept={acceptedFileTypes}
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center gap-2">
              <FileUp className="h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-medium">{isDragging ? "Drop file here" : "Drag & drop file here"}</h3>
              <p className="text-sm text-muted-foreground">or click to browse</p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports {acceptedFileTypes} up to {maxFileSizeMB}MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                <File size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>

              {!isProcessing && (
                <Button variant="ghost" size="icon" onClick={removeFile} className="h-8 w-8">
                  <X size={16} />
                </Button>
              )}
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </CardContent>
      <CardFooter>
        <Button onClick={processFile} disabled={!file || isProcessing} className="w-full gap-2">
          {isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check size={16} />
              Process Document
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

