"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { ChevronRight, ArrowLeft } from "lucide-react"
import EnhancedKrilinHeader from "@/components/enhanced-krilin-header"
import KrilinWisdomStrip from "@/components/layout/krilin-wisdom-strip"
import KrilinFooter from "@/components/krilin-footer"
import KrilinButton from "@/components/krilin-button"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface KrilinPageLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  showBackButton?: boolean
  backHref?: string
  footerSubtitle?: string
  className?: string
  containerSize?: "sm" | "md" | "lg" | "xl" | "full"
  headerContent?: ReactNode
}

const containerSizes = {
  sm: "max-w-2xl",
  md: "max-w-4xl", 
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none"
}

export default function KrilinPageLayout({
  children,
  title,
  subtitle,
  breadcrumbs,
  showBackButton = false,
  backHref = "/",
  footerSubtitle,
  className,
  containerSize = "lg",
  headerContent
}: KrilinPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fffaeb] font-pixel flex flex-col">
      <EnhancedKrilinHeader />
      <KrilinWisdomStrip />

      <main className={cn("flex-1", className)}>
        <div className={cn("container mx-auto p-4 md:p-8", containerSizes[containerSize])}>
          {/* Back Button */}
          {showBackButton && (
            <div className="mb-4">
              <Link href={backHref}>
                <KrilinButton variant="secondary" className="gap-2">
                  <ArrowLeft size={16} />
                  BACK
                </KrilinButton>
              </Link>
            </div>
          )}

          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="mb-4" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm font-pixel">
                {breadcrumbs.map((item, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && <ChevronRight size={14} className="mx-2 text-[#594a4e]" />}
                    {item.href ? (
                      <Link 
                        href={item.href} 
                        className="text-[#594a4e] hover:text-[#ff6b35] transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-[#33272a] font-bold">{item.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Page Header */}
          {(title || subtitle || headerContent) && (
            <header className="mb-8">
              {title && (
                <div className="pixel-border bg-[#594a4e] p-1 mb-4">
                  <div className="bg-[#33272a] text-white p-4 text-center">
                    <h1 className="text-xl md:text-2xl font-pixel">{title}</h1>
                  </div>
                </div>
              )}
              
              {subtitle && (
                <p className="text-center text-[#594a4e] mb-4 text-sm md:text-base">
                  {subtitle}
                </p>
              )}

              {headerContent && (
                <div className="mt-4">
                  {headerContent}
                </div>
              )}
            </header>
          )}

          {/* Main Content */}
          <div className="space-y-8">
            {children}
          </div>
        </div>
      </main>

      <KrilinFooter subtitle={footerSubtitle} />
    </div>
  )
}