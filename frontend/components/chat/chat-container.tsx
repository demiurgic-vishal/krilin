import type React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface ChatContainerProps {
  children: React.ReactNode
  className?: string
}

export default function ChatContainer({ children, className }: ChatContainerProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] rounded-md border bg-background",
        className,
      )}
    >
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">{children}</div>
      </ScrollArea>
    </div>
  )
}

