export const motionTokens = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 800,
    slowest: 1000,
  },
  
  easing: {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    bouncy: [0.68, -0.55, 0.265, 1.55],
    elastic: [0.68, -0.6, 0.32, 1.6],
    overshoot: [0.34, 1.56, 0.64, 1],
    anticipate: [0.55, 0.055, 0.675, 0.19],
    pixel: [0, 0.95, 0.05, 1],
  },
  
  spring: {
    gentle: { stiffness: 100, damping: 15 },
    normal: { stiffness: 200, damping: 20 },
    bouncy: { stiffness: 300, damping: 10 },
    stiff: { stiffness: 400, damping: 25 },
    slow: { stiffness: 50, damping: 20 },
  },
  
  scale: {
    subtle: 0.95,
    normal: 0.9,
    pronounced: 0.8,
    hover: 1.05,
    emphasis: 1.1,
    hero: 1.2,
  },
  
  rotate: {
    subtle: 2,
    normal: 5,
    pronounced: 10,
    quarter: 90,
    half: 180,
    full: 360,
  },
  
  translate: {
    subtle: 2,
    normal: 4,
    pronounced: 8,
    far: 16,
    extreme: 32,
  },
  
  blur: {
    none: 0,
    subtle: 2,
    normal: 4,
    pronounced: 8,
    extreme: 16,
  },
  
  opacity: {
    transparent: 0,
    faint: 0.1,
    dim: 0.3,
    half: 0.5,
    bright: 0.7,
    clear: 0.9,
    full: 1,
  },
}

export const motionPresets = {
  tap: {
    scale: motionTokens.scale.normal,
    duration: motionTokens.duration.instant,
  },
  
  hover: {
    scale: motionTokens.scale.hover,
    duration: motionTokens.duration.fast,
  },
  
  fadeIn: {
    initial: { opacity: 0, y: motionTokens.translate.normal },
    animate: { opacity: 1, y: 0 },
    duration: motionTokens.duration.normal,
  },
  
  slideIn: {
    initial: { x: -motionTokens.translate.extreme, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    duration: motionTokens.duration.slow,
  },
  
  bounce: {
    initial: { scale: 0 },
    animate: { 
      scale: [0, 1.2, 0.9, 1.05, 1],
      transition: { duration: motionTokens.duration.slower }
    },
  },
  
  shake: {
    x: [-motionTokens.translate.subtle, motionTokens.translate.subtle],
    transition: { 
      repeat: 3, 
      duration: motionTokens.duration.instant 
    },
  },
  
  pulse: {
    scale: [1, motionTokens.scale.emphasis, 1],
    transition: { 
      repeat: Infinity, 
      duration: motionTokens.duration.slowest 
    },
  },
  
  glitch: {
    x: [-2, 2, -2, 2, 0],
    y: [2, -2, 2, -2, 0],
    filter: [
      'hue-rotate(0deg)',
      'hue-rotate(90deg)',
      'hue-rotate(180deg)',
      'hue-rotate(270deg)',
      'hue-rotate(0deg)',
    ],
    transition: { duration: motionTokens.duration.fast },
  },
  
  levelUp: {
    scale: [1, motionTokens.scale.hero, 1],
    y: [0, -motionTokens.translate.pronounced, 0],
    filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'],
    transition: { duration: motionTokens.duration.normal },
  },
}

export const staggerPresets = {
  fast: {
    staggerChildren: 0.05,
    delayChildren: 0,
  },
  normal: {
    staggerChildren: 0.1,
    delayChildren: 0.1,
  },
  slow: {
    staggerChildren: 0.2,
    delayChildren: 0.2,
  },
  cascade: {
    staggerChildren: 0.15,
    delayChildren: 0,
    staggerDirection: 1,
  },
  reverse: {
    staggerChildren: 0.1,
    delayChildren: 0,
    staggerDirection: -1,
  },
}

export const pixelMotionPresets = {
  pixelSnap: {
    x: (x: number) => Math.round(x / 4) * 4,
    y: (y: number) => Math.round(y / 4) * 4,
  },
  
  pixelatedMove: {
    transition: {
      type: 'tween',
      ease: 'linear',
      duration: motionTokens.duration.fast,
    },
  },
  
  retroBlink: {
    opacity: [1, 1, 0, 0, 1, 1],
    transition: {
      duration: motionTokens.duration.slow,
      times: [0, 0.4, 0.45, 0.55, 0.6, 1],
    },
  },
  
  scanline: {
    y: ['-100%', '100vh'],
    transition: {
      duration: 8,
      ease: 'linear',
      repeat: Infinity,
    },
  },
  
  matrixRain: {
    y: ['-100%', '100vh'],
    opacity: [0, 1, 1, 0],
    transition: {
      duration: 3,
      ease: 'linear',
      repeat: Infinity,
      times: [0, 0.1, 0.9, 1],
    },
  },
  
  powerUp: {
    scale: [0, 1.1, 1],
    rotate: [0, 180, 360],
    opacity: [0, 1, 1],
    transition: {
      duration: motionTokens.duration.slower,
      ease: motionTokens.easing.bouncy,
    },
  },
  
  coinFlip: {
    rotateY: [0, 180, 360],
    scale: [1, 1.1, 1],
    transition: {
      duration: motionTokens.duration.normal,
      ease: motionTokens.easing.easeInOut,
    },
  },
  
  typewriter: {
    width: ['0%', '100%'],
    transition: {
      duration: 2,
      ease: 'steps(20)',
    },
  },
}

export const createMotionVariants = (
  initial: Record<string, any>,
  animate: Record<string, any>,
  exit?: Record<string, any>,
  transition?: Record<string, any>
) => ({
  initial,
  animate: {
    ...animate,
    transition: {
      duration: motionTokens.duration.normal / 1000,
      ease: motionTokens.easing.easeOut,
      ...transition,
    },
  },
  exit: exit || initial,
})

export const composeMotion = (...presets: any[]) => {
  return presets.reduce((acc, preset) => ({
    ...acc,
    ...preset,
    transition: {
      ...acc.transition,
      ...preset.transition,
    },
  }), {})
}