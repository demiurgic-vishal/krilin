"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MessageSquare, ArrowRight } from "lucide-react"

interface Conversation {
  id: string
  title: string
  preview: string
  timestamp: Date
  avatarSrc?: string
}

interface RecentConversationsProps {
  conversations: Conversation[]
  onSelect: (id: string) => void
  className?: string
}

export default function RecentConversations({ conversations, onSelect, className }: RecentConversationsProps) {
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } else if (diffInDays === 1) {
      return "Yesterday"
    } else if (diffInDays < 7) {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
      }).format(date)
    } else {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(date)
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <MessageSquare size={18} />
          Recent Conversations
        </CardTitle>
        <CardDescription>Continue where you left off</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No recent conversations</p>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onSelect(conversation.id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conversation.avatarSrc} />
                  <AvatarFallback className="bg-primary/10 text-primary">{conversation.title.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatDate(conversation.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">{conversation.preview}</p>
                </div>
              </div>
            ))
          )}

          {conversations.length > 0 && (
            <Button variant="ghost" size="sm" className="w-full mt-2 gap-1">
              View all conversations
              <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

