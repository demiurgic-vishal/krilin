// Centralized Animation System - Single Source of Truth

export const ANIMATION_CONFIG = {
  // Core timing values (milliseconds)
  timing: {
    instant: 150,
    fast: 300,
    normal: 500,
    slow: 800,
    page: 1200,
  },
  
  // Consistent easing curves
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Standard delays for stagger effects
  stagger: {
    tight: 50,
    normal: 100,
    relaxed: 200,
    dramatic: 300,
  }
} as const

export const STANDARD_ANIMATIONS = {
  // Page entry animations
  pageEnter: 'animate-[fadeInUp_500ms_cubic-bezier(0.4,0,0.2,1)_both]',
  
  // Component entry animations  
  cardEnter: 'animate-[slideInUp_400ms_cubic-bezier(0.4,0,0.2,1)_both]',
  buttonEnter: 'animate-[scaleIn_300ms_cubic-bezier(0.4,0,0.2,1)_both]',
  textEnter: 'animate-[fadeIn_400ms_cubic-bezier(0.4,0,0.2,1)_both]',
  
  // Interaction states
  buttonHover: 'hover:scale-[1.02] hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.6)] transition-all duration-200 ease-out',
  cardHover: 'hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.6)] transition-all duration-300 ease-out',
  
  // Loading states
  loadingPulse: 'animate-[pulse_1.5s_ease-in-out_infinite]',
  loadingSpin: 'animate-[spin_1s_linear_infinite]',
  
  // Micro-interactions
  subtle: 'transition-all duration-200 ease-out',
  smooth: 'transition-all duration-300 ease-out',
  
} as const

export const PAGE_TRANSITIONS = {
  // Consistent page entry sequence
  hero: {
    animation: 'animate-[fadeInUp_600ms_cubic-bezier(0.4,0,0.2,1)_both]',
    delay: 0,
  },
  content: {
    animation: 'animate-[fadeInUp_500ms_cubic-bezier(0.4,0,0.2,1)_both]',
    delay: 200,
  },
  cards: {
    animation: 'animate-[slideInUp_400ms_cubic-bezier(0.4,0,0.2,1)_both]',
    stagger: 100,
    startDelay: 400,
  },
  buttons: {
    animation: 'animate-[scaleIn_300ms_cubic-bezier(0.4,0,0.2,1)_both]',
    stagger: 50,
    startDelay: 300,
  },
} as const

// Helper functions for consistent usage
export const createStaggerStyle = (index: number, baseDelay: number = 0, increment: number = 100) => ({
  animationDelay: `${baseDelay + (index * increment)}ms`,
  animationFillMode: 'both' as const,
})

export const createDelayedAnimation = (animation: string, delay: number) => ({
  className: `${animation} opacity-0`,
  style: { 
    animationDelay: `${delay}ms`,
    animationFillMode: 'both' as const,
  }
})

export const CONSISTENT_CLASSES = {
  // Base interactive elements
  interactiveBase: 'cursor-pointer select-none',
  
  // Consistent hover states
  hoverLift: 'hover:translate-y-[-1px] transition-transform duration-200 ease-out',
  hoverGlow: 'hover:shadow-[0_0_20px_rgba(255,107,53,0.3)] transition-shadow duration-300 ease-out',
  hoverScale: 'hover:scale-[1.02] transition-transform duration-200 ease-out',
  
  // Focus states
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:ring-offset-2',
  
  // Loading states
  loading: 'animate-pulse pointer-events-none',
  disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
  
  // Text animations
  textReveal: 'animate-[typewriter_1.5s_steps(40)_both]',
  textFade: 'animate-[fadeIn_400ms_ease-out_both]',
} as const