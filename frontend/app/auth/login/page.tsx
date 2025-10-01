"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import Link from 'next/link'
import KrilinButton from '@/components/krilin-button'
import KrilinCard from '@/components/krilin-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div className="min-h-screen flex items-center justify-center bg-[#fef6e4] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#33272a] font-pixel mb-2">KRILIN AI</h1>
          <p className="text-[#594a4e]">YOUR POWER-UP SIDEKICK</p>
        </div>

        <KrilinCard>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-[#33272a] font-pixel mb-6">LOG IN</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-[#33272a] font-bold">EMAIL</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 border-2 border-[#33272a]"
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-[#33272a] font-bold">PASSWORD</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 border-2 border-[#33272a]"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <KrilinButton type="submit" className="w-full" disabled={loading}>
                {loading ? 'LOGGING IN...' : 'LOG IN'}
              </KrilinButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#594a4e]">
                DON'T HAVE AN ACCOUNT?{' '}
                <Link href="/auth/signup" className="text-[#ff6b35] font-bold hover:underline">
                  SIGN UP
                </Link>
              </p>
            </div>
          </div>
        </KrilinCard>

        <div className="mt-4 text-center text-sm text-[#594a4e]">
          <p>REMEMBER: SIZE DOESN'T DETERMINE STRENGTH!</p>
        </div>
      </div>
    </div>
  )
}
