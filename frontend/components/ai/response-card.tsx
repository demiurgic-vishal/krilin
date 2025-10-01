"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Copy, Download, ExternalLink, ThumbsUp, ThumbsDown } from "lucide-react"

type ResponseType = "text" | "code"

interface ResponseCardProps {
  title: string
  content: string
  type?: ResponseType
  onCopy?: () => void
  onDownload?: () => void
  onFeedback?: (isPositive: boolean) => void
  className?: string
}

export default function ResponseCard({
  title,
  content,
  type = "text",
  onCopy,
  onDownload,
  onFeedback,
  className,
}: ResponseCardProps) {
  const [feedback, setFeedback] = React.useState<boolean | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    if (onCopy) onCopy()
  }

  const handleDownload = () => {
    if (onDownload) onDownload()
  }

  const handleFeedback = (isPositive: boolean) => {
    setFeedback(isPositive)
    if (onFeedback) onFeedback(isPositive)
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{type === "code" ? "Generated code snippet" : "AI generated response"}</CardDescription>
      </CardHeader>
      <CardContent>
        {type === "code" ? (
          <pre className="p-4 bg-muted rounded-md overflow-x-auto">
            <code className="text-sm">{content}</code>
          </pre>
        ) : (
          <div className="prose prose-sm max-w-none">{content}</div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
            <Copy size={14} />
            Copy
          </Button>

          {onDownload && (
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1">
              <Download size={14} />
              Download
            </Button>
          )}

          {type === "code" && (
            <Button variant="outline" size="sm" className="gap-1" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} />
                Open in Editor
              </a>
            </Button>
          )}
        </div>

        {onFeedback && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback(true)}
              className={cn(
                "gap-1",
                feedback === true && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
              )}
            >
              <ThumbsUp size={14} />
              Helpful
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback(false)}
              className={cn("gap-1", feedback === false && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300")}
            >
              <ThumbsDown size={14} />
              Not Helpful
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

