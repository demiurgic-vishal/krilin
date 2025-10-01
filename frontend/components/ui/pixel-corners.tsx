"use client"

import type React from "react"

interface PixelCornersProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  animate?: boolean
  children?: React.ReactNode
}

export function PixelCorners({ 
  size = 'md', 
  color = '#33272a',
  animate = false,
  children 
}: PixelCornersProps) {
  const sizeMap = {
    sm: { width: 'w-2', height: 'h-2', offset: '2px' },
    md: { width: 'w-4', height: 'h-4', offset: '4px' },
    lg: { width: 'w-6', height: 'h-6', offset: '6px' },
  }
  
  const { width, height, offset } = sizeMap[size]
  const animationClass = animate ? 'animate-pixelPulse' : ''
  
  return (
    <>
      <span 
        className={`absolute ${width} ${height} ${animationClass} pixel-corner-tl`} 
        style={{ 
          backgroundColor: color,
          top: `-${offset}`, 
          left: `-${offset}` 
        }}
      />
      <span 
        className={`absolute ${width} ${height} ${animationClass} pixel-corner-tr`} 
        style={{ 
          backgroundColor: color,
          top: `-${offset}`, 
          right: `-${offset}`,
          animationDelay: '0.1s'
        }}
      />
      <span 
        className={`absolute ${width} ${height} ${animationClass} pixel-corner-bl`} 
        style={{ 
          backgroundColor: color,
          bottom: `-${offset}`, 
          left: `-${offset}`,
          animationDelay: '0.2s'
        }}
      />
      <span 
        className={`absolute ${width} ${height} ${animationClass} pixel-corner-br`} 
        style={{ 
          backgroundColor: color,
          bottom: `-${offset}`, 
          right: `-${offset}`,
          animationDelay: '0.3s'
        }}
      />
      {children}
    </>
  )
}