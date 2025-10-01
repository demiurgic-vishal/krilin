"use client"

import { useEffect, useState } from "react"
import { useIntersectionAnimation } from "@/hooks/use-animations"

interface TransitionWrapperProps {
  children: React.ReactNode
  animation?: "fadeIn" | "slideInLeft" | "slideInRight" | "bounce" | "grow"
  delay?: number
  threshold?: number
  className?: string
  once?: boolean
}

export function TransitionWrapper({
  children,
  animation = "fadeIn",
  delay = 0,
  threshold = 0.1,
  className = "",
  once = true
}: TransitionWrapperProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false)
  
  const animationMap = {
    fadeIn: 'animate-pixelFade',
    slideInLeft: 'animate-slideInLeft',
    slideInRight: 'animate-slideInRight',
    bounce: 'animate-pixelBounce',
    grow: 'animate-pixelGrow'
  }
  
  const { ref, animationClass } = useIntersectionAnimation(
    animationMap[animation],
    { threshold, rootMargin: '50px' }
  )
  
  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShouldAnimate(true), delay)
      return () => clearTimeout(timer)
    } else {
      setShouldAnimate(true)
    }
  }, [delay])
  
  return (
    <div 
      ref={ref as any}
      className={`${shouldAnimate ? animationClass : 'opacity-0'} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}