"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Clock, Calendar, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"

type TaskPriority = "low" | "medium" | "high"
type TaskStatus = "pending" | "in-progress" | "completed" | "overdue"

interface TaskCardProps {
  title: string
  description?: string
  dueDate?: Date
  priority?: TaskPriority
  status?: TaskStatus
  onAction?: () => void
  actionLabel?: string
  className?: string
}

export default function TaskCard({
  title,
  description,
  dueDate,
  priority = "medium",
  status = "pending",
  onAction,
  actionLabel = "View Details",
  className,
}: TaskCardProps) {
  const priorityColors = {
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  }

  const statusColors = {
    pending: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "in-progress": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  }

  const statusIcons = {
    pending: <Clock size={14} />,
    "in-progress": <ArrowRight size={14} />,
    completed: <CheckCircle2 size={14} />,
    overdue: <AlertCircle size={14} />,
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge className={priorityColors[priority]}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Badge>
        </div>
        {description && <CardDescription className="mt-1.5">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pb-2">
        {dueDate && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar size={14} className="mr-1" />
            <span>Due {formatDate(dueDate)}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Badge variant="outline" className={cn("flex items-center gap-1", statusColors[status])}>
          {statusIcons[status]}
          <span>{status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}</span>
        </Badge>
        {onAction && (
          <Button variant="ghost" size="sm" onClick={onAction} className="gap-1">
            {actionLabel}
            <ArrowRight size={14} />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

