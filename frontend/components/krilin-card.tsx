import type React from "react"

interface KrilinCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function KrilinCard({ title, children, className = "" }: KrilinCardProps) {
  return (
    <div className={`bg-[#fffaeb] border-4 border-[#33272a] relative ${className}`}>
      {/* Pixel corners */}
      <div className="absolute w-4 h-4 bg-[#33272a] top-[-4px] left-[-4px]"></div>
      <div className="absolute w-4 h-4 bg-[#33272a] top-[-4px] right-[-4px]"></div>
      <div className="absolute w-4 h-4 bg-[#33272a] bottom-[-4px] left-[-4px]"></div>
      <div className="absolute w-4 h-4 bg-[#33272a] bottom-[-4px] right-[-4px]"></div>

      {/* Header */}
      <div className="bg-[#ff6b35] border-b-4 border-[#33272a] p-2">
        <h3 className="font-pixel text-white text-center">{title}</h3>
      </div>

      {/* Content */}
      <div className="p-4">{children}</div>
    </div>
  )
} 