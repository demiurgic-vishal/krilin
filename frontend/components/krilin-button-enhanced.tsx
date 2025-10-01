"use client"

import type React from "react"
import { useState } from "react"
import { PixelCorners } from "@/components/ui/pixel-corners"
import { usePixelAnimation, useGlitchEffect } from "@/hooks/use-animations"
import { animationPresets, transitionPresets } from "@/lib/animations"

interface KrilinButtonEnhancedProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "accent" | "danger" | "success"
  size?: "sm" | "md" | "lg"
  className?: string
  type?: "button" | "submit" | "reset"
  disabled?: boolean
  animation?: "none" | "pulse" | "glitch" | "bounce" | "levelUp"
  ripple?: boolean
  sound?: boolean
}

export default function KrilinButtonEnhanced({ 
  children, 
  onClick, 
  variant = "primary",
  size = "md",
  className = "", 
  type = "button",
  disabled = false,
  animation = "none",
  ripple = true,
  sound = false
}: KrilinButtonEnhancedProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  const { glitchClass, triggerGlitch } = useGlitchEffect('low')
  
  const sizeStyles = {
    sm: "px-4 py-1 text-xs",
    md: "px-6 py-2 text-sm md:text-base",
    lg: "px-8 py-3 text-base md:text-lg"
  }
  
  const variantStyles = {
    primary: "bg-[#ff6b35] border-[#33272a] text-white hover:bg-[#ff8c61] hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.6)]",
    secondary: "bg-[#ffc15e] border-[#33272a] text-[#33272a] hover:bg-[#ffd68a] hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.6)]",
    accent: "bg-[#4ecdc4] border-[#33272a] text-white hover:bg-[#6dd8d0] hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.6)]",
    danger: "bg-red-500 border-[#33272a] text-white hover:bg-red-600 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.6)]",
    success: "bg-green-500 border-[#33272a] text-white hover:bg-green-600 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.6)]"
  }
  
  const animationMap = {
    none: "",
    pulse: "hover:animate-pixelPulse",
    glitch: glitchClass,
    bounce: "hover:animate-pixelBounce",
    levelUp: "hover:animate-levelUp"
  }
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    
    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const newRipple = { x, y, id: Date.now() }
      
      setRipples(prev => [...prev, newRipple])
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id))
      }, 600)
    }
    
    if (animation === "glitch") {
      triggerGlitch()
    }
    
    if (sound) {
      const audio = new Audio('/sounds/pixel-click.wav')
      audio.volume = 0.3
      audio.play().catch(() => {})
    }
    
    onClick?.()
  }
  
  const handleMouseDown = () => setIsPressed(true)
  const handleMouseUp = () => setIsPressed(false)
  
  const baseStyles = `
    relative font-pixel border-2 
    ${transitionPresets.bouncy}
    ${animationPresets.interactive.hover}
    ${isPressed ? 'scale-95 brightness-90' : ''}
    shadow-[4px_4px_0_0_rgba(0,0,0,0.8)]
    overflow-hidden
  `
  
  return (
    <button 
      type={type}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      disabled={disabled}
      className={`
        ${baseStyles} 
        ${sizeStyles[size]}
        ${variantStyles[variant]} 
        ${animationMap[animation]}
        ${className} 
        ${disabled ? "opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.8)]" : "cursor-pointer"}
      `}
    >
      <PixelCorners 
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'} 
        animate={animation === 'pulse'}
      />
      
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-pixelGrow pointer-events-none"
          style={{
            left: ripple.x - 20,
            top: ripple.y - 20,
            width: 40,
            height: 40,
          }}
        />
      ))}
      
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
  )
}