"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { PixelCorners } from "@/components/ui/pixel-corners"
import { useIntersectionAnimation, useParallaxPixel, useRandomPixelMovement } from "@/hooks/use-animations"
import { animationPresets, transitionPresets, pixelEffects } from "@/lib/animations"

interface KrilinCardEnhancedProps {
  title?: string
  children: React.ReactNode
  className?: string
  variant?: "default" | "elevated" | "interactive" | "glowing"
  animation?: "none" | "fadeIn" | "slideIn" | "bounce" | "grow"
  headerColor?: string
  parallax?: boolean
  floating?: boolean
  scanlines?: boolean
  crtEffect?: boolean
}

export default function KrilinCardEnhanced({ 
  title, 
  children, 
  className = "",
  variant = "default",
  animation = "fadeIn",
  headerColor = "#ff6b35",
  parallax = false,
  floating = false,
  scanlines = false,
  crtEffect = false
}: KrilinCardEnhancedProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [glowIntensity, setGlowIntensity] = useState(0)
  
  const animationMap = {
    none: "",
    fadeIn: "animate-pixelFade",
    slideIn: "animate-slideInLeft",
    bounce: "animate-pixelBounce",
    grow: "animate-pixelGrow"
  }
  
  const { ref: intersectionRef, animationClass } = useIntersectionAnimation(
    animationMap[animation],
    { threshold: 0.2 }
  )
  
  const parallaxProps = useParallaxPixel(0.3)
  const floatingProps = useRandomPixelMovement(5, 3000)
  
  const variantStyles = {
    default: "bg-[#fffaeb] border-4 border-[#33272a] shadow-[4px_4px_0_0_rgba(0,0,0,0.8)]",
    elevated: `
      bg-[#fffaeb] border-4 border-[#33272a] 
      shadow-[8px_8px_0_0_rgba(0,0,0,0.8)]
      hover:shadow-[10px_10px_0_0_rgba(0,0,0,0.6)]
      hover:translate-x-[-2px] hover:translate-y-[-2px]
    `,
    interactive: `
      bg-[#fffaeb] border-4 border-[#33272a]
      shadow-[4px_4px_0_0_rgba(0,0,0,0.8)]
      hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.6)]
      hover:scale-[1.02]
      cursor-pointer
    `,
    glowing: `
      bg-[#fffaeb] border-4 border-[#33272a]
      shadow-[4px_4px_0_0_rgba(0,0,0,0.8),0_0_20px_rgba(255,107,53,${glowIntensity})]
    `
  }
  
  useEffect(() => {
    if (variant === 'glowing') {
      const interval = setInterval(() => {
        setGlowIntensity(prev => {
          const newValue = prev + 0.1
          return newValue > 0.5 ? 0 : newValue
        })
      }, 100)
      return () => clearInterval(interval)
    }
  }, [variant])
  
  const containerProps = parallax ? parallaxProps : (floating ? floatingProps : {})
  
  return (
    <div 
      ref={intersectionRef as any}
      className={`
        relative 
        ${variantStyles[variant]}
        ${transitionPresets.smooth}
        ${animationClass}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...(containerProps as any)}
    >
      <PixelCorners size="md" animate={isHovered && variant === 'interactive'} />
      
      {scanlines && (
        <div 
          className="absolute inset-0 pointer-events-none z-20 opacity-50"
          style={pixelEffects.scanlineEffect()}
        />
      )}
      
      {crtEffect && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
          <div className="absolute inset-0 animate-scanline opacity-10">
            <div className="h-px bg-white/50" />
          </div>
        </div>
      )}
      
      {title && (
        <div 
          className={`
            border-b-4 border-[#33272a] p-2 relative overflow-hidden
            ${transitionPresets.smooth}
          `}
          style={{ backgroundColor: headerColor }}
        >
          <h3 className="font-pixel text-white text-center relative z-10">
            {title}
          </h3>
          
          {isHovered && (
            <div className="absolute inset-0 animate-retroWave">
              <div className="h-full w-4 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          )}
        </div>
      )}
      
      <div className={`p-4 relative ${isHovered ? 'animate-none' : ''}`}>
        {children}
      </div>
      
      {isHovered && variant === 'interactive' && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 bg-[#ff6b35] animate-pixelRotate" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-[#ffc15e] animate-pixelRotate" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#4ecdc4] animate-pixelRotate" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#ff6b35] animate-pixelRotate" style={{ animationDelay: '1.5s' }} />
        </>
      )}
    </div>
  )
}