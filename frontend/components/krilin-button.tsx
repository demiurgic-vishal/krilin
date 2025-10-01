"use client"

import type React from "react"

interface KrilinButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary"
  className?: string
  type?: "button" | "submit" | "reset"
  disabled?: boolean
}

export default function KrilinButton({ 
  children, 
  onClick, 
  variant = "primary", 
  className = "", 
  type = "button",
  disabled = false
}: KrilinButtonProps) {
  const baseStyles = "relative px-6 py-2 font-pixel border-2 text-sm md:text-base transition-transform active:scale-95"

  const variantStyles = {
    primary: "bg-[#ff6b35] border-[#33272a] text-white hover:bg-[#ff8c61]",
    secondary: "bg-[#ffc15e] border-[#33272a] text-[#33272a] hover:bg-[#ffd68a]",
  }

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {/* Pixel corners */}
      <span className="absolute w-2 h-2 bg-black top-[-2px] left-[-2px]"></span>
      <span className="absolute w-2 h-2 bg-black top-[-2px] right-[-2px]"></span>
      <span className="absolute w-2 h-2 bg-black bottom-[-2px] left-[-2px]"></span>
      <span className="absolute w-2 h-2 bg-black bottom-[-2px] right-[-2px]"></span>

      {children}
    </button>
  )
}
