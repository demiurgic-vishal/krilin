"use client"

import Link from "next/link"
import { MessageSquare, Target, Zap, TrendingUp, Brain, Sparkles } from "lucide-react"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
              KRILIN
            </h1>
            <nav className="flex gap-3">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="text-7xl md:text-9xl font-[var(--font-head)]">
              <span className="text-outlined">KRILIN</span>
            </div>
          </div>
          <p className="text-2xl md:text-3xl mb-4 font-medium">
            Your Retro AI Productivity Companion
          </p>
          <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto mb-8">
            Power up your productivity with AI-driven chat, goal tracking, and workflow automation.
            Built with a clean retro aesthetic for the modern age.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard">
              <Button size="lg" className="min-w-[200px]">
                Launch Dashboard
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" size="lg" className="min-w-[200px]">
                Start Chatting
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <Link href="/chat" className="group">
            <div className="border-2 border-[var(--border)] bg-[var(--primary)] p-8 shadow-[4px_4px_0_0_var(--border)] transition-all hover:shadow-[8px_8px_0_0_var(--border)] hover:translate-x-[-4px] hover:translate-y-[-4px]">
              <MessageSquare size={48} className="mb-4" />
              <h3 className="text-2xl font-bold mb-2 uppercase">Chat</h3>
              <p className="text-sm">AI-powered conversations</p>
            </div>
          </Link>

          <Link href="/goals" className="group">
            <div className="border-2 border-[var(--border)] bg-[var(--success)] p-8 shadow-[4px_4px_0_0_var(--border)] transition-all hover:shadow-[8px_8px_0_0_var(--border)] hover:translate-x-[-4px] hover:translate-y-[-4px]">
              <Target size={48} className="mb-4" />
              <h3 className="text-2xl font-bold mb-2 uppercase">Goals</h3>
              <p className="text-sm">Track and achieve objectives</p>
            </div>
          </Link>

          <Link href="/workflows" className="group">
            <div className="border-2 border-[var(--border)] bg-[var(--accent)] p-8 shadow-[4px_4px_0_0_var(--border)] transition-all hover:shadow-[8px_8px_0_0_var(--border)] hover:translate-x-[-4px] hover:translate-y-[-4px]">
              <Zap size={48} className="mb-4" />
              <h3 className="text-2xl font-bold mb-2 uppercase">Workflows</h3>
              <p className="text-sm">Automate your tasks</p>
            </div>
          </Link>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-[var(--font-head)] text-center mb-12 uppercase">
            Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <Card.Header>
                <div className="flex items-center gap-3">
                  <Brain size={32} />
                  <Card.Title>AI Assistant</Card.Title>
                </div>
                <Card.Description>Claude-powered intelligence</Card.Description>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Chat with an intelligent AI assistant powered by Claude. Get help with tasks, questions, creative projects, and complex problem-solving.
                </p>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <div className="flex items-center gap-3">
                  <TrendingUp size={32} />
                  <Card.Title>Goal Tracking</Card.Title>
                </div>
                <Card.Description>Achieve more, track better</Card.Description>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Set, track, and achieve your goals with visual progress tracking. Stay motivated with real-time updates and achievement milestones.
                </p>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <div className="flex items-center gap-3">
                  <Sparkles size={32} />
                  <Card.Title>Smart Workflows</Card.Title>
                </div>
                <Card.Description>Work smarter, not harder</Card.Description>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Automate repetitive tasks and create custom workflows. Streamline your productivity with intelligent automation.
                </p>
              </Card.Content>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-[var(--border)] bg-[var(--secondary)] text-[var(--secondary-foreground)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm">
              © 2025 KRILIN - Built with retro vibes for modern productivity
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}