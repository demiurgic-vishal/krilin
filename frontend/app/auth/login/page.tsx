"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import Link from 'next/link'
import { Button } from '@/components/retroui/Button'
import { Card } from '@/components/retroui/Card'
import { Input } from '@/components/retroui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-[var(--font-head)] mb-2 uppercase tracking-wider">KRILIN AI</h1>
          <p className="text-[var(--muted-foreground)] uppercase tracking-wide">Your Power-Up Sidekick</p>
        </div>

        <Card>
          <Card.Header className="bg-[var(--primary)]">
            <Card.Title>Log In</Card.Title>
          </Card.Header>
          <Card.Content className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-[var(--danger)] border-2 border-[var(--border)] text-white shadow-[2px_2px_0_0_var(--border)]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-bold uppercase tracking-wide">Email</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-bold uppercase tracking-wide">Password</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging In...' : 'Log In'}
              </Button>
            </form>

            <div className="mt-6 text-center pt-4 border-t-2 border-[var(--border)]">
              <p className="text-sm text-[var(--muted-foreground)]">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-[var(--primary)] font-bold hover:underline uppercase">
                  Sign Up
                </Link>
              </p>
            </div>
          </Card.Content>
        </Card>

        <div className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
          <p className="uppercase tracking-wide">Remember: Size Doesn't Determine Strength!</p>
        </div>
      </div>
    </div>
  )
}
