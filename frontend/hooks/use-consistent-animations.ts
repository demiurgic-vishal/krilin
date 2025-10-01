"use client"

import { useEffect, useRef, useState } from 'react'
import { ANIMATION_CONFIG, createStaggerStyle, createDelayedAnimation, STANDARD_ANIMATIONS } from '@/lib/animation-system'

// Standardized animation hook - use this instead of individual animation hooks
export const useConsistentAnimations = () => {
  return {
    // Page entry sequence - use these in order
    hero: STANDARD_ANIMATIONS.pageEnter,
    content: createDelayedAnimation(STANDARD_ANIMATIONS.textEnter, ANIMATION_CONFIG.stagger.relaxed),
    
    // Component animations
    card: STANDARD_ANIMATIONS.cardEnter,
    button: STANDARD_ANIMATIONS.buttonEnter,
    text: STANDARD_ANIMATIONS.textEnter,
    
    // Interactive states
    hover: {
      button: STANDARD_ANIMATIONS.buttonHover,
      card: STANDARD_ANIMATIONS.cardHover,
    },
    
    // Loading states
    loading: STANDARD_ANIMATIONS.loadingPulse,
    
    // Micro-interactions
    transition: STANDARD_ANIMATIONS.smooth,
  }
}

// Consistent stagger animations
export const useStaggeredEntrance = (itemCount: number, type: 'cards' | 'buttons' | 'text' = 'cards') => {
  const animations = {
    cards: {
      animation: 'animate-slideInUp',
      stagger: ANIMATION_CONFIG.stagger.normal,
      startDelay: 400,
    },
    buttons: {
      animation: 'animate-scaleIn', 
      stagger: ANIMATION_CONFIG.stagger.tight,
      startDelay: 300,
    },
    text: {
      animation: 'animate-fadeIn',
      stagger: ANIMATION_CONFIG.stagger.normal,
      startDelay: 200,
    }
  }
  
  const config = animations[type]
  
  return Array.from({ length: itemCount }, (_, index) => ({
    className: `${config.animation} opacity-0`,
    style: createStaggerStyle(index, config.startDelay, config.stagger),
  }))
}

// Intersection observer with consistent animations
export const useConsistentIntersection = (
  animationType: 'hero' | 'card' | 'button' | 'text' = 'card',
  options: IntersectionObserverInit = { threshold: 0.1 }
) => {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLElement>(null)
  
  const animationMap = {
    hero: 'animate-fadeInUp',
    card: 'animate-slideInUp',
    button: 'animate-scaleIn',
    text: 'animate-fadeIn',
  }
  
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
    className: isVisible ? animationMap[animationType] : 'opacity-0',
  }
}

// Consistent loading states - SIMPLIFIED AND FIXED
export const useConsistentLoading = (isLoading: boolean = true, duration: number = 1000) => {
  const [showLoading, setShowLoading] = useState(true) // Always start with loading
  
  useEffect(() => {
    // Always hide loading after duration, regardless of isLoading prop
    const timer = setTimeout(() => setShowLoading(false), duration)
    return () => clearTimeout(timer)
  }, [duration]) // Removed isLoading dependency that was causing issues
  
  return {
    isLoading: showLoading,
    loadingClass: 'animate-fadeIn',
    contentClass: showLoading ? 'opacity-0' : 'animate-fadeInUp',
  }
}

// Consistent typewriter effect
export const useConsistentTypewriter = (text: string, speed: number = 80) => {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  
  useEffect(() => {
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex))
        currentIndex++
      } else {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, speed)
    
    return () => clearInterval(interval)
  }, [text, speed])
  
  return {
    displayedText,
    isComplete,
    cursorClass: isComplete ? '' : 'animate-blink',
  }
}