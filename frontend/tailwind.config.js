/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        pixel: ["PixelFont", "monospace"],
      },
      keyframes: {
        // Core consistent animations
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { 
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": { 
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        slideInUp: {
          "0%": { 
            opacity: "0",
            transform: "translateY(30px)",
          },
          "100%": { 
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        scaleIn: {
          "0%": { 
            opacity: "0",
            transform: "scale(0.9)",
          },
          "100%": { 
            opacity: "1",
            transform: "scale(1)",
          },
        },
        // Specialized pixel animations
        blink: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0 },
        },
        power: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        glitch: {
          "0%, 100%": { 
            transform: "translate(0)",
            filter: "hue-rotate(0deg)",
          },
          "20%": { 
            transform: "translate(-2px, 2px)",
            filter: "hue-rotate(90deg)",
          },
          "40%": { 
            transform: "translate(-2px, -2px)",
            filter: "hue-rotate(180deg)",
          },
          "60%": { 
            transform: "translate(2px, 2px)",
            filter: "hue-rotate(270deg)",
          },
          "80%": { 
            transform: "translate(2px, -2px)",
            filter: "hue-rotate(360deg)",
          },
        },
        pixelPulse: {
          "0%": { 
            boxShadow: "0 0 0 0 rgba(255, 107, 53, 0.7), 4px 4px 0 0 rgba(0, 0, 0, 0.8)",
          },
          "50%": { 
            boxShadow: "0 0 0 10px rgba(255, 107, 53, 0), 6px 6px 0 0 rgba(0, 0, 0, 0.6)",
          },
          "100%": { 
            boxShadow: "0 0 0 0 rgba(255, 107, 53, 0), 4px 4px 0 0 rgba(0, 0, 0, 0.8)",
          },
        },
        typewriter: {
          from: { 
            width: "0",
            borderRight: "3px solid",
          },
          to: { 
            width: "100%",
            borderRight: "3px solid",
          },
        },
        pixelBounce: {
          "0%, 100%": { 
            transform: "translateY(0) scaleY(1)",
          },
          "10%": { 
            transform: "translateY(0) scaleY(1.1)",
          },
          "30%": { 
            transform: "translateY(-20px) scaleY(0.95)",
          },
          "50%": { 
            transform: "translateY(0) scaleY(1.05)",
          },
          "57%": { 
            transform: "translateY(-7px) scaleY(1)",
          },
          "64%": { 
            transform: "translateY(0) scaleY(1)",
          },
        },
        retroWave: {
          "0%": { 
            transform: "translateX(-100%) skewX(-12deg)",
            opacity: "0",
          },
          "10%": { 
            transform: "translateX(-50%) skewX(-12deg)",
            opacity: "1",
          },
          "100%": { 
            transform: "translateX(100%) skewX(-12deg)",
            opacity: "0",
          },
        },
        pixelFade: {
          "0%": { 
            opacity: "0",
            transform: "scale(0.8) translateY(10px)",
            filter: "blur(4px)",
          },
          "50%": {
            filter: "blur(2px)",
          },
          "100%": { 
            opacity: "1",
            transform: "scale(1) translateY(0)",
            filter: "blur(0)",
          },
        },
        matrixRain: {
          "0%": {
            transform: "translateY(-100%)",
            opacity: "0",
          },
          "10%": {
            opacity: "1",
          },
          "90%": {
            opacity: "1",
          },
          "100%": {
            transform: "translateY(100vh)",
            opacity: "0",
          },
        },
        pixelRotate: {
          "0%": { 
            transform: "rotate(0deg) scale(1)",
          },
          "25%": { 
            transform: "rotate(90deg) scale(1.1)",
          },
          "50%": { 
            transform: "rotate(180deg) scale(1)",
          },
          "75%": { 
            transform: "rotate(270deg) scale(1.1)",
          },
          "100%": { 
            transform: "rotate(360deg) scale(1)",
          },
        },
        pixelShake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
        },
        levelUp: {
          "0%": { 
            transform: "scale(1) translateY(0)",
            filter: "brightness(1)",
          },
          "50%": { 
            transform: "scale(1.2) translateY(-10px)",
            filter: "brightness(1.5)",
          },
          "100%": { 
            transform: "scale(1) translateY(0)",
            filter: "brightness(1)",
          },
        },
        powerUp: {
          "0%": { 
            transform: "scale(0) rotate(0deg)",
            opacity: "0",
          },
          "50%": { 
            transform: "scale(1.1) rotate(180deg)",
            opacity: "1",
          },
          "100%": { 
            transform: "scale(1) rotate(360deg)",
            opacity: "1",
          },
        },
        pixelFlicker: {
          "0%, 100%": { opacity: "1" },
          "5%, 15%, 25%, 35%, 45%": { opacity: "0.8" },
          "10%, 20%, 30%, 40%": { opacity: "1" },
          "50%": { opacity: "0.6" },
          "90%": { opacity: "0.9" },
        },
        slideInLeft: {
          from: { 
            transform: "translateX(-100%)",
            opacity: "0",
          },
          to: { 
            transform: "translateX(0)",
            opacity: "1",
          },
        },
        slideInRight: {
          from: { 
            transform: "translateX(100%)",
            opacity: "0",
          },
          to: { 
            transform: "translateX(0)",
            opacity: "1",
          },
        },
        pixelGrow: {
          "0%": { 
            transform: "scale(0)",
            opacity: "0",
          },
          "80%": { 
            transform: "scale(1.1)",
            opacity: "1",
          },
          "100%": { 
            transform: "scale(1)",
            opacity: "1",
          },
        },
      },
      animation: {
        // Core consistent animations - ALWAYS use these
        fadeIn: "fadeIn 400ms cubic-bezier(0.4, 0, 0.2, 1) both",
        fadeInUp: "fadeInUp 500ms cubic-bezier(0.4, 0, 0.2, 1) both",
        slideInUp: "slideInUp 400ms cubic-bezier(0.4, 0, 0.2, 1) both",
        scaleIn: "scaleIn 300ms cubic-bezier(0.4, 0, 0.2, 1) both",
        
        // Specialized pixel animations - use sparingly
        blink: "blink 1s step-end infinite",
        power: "power 2s ease-in-out infinite",
        glitch: "glitch 300ms ease-in-out",
        pixelPulse: "pixelPulse 2s ease-out infinite",
        },
      textShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.1)",
        DEFAULT: "0 2px 4px rgba(0, 0, 0, 0.2)",
        lg: "0 8px 16px rgba(0, 0, 0, 0.3)",
      },
      boxShadow: {
        'pixel': '4px 4px 0 0 rgba(0, 0, 0, 0.8)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("./plugins/text-shadow")
  ],
}
