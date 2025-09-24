"use client"

import type React from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar, Clock, FileText, Mail, Search, ShoppingCart, Lightbulb } from "lucide-react"

interface CommandOption {
  icon: React.ReactNode
  label: string
  description: string
  command: string
}

interface CommandPaletteProps {
  onSelect: (command: string) => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export default function CommandPalette({ onSelect, isOpen, setIsOpen }: CommandPaletteProps) {
  const commands: CommandOption[] = [
    {
      icon: <Calendar size={16} />,
      label: "Schedule",
      description: "Create a new calendar event",
      command: "/schedule",
    },
    {
      icon: <Clock size={16} />,
      label: "Reminder",
      description: "Set a reminder for later",
      command: "/remind",
    },
    {
      icon: <FileText size={16} />,
      label: "Summarize",
      description: "Summarize a document or text",
      command: "/summarize",
    },
    {
      icon: <Mail size={16} />,
      label: "Email",
      description: "Draft an email",
      command: "/email",
    },
    {
      icon: <Search size={16} />,
      label: "Research",
      description: "Research a topic",
      command: "/research",
    },
    {
      icon: <ShoppingCart size={16} />,
      label: "Shopping",
      description: "Create a shopping list",
      command: "/shopping",
    },
    {
      icon: <Lightbulb size={16} />,
      label: "Ideas",
      description: "Generate creative ideas",
      command: "/ideas",
    },
  ]

  return (
    <Command className="rounded-lg border shadow-md" shouldFilter={true}>
      <CommandInput placeholder="Search commands..." />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          {commands.map((cmd) => (
            <CommandItem
              key={cmd.command}
              onSelect={() => {
                onSelect(cmd.command)
                setIsOpen(false)
              }}
              className="flex items-center gap-2 p-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-muted">{cmd.icon}</div>
              <div className="flex flex-col">
                <span className="font-medium">{cmd.label}</span>
                <span className="text-xs text-muted-foreground">{cmd.description}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

