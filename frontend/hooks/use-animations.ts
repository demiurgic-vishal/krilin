"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { pixelAnimations, animationPresets, transitionPresets, pixelEffects } from '@/lib/animations'

export const usePixelAnimation = (
  animationType: keyof typeof pixelAnimations,
  trigger: 'hover' | 'click' | 'auto' | 'inView' = 'auto'
) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const elementRef = useRef<HTMLElement>(null)
  
  useEffect(() => {
    if (trigger === 'auto') {
      setIsAnimating(true)
    }
  }, [trigger])
  
  const startAnimation = useCallback(() => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 2000)
  }, [])
  
  const animationClass = isAnimating ? pixelAnimations[animationType].animation : ''
  
  return {
    ref: elementRef,
    animationClass,
    startAnimation,
    isAnimating,
    ...(trigger === 'hover' && {
      onMouseEnter: startAnimation,
    }),
    ...(trigger === 'click' && {
      onClick: startAnimation,
    }),
  }
}

export const useGlitchEffect = (intensity: 'low' | 'medium' | 'high' = 'medium') => {
  const [isGlitching, setIsGlitching] = useState(false)
  
  const intensityMap = {
    low: { duration: 200, frequency: 0.1 },
    medium: { duration: 300, frequency: 0.2 },
    high: { duration: 500, frequency: 0.3 },
  }
  
  const triggerGlitch = useCallback(() => {
    if (Math.random() < intensityMap[intensity].frequency) {
      setIsGlitching(true)
      setTimeout(() => setIsGlitching(false), intensityMap[intensity].duration)
    }
  }, [intensity])
  
  useEffect(() => {
    const interval = setInterval(triggerGlitch, 5000)
    return () => clearInterval(interval)
  }, [triggerGlitch])
  
  return {
    isGlitching,
    glitchClass: isGlitching ? 'animate-[glitch_0.3s_ease-in-out]' : '',
    triggerGlitch,
  }
}

export const useTypewriterEffect = (text: string, speed: number = 100) => {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  useEffect(() => {
    setIsTyping(true)
    let currentIndex = 0
    
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsTyping(false)
        clearInterval(interval)
      }
    }, speed)
    
    return () => clearInterval(interval)
  }, [text, speed])
  
  return {
    displayedText,
    isTyping,
    cursorClass: isTyping ? 'animate-blink' : '',
  }
}

export const useParallaxPixel = (speed: number = 0.5) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const elementRef = useRef<HTMLElement>(null)
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        
        const offsetX = (e.clientX - centerX) * speed * 0.01
        const offsetY = (e.clientY - centerY) * speed * 0.01
        
        setOffset({ x: Math.round(offsetX), y: Math.round(offsetY) })
      }
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [speed])
  
  return {
    ref: elementRef,
    style: {
      transform: `translate(${offset.x}px, ${offset.y}px)`,
      transition: 'transform 0.3s ease-out',
    },
  }
}

export const useIntersectionAnimation = (
  animationClass: string,
  options: IntersectionObserverInit = { threshold: 0.1 }
) => {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      options
    )
    
    if (elementRef.current) {
      observer.observe(elementRef.current)
    }
    
    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current)
      }
    }
  }, [options])
  
  return {
    ref: elementRef,
    animationClass: isVisible ? animationClass : 'opacity-0',
  }
}

export const useStaggerAnimation = (
  itemCount: number,
  baseDelay: number = 100,
  animationClass: string = 'animate-[pixelFade_0.5s_ease-out_forwards]'
) => {
  return Array.from({ length: itemCount }, (_, index) => ({
    style: { animationDelay: `${index * baseDelay}ms` },
    className: animationClass,
  }))
}

export const usePixelTrail = (trailLength: number = 5) => {
  const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number }>>([])
  const idCounter = useRef(0)
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const newPoint = {
      x: e.clientX,
      y: e.clientY,
      id: idCounter.current++,
    }
    
    setTrail(prevTrail => {
      const updatedTrail = [newPoint, ...prevTrail.slice(0, trailLength - 1)]
      return updatedTrail
    })
  }, [trailLength])
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])
  
  return trail.map((point, index) => ({
    style: {
      position: 'fixed' as const,
      left: point.x,
      top: point.y,
      opacity: 1 - (index / trailLength),
      transform: `scale(${1 - (index / trailLength) * 0.5})`,
    },
    key: point.id,
  }))
}

export const useRandomPixelMovement = (
  maxOffset: number = 20,
  interval: number = 2000
) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setOffset({
        x: Math.floor(Math.random() * maxOffset * 2) - maxOffset,
        y: Math.floor(Math.random() * maxOffset * 2) - maxOffset,
      })
    }, interval)
    
    return () => clearInterval(intervalId)
  }, [maxOffset, interval])
  
  return {
    style: {
      transform: `translate(${offset.x}px, ${offset.y}px)`,
      transition: `transform ${interval}ms steps(4)`,
    },
  }
}

export const usePowerMeter = (value: number, max: number = 100) => {
  const percentage = Math.min((value / max) * 100, 100)
  const [animatedPercentage, setAnimatedPercentage] = useState(0)
  
  useEffect(() => {
    const steps = 20
    const stepValue = percentage / steps
    let currentStep = 0
    
    const interval = setInterval(() => {
      if (currentStep < steps) {
        setAnimatedPercentage(stepValue * (currentStep + 1))
        currentStep++
      } else {
        clearInterval(interval)
      }
    }, 50)
    
    return () => clearInterval(interval)
  }, [percentage])
  
  const getColorClass = () => {
    if (animatedPercentage < 25) return 'bg-red-500'
    if (animatedPercentage < 50) return 'bg-yellow-500'
    if (animatedPercentage < 75) return 'bg-green-500'
    return 'bg-[#4ecdc4]'
  }
  
  return {
    percentage: animatedPercentage,
    colorClass: getColorClass(),
    isLow: animatedPercentage < 25,
    isCritical: animatedPercentage < 10,
  }
}