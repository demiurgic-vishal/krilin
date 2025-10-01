import type React from "react"
import { cn } from "@/lib/utils"

interface KrilinChatContainerProps {
  children: React.ReactNode
  className?: string
}

export default function KrilinChatContainer({ children, className }: KrilinChatContainerProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-[calc(100vh-20rem)] md:h-[calc(100vh-18rem)] rounded-none border-4 border-[#33272a] bg-[#fffaeb] overflow-hidden",
        className,
      )}
    >
      <div className="bg-[#ff6b35] border-b-4 border-[#33272a] p-2">
        <h2 className="text-white text-center">COMMUNICATION LOG</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
    </div>
  )
}

