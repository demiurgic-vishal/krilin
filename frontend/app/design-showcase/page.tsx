"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { PixelLoader } from "@/components/ui/pixel-loader"
import { useTypewriterEffect, usePixelTrail } from "@/hooks/use-animations"
import { ArrowLeft } from "lucide-react"

export default function DesignShowcase() {
  const [loadingValue, setLoadingValue] = useState(30)
  const { displayedText, cursorClass } = useTypewriterEffect("Welcome to Krilin's Creative Pixel Universe!", 50)
  const trail = usePixelTrail(8)

  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      {trail.map((props) => (
        <div
          key={props.key}
          style={props.style}
          className="w-2 h-2 bg-[var(--primary)] pointer-events-none"
        />
      ))}

      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
                Design Showcase
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Creative pixel animations with consistent design</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="text-center mb-12">
          <h2 className="font-[var(--font-head)] text-4xl mb-4 uppercase">
            {displayedText}
            <span className={`inline-block w-3 h-5 bg-[var(--foreground)] ml-1 ${cursorClass}`} />
          </h2>
          <p className="text-[var(--muted-foreground)] animate-pixelFade">
            Showcasing creative animations with consistent pixelated design
          </p>
        </div>

        <section className="space-y-8">
          <h2 className="font-[var(--font-head)] text-2xl border-b-4 border-[var(--border)] pb-2 mb-6 uppercase">
            Enhanced Buttons
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button variant="default" className="animate-pixelPulse">
              Pulse Effect
            </Button>

            <Button variant="secondary" className="animate-pixelGlitch">
              Glitch Mode
            </Button>

            <Button variant="accent" className="animate-pixelBounce">
              Bouncy
            </Button>

            <Button variant="danger" className="animate-levelUp">
              Level Up!
            </Button>

            <Button variant="success">
              With Sound
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button size="sm" variant="default">
              Small Size
            </Button>

            <Button size="sm" variant="secondary">
              Medium Size
            </Button>

            <Button size="lg" variant="accent">
              Large Size
            </Button>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="font-[var(--font-head)] text-2xl border-b-4 border-[var(--border)] pb-2 mb-6 uppercase">
            Enhanced Cards
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="animate-pixelFade">
              <Card.Header className="bg-[var(--primary)]">
                <Card.Title>Fade In Animation</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-sm">
                  This card fades in smoothly when it enters the viewport.
                </p>
              </Card.Content>
            </Card>

            <Card className="animate-slideInLeft hover:shadow-[8px_8px_0_0_var(--border)] transition-all">
              <Card.Header className="bg-[var(--success)]">
                <Card.Title>Interactive Card</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-sm">
                  Hover over me to see interactive corner animations and scanlines!
                </p>
              </Card.Content>
            </Card>

            <Card className="animate-pixelPulse shadow-[0_0_20px_var(--primary)]">
              <Card.Header className="bg-[var(--info)]">
                <Card.Title>Glowing Card</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-sm">
                  This card has a pulsing glow effect and CRT screen simulation.
                </p>
              </Card.Content>
            </Card>

            <Card className="animate-grow">
              <Card.Header className="bg-[var(--warning)]">
                <Card.Title>Elevated Card</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-sm">
                  Move your mouse around to see the parallax effect!
                </p>
              </Card.Content>
            </Card>

            <Card className="animate-pixelFloat">
              <Card.Header className="bg-[var(--success)]">
                <Card.Title>Floating Card</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-sm">
                  This card gently floats with random pixel movements.
                </p>
              </Card.Content>
            </Card>

            <Card className="animate-slideInRight">
              <Card.Header className="bg-[var(--accent)]">
                <Card.Title>All Effects</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-sm">
                  Combining multiple effects for maximum retro feel!
                </p>
              </Card.Content>
            </Card>
          </div>
        </section>


        <section className="space-y-8">
          <h2 className="font-[var(--font-head)] text-2xl border-b-4 border-[var(--border)] pb-2 mb-6 uppercase">
            Loading States
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <Card.Header className="bg-[var(--primary)]">
                <Card.Title>Progress Bar</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-4">
                <PixelLoader
                  variant="bar"
                  value={loadingValue}
                  showPercentage={true}
                  text="Downloading..."
                />
                <Button
                  onClick={() => setLoadingValue(prev => prev >= 100 ? 0 : prev + 10)}
                  size="sm"
                  variant="secondary"
                >
                  Increase Progress
                </Button>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header className="bg-[var(--success)]">
                <Card.Title>Bouncing Dots</Card.Title>
              </Card.Header>
              <Card.Content>
                <PixelLoader variant="dots" text="Processing" />
              </Card.Content>
            </Card>

            <Card>
              <Card.Header className="bg-[var(--info)]">
                <Card.Title>Pixel Spinner</Card.Title>
              </Card.Header>
              <Card.Content>
                <PixelLoader variant="spinner" text="Loading" />
              </Card.Content>
            </Card>

            <Card>
              <Card.Header className="bg-[var(--warning)]">
                <Card.Title>Glitch Effect</Card.Title>
              </Card.Header>
              <Card.Content>
                <PixelLoader variant="glitch" text="LOADING" />
              </Card.Content>
            </Card>

            <Card>
              <Card.Header className="bg-[var(--accent)]">
                <Card.Title>Matrix Style</Card.Title>
              </Card.Header>
              <Card.Content>
                <PixelLoader variant="matrix" text="Decrypting" />
              </Card.Content>
            </Card>

            <Card>
              <Card.Header className="bg-[var(--primary)]">
                <Card.Title>Large Spinner</Card.Title>
              </Card.Header>
              <Card.Content>
                <PixelLoader variant="spinner" size="lg" text="Please wait" />
              </Card.Content>
            </Card>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="font-[var(--font-head)] text-2xl border-b-4 border-[var(--border)] pb-2 mb-6 uppercase">
            Animation Combinations
          </h2>

          <Card className="bg-[var(--card)] relative overflow-hidden">
            <Card.Content className="p-8">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 animate-scanline">
                  <div className="h-px bg-[var(--success)]" />
                </div>
              </div>

              <div className="relative z-10 space-y-6">
                <div className="flex flex-wrap gap-4">
                  <div className="px-4 py-2 bg-[var(--primary)] border-2 border-[var(--border)] animate-pixelPulse shadow-[2px_2px_0_0_var(--border)]">
                    Pulse
                  </div>
                  <div className="px-4 py-2 bg-[var(--accent)] border-2 border-[var(--border)] animate-pixelBounce shadow-[2px_2px_0_0_var(--border)]">
                    Bounce
                  </div>
                  <div className="px-4 py-2 bg-[var(--success)] border-2 border-[var(--border)] animate-levelUp shadow-[2px_2px_0_0_var(--border)]">
                    Level Up
                  </div>
                  <div className="px-4 py-2 bg-[var(--warning)] border-2 border-[var(--border)] animate-pixelRotate shadow-[2px_2px_0_0_var(--border)]">
                    Rotate
                  </div>
                  <div className="px-4 py-2 bg-[var(--info)] border-2 border-[var(--border)] animate-pixelFlicker shadow-[2px_2px_0_0_var(--border)]">
                    Flicker
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[var(--card)] p-4 border-4 border-[var(--primary)] animate-slideInLeft shadow-[4px_4px_0_0_var(--border)]">
                    <p className="text-sm">Slide from left</p>
                  </div>
                  <div className="bg-[var(--card)] p-4 border-4 border-[var(--accent)] animate-pixelFade shadow-[4px_4px_0_0_var(--border)]">
                    <p className="text-sm">Fade in effect</p>
                  </div>
                  <div className="bg-[var(--card)] p-4 border-4 border-[var(--success)] animate-slideInRight shadow-[4px_4px_0_0_var(--border)]">
                    <p className="text-sm">Slide from right</p>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        </section>

        <footer className="text-center py-8 border-t-4 border-[var(--border)]">
          <p className="text-sm text-[var(--muted-foreground)]">
            Creative pixel animations with DRY principles • Krilin Design System
          </p>
        </footer>
      </main>
    </div>
  )
}