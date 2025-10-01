"use client"

import { useState } from "react"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import { PixelLoader } from "@/components/ui/pixel-loader"
import { useTypewriterEffect, usePixelTrail } from "@/hooks/use-animations"

export default function DesignShowcase() {
  const [loadingValue, setLoadingValue] = useState(30)
  const { displayedText, cursorClass } = useTypewriterEffect("Welcome to Krilin's Creative Pixel Universe!", 50)
  const trail = usePixelTrail(8)
  
  return (
    <div className="min-h-screen bg-[#fffaeb] p-8 relative overflow-hidden">
      {trail.map((props) => (
        <div
          key={props.key}
          style={props.style}
          className="w-2 h-2 bg-[#ff6b35] pointer-events-none"
        />
      ))}
      
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center mb-12">
          <h1 className="font-pixel text-4xl text-[#33272a] mb-4">
            {displayedText}
            <span className={`inline-block w-3 h-5 bg-[#33272a] ml-1 ${cursorClass}`} />
          </h1>
          <p className="font-pixel text-[#594a4e] animate-pixelFade">
            Showcasing creative animations with consistent pixelated design
          </p>
        </div>
        
        <section className="space-y-8">
          <h2 className="font-pixel text-2xl text-[#33272a] border-b-4 border-[#33272a] pb-2 mb-6">
            Enhanced Buttons
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KrilinButtonEnhanced variant="primary" animation="pulse">
              Pulse Effect
            </KrilinButtonEnhanced>
            
            <KrilinButtonEnhanced variant="secondary" animation="glitch">
              Glitch Mode
            </KrilinButtonEnhanced>
            
            <KrilinButtonEnhanced variant="accent" animation="bounce">
              Bouncy
            </KrilinButtonEnhanced>
            
            <KrilinButtonEnhanced variant="danger" animation="levelUp">
              Level Up!
            </KrilinButtonEnhanced>
            
            <KrilinButtonEnhanced variant="success" sound={true}>
              With Sound
            </KrilinButtonEnhanced>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KrilinButtonEnhanced size="sm" variant="primary">
              Small Size
            </KrilinButtonEnhanced>
            
            <KrilinButtonEnhanced size="md" variant="secondary">
              Medium Size
            </KrilinButtonEnhanced>
            
            <KrilinButtonEnhanced size="lg" variant="accent">
              Large Size
            </KrilinButtonEnhanced>
          </div>
        </section>
        
        <section className="space-y-8">
          <h2 className="font-pixel text-2xl text-[#33272a] border-b-4 border-[#33272a] pb-2 mb-6">
            Enhanced Cards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <KrilinCardEnhanced
              title="Fade In Animation"
              variant="default"
              animation="fadeIn"
            >
              <p className="font-pixel text-sm">
                This card fades in smoothly when it enters the viewport.
              </p>
            </KrilinCardEnhanced>
            
            <KrilinCardEnhanced
              title="Interactive Card"
              variant="interactive"
              animation="slideIn"
              scanlines={true}
            >
              <p className="font-pixel text-sm">
                Hover over me to see interactive corner animations and scanlines!
              </p>
            </KrilinCardEnhanced>
            
            <KrilinCardEnhanced
              title="Glowing Card"
              variant="glowing"
              animation="bounce"
              crtEffect={true}
            >
              <p className="font-pixel text-sm">
                This card has a pulsing glow effect and CRT screen simulation.
              </p>
            </KrilinCardEnhanced>
            
            <KrilinCardEnhanced
              title="Elevated Card"
              variant="elevated"
              animation="grow"
              parallax={true}
            >
              <p className="font-pixel text-sm">
                Move your mouse around to see the parallax effect!
              </p>
            </KrilinCardEnhanced>
            
            <KrilinCardEnhanced
              title="Floating Card"
              variant="default"
              animation="fadeIn"
              floating={true}
              headerColor="#4ecdc4"
            >
              <p className="font-pixel text-sm">
                This card gently floats with random pixel movements.
              </p>
            </KrilinCardEnhanced>
            
            <KrilinCardEnhanced
              title="All Effects"
              variant="interactive"
              animation="slideIn"
              scanlines={true}
              crtEffect={true}
              headerColor="#ffc15e"
            >
              <p className="font-pixel text-sm">
                Combining multiple effects for maximum retro feel!
              </p>
            </KrilinCardEnhanced>
          </div>
        </section>
        
        <section className="space-y-8">
          <h2 className="font-pixel text-2xl text-[#33272a] border-b-4 border-[#33272a] pb-2 mb-6">
            Loading States
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-pixel text-sm text-[#594a4e]">Progress Bar</h3>
              <PixelLoader 
                variant="bar" 
                value={loadingValue} 
                showPercentage={true}
                text="Downloading..."
              />
              <button
                onClick={() => setLoadingValue(prev => prev >= 100 ? 0 : prev + 10)}
                className="font-pixel text-xs px-3 py-1 bg-[#ffc15e] border-2 border-[#33272a] hover:bg-[#ffd68a]"
              >
                Increase Progress
              </button>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-pixel text-sm text-[#594a4e]">Bouncing Dots</h3>
              <PixelLoader variant="dots" text="Processing" />
            </div>
            
            <div className="space-y-4">
              <h3 className="font-pixel text-sm text-[#594a4e]">Pixel Spinner</h3>
              <PixelLoader variant="spinner" text="Loading" />
            </div>
            
            <div className="space-y-4">
              <h3 className="font-pixel text-sm text-[#594a4e]">Glitch Effect</h3>
              <PixelLoader variant="glitch" text="LOADING" />
            </div>
            
            <div className="space-y-4">
              <h3 className="font-pixel text-sm text-[#594a4e]">Matrix Style</h3>
              <PixelLoader variant="matrix" text="Decrypting" />
            </div>
            
            <div className="space-y-4">
              <h3 className="font-pixel text-sm text-[#594a4e]">Large Spinner</h3>
              <PixelLoader variant="spinner" size="lg" text="Please wait" />
            </div>
          </div>
        </section>
        
        <section className="space-y-8">
          <h2 className="font-pixel text-2xl text-[#33272a] border-b-4 border-[#33272a] pb-2 mb-6">
            Animation Combinations
          </h2>
          
          <div className="p-8 bg-[#33272a] relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 animate-scanline">
                <div className="h-px bg-[#4ecdc4]" />
              </div>
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex flex-wrap gap-4">
                <div className="px-4 py-2 bg-[#ff6b35] font-pixel text-white animate-pixelPulse">
                  Pulse
                </div>
                <div className="px-4 py-2 bg-[#ffc15e] font-pixel text-[#33272a] animate-pixelBounce">
                  Bounce
                </div>
                <div className="px-4 py-2 bg-[#4ecdc4] font-pixel text-white animate-levelUp">
                  Level Up
                </div>
                <div className="px-4 py-2 bg-[#ff6b35] font-pixel text-white animate-pixelRotate">
                  Rotate
                </div>
                <div className="px-4 py-2 bg-[#ffc15e] font-pixel text-[#33272a] animate-pixelFlicker">
                  Flicker
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#fffaeb] p-4 border-4 border-[#ff6b35] animate-slideInLeft">
                  <p className="font-pixel text-sm">Slide from left</p>
                </div>
                <div className="bg-[#fffaeb] p-4 border-4 border-[#ffc15e] animate-pixelFade">
                  <p className="font-pixel text-sm">Fade in effect</p>
                </div>
                <div className="bg-[#fffaeb] p-4 border-4 border-[#4ecdc4] animate-slideInRight">
                  <p className="font-pixel text-sm">Slide from right</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <footer className="text-center py-8 border-t-4 border-[#33272a]">
          <p className="font-pixel text-sm text-[#594a4e]">
            Creative pixel animations with DRY principles • Krilin Design System
          </p>
        </footer>
      </div>
    </div>
  )
}