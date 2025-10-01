"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import Link from 'next/link'
import KrilinButton from '@/components/krilin-button'
import KrilinCard from '@/components/krilin-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div className="min-h-screen flex items-center justify-center bg-[#fef6e4] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#33272a] font-pixel mb-2">KRILIN AI</h1>
          <p className="text-[#594a4e]">YOUR POWER-UP SIDEKICK</p>
        </div>

        <KrilinCard>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-[#33272a] font-pixel mb-6">SIGN UP</h2>

            {(error || validationError) && (
              <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 text-red-700 rounded">
                {error || validationError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-[#33272a] font-bold">FULL NAME (OPTIONAL)</Label>
                <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 border-2 border-[#33272a]" placeholder="Your Name" disabled={loading} />
              </div>

              <div>
                <Label htmlFor="email" className="text-[#33272a] font-bold">EMAIL</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 border-2 border-[#33272a]" placeholder="your@email.com" disabled={loading} />
              </div>

              <div>
                <Label htmlFor="password" className="text-[#33272a] font-bold">PASSWORD</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 border-2 border-[#33272a]" placeholder="••••••••" disabled={loading} minLength={8} />
                <p className="text-xs text-[#594a4e] mt-1">Must be at least 8 characters</p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-[#33272a] font-bold">CONFIRM PASSWORD</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 border-2 border-[#33272a]" placeholder="••••••••" disabled={loading} />
              </div>

              <KrilinButton type="submit" className="w-full" disabled={loading}>
                {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
              </KrilinButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#594a4e]">
                ALREADY HAVE AN ACCOUNT?{' '}
                <Link href="/auth/login" className="text-[#ff6b35] font-bold hover:underline">LOG IN</Link>
              </p>
            </div>
          </div>
        </KrilinCard>

        <div className="mt-4 text-center text-sm text-[#594a4e]">
          <p>JOIN THE Z-FIGHTERS TODAY!</p>
        </div>
      </div>
    </div>
  )
}
