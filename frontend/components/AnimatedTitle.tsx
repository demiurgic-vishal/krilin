"use client"

import { useState, useEffect } from 'react'

interface AnimatedTitleProps {
  title: string
  className?: string
  animateOnMount?: boolean
}

export function AnimatedTitle({ title, className = '', animateOnMount = false }: AnimatedTitleProps) {
  const [displayedTitle, setDisplayedTitle] = useState(animateOnMount ? '' : title)
  const [isAnimating, setIsAnimating] = useState(animateOnMount)
  const [charIndex, setCharIndex] = useState(animateOnMount ? 0 : title.length)
  const [previousTitle, setPreviousTitle] = useState(title)

  useEffect(() => {
    // Detect when title prop changes
    if (title !== previousTitle) {
      setPreviousTitle(title)
      setIsAnimating(true)
      setDisplayedTitle('')
      setCharIndex(0)
    }
  }, [title, previousTitle])

  useEffect(() => {
    if (isAnimating && charIndex < title.length) {
      const timeout = setTimeout(() => {
        setDisplayedTitle(title.substring(0, charIndex + 1))
        setCharIndex(charIndex + 1)
      }, 40) // Typing speed (40ms per character)

      return () => clearTimeout(timeout)
    } else if (isAnimating && charIndex >= title.length) {
      setIsAnimating(false)
    }
  }, [isAnimating, charIndex, title])

  return (
    <span className={className}>
      {displayedTitle}
      {isAnimating && (
        <span className="inline-block w-[2px] h-4 bg-[var(--primary)] ml-1 animate-pulse">
          {/* Blinking cursor */}
        </span>
      )}
    </span>
  )
}
