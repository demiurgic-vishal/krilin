"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import KrilinLogo from "./krilin-logo"
import KrilinButtonEnhanced from "./krilin-button-enhanced"
import { PixelLoader } from "./ui/pixel-loader"
import { useGlitchEffect, useRandomPixelMovement } from "@/hooks/use-animations"
import { Menu, X, Home, Brain, Zap, Settings } from "lucide-react"

interface KrilinHeaderEnhancedProps {
  showPowerLevel?: boolean
  currentPath?: string
}

export default function KrilinHeaderEnhanced({ 
  showPowerLevel = true,
  currentPath = "/" 
}: KrilinHeaderEnhancedProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [powerLevel, setPowerLevel] = useState(9001)
  const [isCharging, setIsCharging] = useState(false)
  
  const { glitchClass, triggerGlitch } = useGlitchEffect('low')
  const floatingProps = useRandomPixelMovement(2, 4000)
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        triggerGlitch()
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [triggerGlitch])
  
  const handlePowerCharge = () => {
    setIsCharging(true)
    const interval = setInterval(() => {
      setPowerLevel(prev => {
        const newLevel = prev + Math.floor(Math.random() * 100)
        if (newLevel > 15000) {
          setIsCharging(false)
          clearInterval(interval)
          return 9001
        }
        return newLevel
      })
    }, 100)
    
    setTimeout(() => {
      setIsCharging(false)
      clearInterval(interval)
      setPowerLevel(9001)
    }, 2000)
  }
  
  const navigationItems = [
    { href: "/", label: "HOME", icon: Home, active: currentPath === "/" },
    { href: "/dashboard", label: "DASHBOARD", icon: Brain, active: currentPath === "/dashboard" },
    { href: "/chat", label: "CHAT", icon: Zap, active: currentPath === "/chat" },
    { href: "/settings", label: "SETTINGS", icon: Settings, active: currentPath === "/settings" },
  ]

  return (
    <header className="bg-[#594a4e] relative overflow-hidden border-b-4 border-[#33272a]">
      {/* Subtle background effects */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b35]/10 via-transparent to-[#4ecdc4]/10" />
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-[#ffc15e]/50 to-transparent animate-retroWave" />
      </div>
      
      <div className="relative z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative" {...floatingProps}>
            <KrilinLogo 
              className="w-12 h-12 hover:animate-levelUp cursor-pointer transition-all duration-300" 
              onClick={handlePowerCharge}
            />
            {isCharging && (
              <div className="absolute -inset-2 animate-pixelPulse">
                <div className="w-full h-full border-2 border-[#ffc15e] animate-pixelRotate" />
              </div>
            )}
          </div>
          
          <div className={`font-pixel text-white ${glitchClass}`}>
            <Link href="/" className="block hover:text-[#ffc15e] transition-colors">
              <h1 className="text-xl tracking-wider hover:animate-pixelShake">
                PERSONAL AI
              </h1>
            </Link>
            <p className="text-xs text-[#ffc15e] flex items-center gap-2">
              {showPowerLevel && (
                <>
                  <span>POWER LEVEL:</span>
                  {isCharging ? (
                    <PixelLoader variant="dots" size="sm" text="" />
                  ) : (
                    <span className="animate-blink">{powerLevel.toLocaleString()}</span>
                  )}
                </>
              )}
              {!showPowerLevel && "LEVEL UP MIND & MATTER"}
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-2">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`
                flex items-center gap-2 px-4 py-2 font-pixel text-sm 
                transition-all duration-300 border-2 border-transparent
                hover:border-[#ffc15e] hover:bg-[#ffc15e]/10
                ${item.active ? 'border-[#ff6b35] bg-[#ff6b35]/20 text-[#ff6b35]' : 'text-white hover:text-[#ffc15e]'}
              `}>
                <item.icon size={16} />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <KrilinButtonEnhanced
          variant="secondary"
          size="sm"
          animation="pulse"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </KrilinButtonEnhanced>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#33272a] border-t-2 border-[#594a4e] animate-slideInLeft">
          <div className="p-4 space-y-3">
            {navigationItems.map((item, index) => (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                <div 
                  className={`
                    flex items-center gap-3 p-3 font-pixel text-sm 
                    border-2 border-[#594a4e] hover-lift
                    ${item.active ? 'bg-[#ff6b35] text-white' : 'bg-[#fffaeb] text-[#33272a] hover:bg-[#ffc15e]'}
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Subtle corner effects */}
      <div className="absolute top-0 left-0 w-4 h-4 bg-[#ff6b35] opacity-50" />
      <div className="absolute top-0 right-0 w-4 h-4 bg-[#4ecdc4] opacity-50" />
    </header>
  )
}