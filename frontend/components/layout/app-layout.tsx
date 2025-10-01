"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MessageSquare, Settings, Calendar, FileText, Home, Menu, X, User, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMediaQuery } from "@/hooks/use-mobile"

// NOTE: This component is currently unused. All pages use KrilinHeader instead.
// Consider removing or refactoring to match Krilin theme.

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const navItems = [
    { icon: <Home size={20} />, label: "Dashboard", href: "/" },
    { icon: <MessageSquare size={20} />, label: "Chat", href: "/chat" },
    { icon: <Calendar size={20} />, label: "Calendar", href: "/calendar" },
    { icon: <FileText size={20} />, label: "Documents", href: "/documents" },
    { icon: <Settings size={20} />, label: "Settings", href: "/settings" },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Overlay */}
      {isMobile && sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50" onClick={closeSidebar} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 flex-shrink-0 flex-col bg-card border-r transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          isMobile && !sidebarOpen && "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b">
          <h1 className="font-semibold text-lg">AI Assistant</h1>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <X size={18} />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-auto py-4 px-3">
          <nav className="space-y-1">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                onClick={closeSidebar}
              >
                <span className="text-muted-foreground">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="text-sm font-normal">User Name</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User size={16} className="mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings size={16} className="mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut size={16} className="mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-14 border-b flex items-center px-4 gap-4">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu size={18} />
            </Button>
          )}
          <div className="flex-1 font-medium">{isMobile ? "AI Assistant" : "Welcome back, User"}</div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

