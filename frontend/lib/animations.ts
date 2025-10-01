export const pixelAnimations = {
  glitch: {
    keyframes: `
      @keyframes glitch {
        0%, 100% { 
          transform: translate(0);
          filter: hue-rotate(0deg);
        }
        20% { 
          transform: translate(-2px, 2px);
          filter: hue-rotate(90deg);
        }
        40% { 
          transform: translate(-2px, -2px);
          filter: hue-rotate(180deg);
        }
        60% { 
          transform: translate(2px, 2px);
          filter: hue-rotate(270deg);
        }
        80% { 
          transform: translate(2px, -2px);
          filter: hue-rotate(360deg);
        }
      }
    `,
    animation: 'glitch 0.3s ease-in-out',
  },
  
  pixelPulse: {
    keyframes: `
      @keyframes pixelPulse {
        0% { 
          box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.7),
                      4px 4px 0 0 rgba(0, 0, 0, 0.8);
        }
        50% { 
          box-shadow: 0 0 0 10px rgba(255, 107, 53, 0),
                      6px 6px 0 0 rgba(0, 0, 0, 0.6);
        }
        100% { 
          box-shadow: 0 0 0 0 rgba(255, 107, 53, 0),
                      4px 4px 0 0 rgba(0, 0, 0, 0.8);
        }
      }
    `,
    animation: 'pixelPulse 2s ease-out infinite',
  },

  typewriter: {
    keyframes: `
      @keyframes typewriter {
        from { 
          width: 0;
          border-right: 3px solid;
        }
        to { 
          width: 100%;
          border-right: 3px solid;
        }
      }
    `,
    animation: 'typewriter 2s steps(20) 1s forwards',
  },

  pixelBounce: {
    keyframes: `
      @keyframes pixelBounce {
        0%, 100% { 
          transform: translateY(0) scaleY(1);
        }
        10% { 
          transform: translateY(0) scaleY(1.1);
        }
        30% { 
          transform: translateY(-20px) scaleY(0.95);
        }
        50% { 
          transform: translateY(0) scaleY(1.05);
        }
        57% { 
          transform: translateY(-7px) scaleY(1);
        }
        64% { 
          transform: translateY(0) scaleY(1);
        }
        100% { 
          transform: translateY(0) scaleY(1);
        }
      }
    `,
    animation: 'pixelBounce 1.5s ease-in-out',
  },

  retroWave: {
    keyframes: `
      @keyframes retroWave {
        0% { 
          transform: translateX(-100%) skewX(-12deg);
          opacity: 0;
        }
        10% { 
          transform: translateX(-50%) skewX(-12deg);
          opacity: 1;
        }
        100% { 
          transform: translateX(100%) skewX(-12deg);
          opacity: 0;
        }
      }
    `,
    animation: 'retroWave 3s ease-in-out infinite',
  },

  pixelFade: {
    keyframes: `
      @keyframes pixelFade {
        0% { 
          opacity: 0;
          transform: scale(0.8) translateY(10px);
          filter: blur(4px);
        }
        50% {
          filter: blur(2px);
        }
        100% { 
          opacity: 1;
          transform: scale(1) translateY(0);
          filter: blur(0);
        }
      }
    `,
    animation: 'pixelFade 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  },

  matrixRain: {
    keyframes: `
      @keyframes matrixRain {
        0% {
          transform: translateY(-100%);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateY(100vh);
          opacity: 0;
        }
      }
    `,
    animation: 'matrixRain 3s linear infinite',
  },

  pixelRotate: {
    keyframes: `
      @keyframes pixelRotate {
        0% { 
          transform: rotate(0deg) scale(1);
        }
        25% { 
          transform: rotate(90deg) scale(1.1);
        }
        50% { 
          transform: rotate(180deg) scale(1);
        }
        75% { 
          transform: rotate(270deg) scale(1.1);
        }
        100% { 
          transform: rotate(360deg) scale(1);
        }
      }
    `,
    animation: 'pixelRotate 2s steps(8) infinite',
  },

  pixelShake: {
    keyframes: `
      @keyframes pixelShake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
      }
    `,
    animation: 'pixelShake 0.5s ease-in-out',
  },

  levelUp: {
    keyframes: `
      @keyframes levelUp {
        0% { 
          transform: scale(1) translateY(0);
          filter: brightness(1);
        }
        50% { 
          transform: scale(1.2) translateY(-10px);
          filter: brightness(1.5);
        }
        100% { 
          transform: scale(1) translateY(0);
          filter: brightness(1);
        }
      }
    `,
    animation: 'levelUp 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  powerUp: {
    keyframes: `
      @keyframes powerUp {
        0% { 
          transform: scale(0) rotate(0deg);
          opacity: 0;
        }
        50% { 
          transform: scale(1.1) rotate(180deg);
          opacity: 1;
        }
        100% { 
          transform: scale(1) rotate(360deg);
          opacity: 1;
        }
      }
    `,
    animation: 'powerUp 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
  },

  pixelFlicker: {
    keyframes: `
      @keyframes pixelFlicker {
        0%, 100% { opacity: 1; }
        5%, 15%, 25%, 35%, 45% { opacity: 0.8; }
        10%, 20%, 30%, 40% { opacity: 1; }
        50% { opacity: 0.6; }
        90% { opacity: 0.9; }
      }
    `,
    animation: 'pixelFlicker 2s infinite',
  },
}

export const animationPresets = {
  interactive: {
    hover: 'hover:scale-105 hover:brightness-110',
    active: 'active:scale-95 active:brightness-90',
    focus: 'focus:outline-none focus:ring-4 focus:ring-offset-2',
  },
  
  entrance: {
    fadeInUp: 'animate-[pixelFade_0.5s_ease-out_forwards]',
    slideInLeft: 'animate-[slideInLeft_0.5s_ease-out_forwards]',
    slideInRight: 'animate-[slideInRight_0.5s_ease-out_forwards]',
    bounceIn: 'animate-[pixelBounce_0.8s_ease-out_forwards]',
    powerUp: 'animate-[powerUp_0.8s_ease-out_forwards]',
  },
  
  emphasis: {
    pulse: 'animate-[pixelPulse_2s_ease-out_infinite]',
    shake: 'animate-[pixelShake_0.5s_ease-in-out]',
    glitch: 'animate-[glitch_0.3s_ease-in-out]',
    flicker: 'animate-[pixelFlicker_2s_infinite]',
  },
  
  continuous: {
    rotate: 'animate-[pixelRotate_2s_steps(8)_infinite]',
    wave: 'animate-[retroWave_3s_ease-in-out_infinite]',
    rain: 'animate-[matrixRain_3s_linear_infinite]',
    levelUp: 'animate-[levelUp_1s_ease-in-out_infinite]',
  }
}

export const transitionPresets = {
  smooth: 'transition-all duration-300 ease-in-out',
  bouncy: 'transition-all duration-500 cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  snappy: 'transition-all duration-200 ease-out',
  delayed: 'transition-all duration-300 delay-100 ease-in-out',
}

export const pixelEffects = {
  generatePixelCorners: (size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeMap = {
      sm: { width: 'w-2', height: 'h-2', offset: '2px' },
      md: { width: 'w-4', height: 'h-4', offset: '4px' },
      lg: { width: 'w-6', height: 'h-6', offset: '6px' },
    }
    
    const { width, height, offset } = sizeMap[size]
    
    return {
      className: 'relative',
      corners: [
        { className: `absolute ${width} ${height} bg-[#33272a] pixel-corner-tl`, style: { top: `-${offset}`, left: `-${offset}` } },
        { className: `absolute ${width} ${height} bg-[#33272a] pixel-corner-tr`, style: { top: `-${offset}`, right: `-${offset}` } },
        { className: `absolute ${width} ${height} bg-[#33272a] pixel-corner-bl`, style: { bottom: `-${offset}`, left: `-${offset}` } },
        { className: `absolute ${width} ${height} bg-[#33272a] pixel-corner-br`, style: { bottom: `-${offset}`, right: `-${offset}` } },
      ]
    }
  },
  
  pixelShadow: (color: string = '#33272a') => ({
    boxShadow: `4px 4px 0 0 ${color}`,
  }),
  
  scanlineEffect: () => ({
    backgroundImage: `repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px
    )`,
  }),
}

export const composeAnimations = (...animations: string[]) => animations.join(' ')

export const animationConfig = {
  durations: {
    instant: '100ms',
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
    slower: '800ms',
  },
  easings: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  },
  delays: {
    none: '0ms',
    short: '100ms',
    medium: '200ms',
    long: '400ms',
  },
}