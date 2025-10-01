"use client"

import { useState, useEffect } from "react"
import { PixelCorners } from "@/components/ui/pixel-corners"
import { usePowerMeter } from "@/hooks/use-animations"

interface PixelLoaderProps {
  variant?: "bar" | "dots" | "spinner" | "glitch" | "matrix"
  size?: "sm" | "md" | "lg"
  color?: string
  showPercentage?: boolean
  value?: number
  max?: number
  text?: string
}

export function PixelLoader({ 
  variant = "bar",
  size = "md",
  color = "#ff6b35",
  showPercentage = false,
  value = 0,
  max = 100,
  text = "Loading..."
}: PixelLoaderProps) {
  const [dots, setDots] = useState("")
  const [matrixChars, setMatrixChars] = useState<string[]>([])
  const { percentage, colorClass, isCritical } = usePowerMeter(value || 50, max)
  
  const sizeMap = {
    sm: { width: "w-32", height: "h-2", dotSize: "w-2 h-2" },
    md: { width: "w-48", height: "h-4", dotSize: "w-3 h-3" },
    lg: { width: "w-64", height: "h-6", dotSize: "w-4 h-4" }
  }
  
  useEffect(() => {
    if (variant === "dots") {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? "" : prev + ".")
      }, 500)
      return () => clearInterval(interval)
    }
    
    if (variant === "matrix") {
      const chars = "01アイウエオカキクケコサシスセソタチツテト"
      const interval = setInterval(() => {
        const newChars = Array.from({ length: 8 }, () => 
          chars[Math.floor(Math.random() * chars.length)]
        )
        setMatrixChars(newChars)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [variant])
  
  if (variant === "bar") {
    return (
      <div className="relative inline-block">
        <div className={`${sizeMap[size].width} ${sizeMap[size].height} bg-[#33272a] relative overflow-hidden`}>
          <PixelCorners size={size === "sm" ? "sm" : "md"} />
          
          <div 
            className={`h-full ${colorClass} transition-all duration-500 relative`}
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-retroWave" />
            
            {isCritical && (
              <div className="absolute inset-0 animate-pixelFlicker" />
            )}
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            {showPercentage && (
              <span className="font-pixel text-xs text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)]">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
          
          <div className="absolute inset-0 pointer-events-none">
            <div className="h-full w-full bg-gradient-to-b from-white/10 to-transparent" />
          </div>
        </div>
        
        {text && (
          <p className="font-pixel text-xs mt-2 text-center animate-blink">
            {text}
          </p>
        )}
      </div>
    )
  }
  
  if (variant === "dots") {
    return (
      <div className="flex items-center gap-2">
        <span className="font-pixel text-sm" style={{ color }}>
          {text}
        </span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${sizeMap[size].dotSize} bg-current animate-pixelBounce`}
              style={{
                color,
                animationDelay: `${i * 0.2}s`,
                opacity: i < dots.length ? 1 : 0.3
              }}
            />
          ))}
        </div>
      </div>
    )
  }
  
  if (variant === "spinner") {
    const spinnerSize = size === "sm" ? "w-6 h-6" : size === "lg" ? "w-12 h-12" : "w-8 h-8"
    
    return (
      <div className="flex flex-col items-center gap-2">
        <div className={`${spinnerSize} relative`}>
          <div className={`${spinnerSize} border-4 border-[#33272a] animate-pixelRotate`}>
            <div className="absolute inset-[-4px] border-4 border-t-transparent border-r-transparent border-[#ff6b35]" />
          </div>
          
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <div
              key={deg}
              className="absolute w-1 h-1 bg-[#ffc15e] animate-pixelPulse"
              style={{
                transform: `rotate(${deg}deg) translateY(-200%)`,
                transformOrigin: 'center',
                left: '50%',
                top: '50%',
                marginLeft: '-2px',
                marginTop: '-2px',
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
        {text && (
          <span className="font-pixel text-xs" style={{ color }}>
            {text}
          </span>
        )}
      </div>
    )
  }
  
  if (variant === "glitch") {
    return (
      <div className="relative inline-block">
        <div className="font-pixel text-lg relative">
          <span className="relative z-10" style={{ color }}>
            {text}
          </span>
          <span 
            className="absolute top-0 left-0 animate-glitch opacity-80"
            style={{ 
              color: '#ff6b35',
              clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)'
            }}
          >
            {text}
          </span>
          <span 
            className="absolute top-0 left-0 animate-glitch opacity-80"
            style={{ 
              color: '#4ecdc4',
              clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
              animationDelay: '0.1s'
            }}
          >
            {text}
          </span>
        </div>
      </div>
    )
  }
  
  if (variant === "matrix") {
    return (
      <div className="inline-block">
        <div className="bg-black/90 p-4 border-2 border-[#00ff00] relative overflow-hidden">
          <div className="font-mono text-[#00ff00] flex gap-1">
            {matrixChars.map((char, i) => (
              <span
                key={i}
                className="animate-matrixRain inline-block"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  opacity: Math.random() > 0.5 ? 1 : 0.5
                }}
              >
                {char}
              </span>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#00ff00]/20 pointer-events-none" />
        </div>
        {text && (
          <p className="font-pixel text-xs mt-2 text-center text-[#00ff00]">
            {text}
          </p>
        )}
      </div>
    )
  }
  
  return null
}