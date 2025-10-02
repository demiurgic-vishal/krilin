"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import KrilinLogo from "@/components/krilin-logo"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "HOME" },
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/chat", label: "CHAT" },
  { href: "/goals", label: "GOALS" },
  { href: "/workflows", label: "WORKFLOWS" },
  { href: "/integrations", label: "INTEGRATIONS" },
  { href: "/community", label: "COMMUNITY" },
  { href: "/settings", label: "SETTINGS" },
]

export default function EnhancedKrilinHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="bg-[var(--secondary)] border-b-2 border-[var(--border)] relative z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 py-2">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <KrilinLogo className="w-8 h-8 flex-shrink-0" />
            <div className="font-pixel text-[var(--secondary-foreground)]">
              <h1 className="text-lg tracking-wider leading-tight">KRILIN.AI</h1>
              <p className="text-[10px] text-[var(--primary)] leading-tight">LEVEL UP MIND & MATTER</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "font-pixel text-sm transition-all px-3 py-2 border-2 border-transparent",
                  pathname === item.href
                    ? "text-[var(--primary-foreground)] bg-[var(--primary)] border-[var(--border)] shadow-sm"
                    : "text-[var(--secondary-foreground)] hover:text-[var(--primary-foreground)] hover:bg-[var(--primary)] hover:border-[var(--border)] hover:shadow-sm"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[var(--secondary-foreground)] hover:text-[var(--primary)] transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="absolute top-full left-0 right-0 bg-[var(--secondary)] border-b-2 border-[var(--border)] lg:hidden shadow-lg">
            <nav className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "font-pixel text-sm transition-all px-4 py-3 border-2 border-transparent block",
                      pathname === item.href
                        ? "text-[var(--primary-foreground)] bg-[var(--primary)] border-[var(--border)] shadow-sm"
                        : "text-[var(--secondary-foreground)] hover:text-[var(--primary-foreground)] hover:bg-[var(--primary)] hover:border-[var(--border)] hover:shadow-sm"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}