"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Calendar, FileText, Mail, Search, ShoppingCart, Sparkles, Lightbulb, Clock } from "lucide-react"

interface QuickAction {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: "default" | "outline" | "secondary" | "ghost"
}

interface QuickActionsProps {
  actions?: QuickAction[]
  className?: string
}

export default function QuickActions({ actions, className }: QuickActionsProps) {
  // Default actions if none provided
  const defaultActions: QuickAction[] = [
    {
      icon: <Calendar size={16} />,
      label: "Schedule",
      onClick: () => console.log("Schedule"),
      variant: "outline",
    },
    {
      icon: <Clock size={16} />,
      label: "Reminder",
      onClick: () => console.log("Reminder"),
      variant: "outline",
    },
    {
      icon: <FileText size={16} />,
      label: "Summarize",
      onClick: () => console.log("Summarize"),
      variant: "outline",
    },
    {
      icon: <Mail size={16} />,
      label: "Email",
      onClick: () => console.log("Email"),
      variant: "outline",
    },
    {
      icon: <Search size={16} />,
      label: "Research",
      onClick: () => console.log("Research"),
      variant: "outline",
    },
    {
      icon: <ShoppingCart size={16} />,
      label: "Shopping",
      onClick: () => console.log("Shopping"),
      variant: "outline",
    },
    {
      icon: <Lightbulb size={16} />,
      label: "Ideas",
      onClick: () => console.log("Ideas"),
      variant: "outline",
    },
    {
      icon: <Sparkles size={16} />,
      label: "More",
      onClick: () => console.log("More"),
      variant: "secondary",
    },
  ]

  const displayActions = actions || defaultActions

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-xl">Quick Actions</CardTitle>
        <CardDescription>Get things done faster</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {displayActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "outline"}
              className="h-auto flex-col py-3 px-2 gap-2 justify-center items-center"
              onClick={action.onClick}
            >
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                {action.icon}
              </div>
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

