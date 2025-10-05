"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthContext"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Input } from "@/components/retroui/Input"
import { User, Mail, Clock, LogOut, Home, Shield } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const [fullName, setFullName] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      setFullName(user.full_name || '')
      setTimezone(user.timezone || 'UTC')
    }
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="text-3xl font-[var(--font-head)] mb-4 uppercase">Loading...</div>
          <div className="w-32 h-4 bg-[var(--muted)] mx-auto border-2 border-[var(--border)]">
            <div className="h-full bg-[var(--primary)] pixel-pulse w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    // TODO: Implement user update API call
    setTimeout(() => {
      setSaving(false)
      alert('Settings saved!')
    }, 1000)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <Home size={24} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider">
                Settings
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Manage your account</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {/* User Profile */}
          <Card>
            <Card.Header>
              <Card.Title>User Profile</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b-2 border-[var(--border)]">
                <div className="w-16 h-16 border-2 border-[var(--border)] bg-[var(--primary)] flex items-center justify-center shadow-[4px_4px_0_0_var(--border)]">
                  <User size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{user.full_name || 'User'}</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">{user.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 uppercase flex items-center gap-2">
                  <Mail size={16} />
                  Email
                </label>
                <Input
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-[var(--muted)] cursor-not-allowed"
                />
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 uppercase flex items-center gap-2">
                  <User size={16} />
                  Full Name
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 uppercase flex items-center gap-2">
                  <Clock size={16} />
                  Timezone
                </label>
                <Input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  disabled={saving}
                  placeholder="e.g., America/New_York"
                />
              </div>

              <div className="pt-4 border-t-2 border-[var(--border)]">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Card.Content>
          </Card>

          {/* Account Info */}
          <Card>
            <Card.Header className="bg-[var(--success)]">
              <Card.Title>Account Info</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-bold uppercase">Status</span>
                  <span className="px-3 py-1 bg-[var(--success)] text-[var(--success-foreground)] text-xs font-bold uppercase border-2 border-[var(--border)]">
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-bold uppercase">Verified</span>
                  <span className="px-3 py-1 bg-[var(--info)] text-[var(--info-foreground)] text-xs font-bold uppercase border-2 border-[var(--border)]">
                    {user.is_verified ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-bold uppercase">Member Since</span>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>

                {user.last_login && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-bold uppercase">Last Login</span>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {new Date(user.last_login).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Danger Zone */}
          <Card>
            <Card.Header className="bg-[var(--destructive)]">
              <Card.Title className="text-[var(--destructive-foreground)]">Danger Zone</Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Logout from your account. You'll need to login again to access Krilin.
              </p>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </Card.Content>
          </Card>
        </div>
      </main>
    </div>
  )
}
