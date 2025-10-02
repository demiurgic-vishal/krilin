"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import Link from 'next/link'
import { Button } from '@/components/retroui/Button'
import { Card } from '@/components/retroui/Card'
import { Input } from '@/components/retroui/Input'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [validationError, setValidationError] = useState('')
  const { register, loading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters')
      return
    }

    try {
      await register(email, password, fullName || undefined)
    } catch (error) {
      console.error('Registration failed:', error)
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
          <Card.Header className="bg-[var(--success)]">
            <Card.Title>Sign Up</Card.Title>
          </Card.Header>
          <Card.Content className="p-6 space-y-4">
            {(error || validationError) && (
              <div className="p-3 bg-[var(--danger)] border-2 border-[var(--border)] text-white shadow-[2px_2px_0_0_var(--border)]">
                {error || validationError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-bold uppercase tracking-wide">
                  Full Name <span className="text-[var(--muted-foreground)]">(Optional)</span>
                </label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  disabled={loading}
                />
              </div>

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
                  minLength={8}
                />
                <p className="text-xs text-[var(--muted-foreground)]">Must be at least 8 characters</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-bold uppercase tracking-wide">Confirm Password</label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-6 text-center pt-4 border-t-2 border-[var(--border)]">
              <p className="text-sm text-[var(--muted-foreground)]">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-[var(--primary)] font-bold hover:underline uppercase">
                  Log In
                </Link>
              </p>
            </div>
          </Card.Content>
        </Card>

        <div className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
          <p className="uppercase tracking-wide">Join The Z-Fighters Today!</p>
        </div>
      </div>
    </div>
  )
}
