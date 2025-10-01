"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import KrilinPageLayout from "@/components/krilin-page-layout"
import KrilinCardEnhanced from "@/components/krilin-card-enhanced"
import KrilinButtonEnhanced from "@/components/krilin-button-enhanced"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Clock, LogOut } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center bg-[#fef6e4]">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#33272a] font-pixel mb-4">LOADING...</div>
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
    <KrilinPageLayout
      title="SYSTEM CONFIGURATION"
      showBackButton={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Settings" }
      ]}
      footerSubtitle="POWER UP YOUR PRODUCTIVITY"
      containerSize="md"
    >
      <KrilinCardEnhanced
        title="USER PROFILE"
        variant="default"
        headerColor="#ff6b35"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b-2 border-[#33272a]/20">
            <div className="w-16 h-16 rounded-full bg-[#ff6b35] flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#33272a]">
                {user.full_name || 'Warrior'}
              </h3>
              <p className="text-sm text-[#594a4e]">{user.email}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="font-bold flex items-center gap-2">
              <Mail size={16} />
              EMAIL
            </Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="mt-2 border-2 border-[#33272a] bg-gray-100"
            />
            <p className="text-xs text-[#594a4e] mt-1">Email cannot be changed</p>
          </div>

          <div>
            <Label htmlFor="fullName" className="font-bold flex items-center gap-2">
              <User size={16} />
              FULL NAME
            </Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 border-2 border-[#33272a]"
              disabled={saving}
            />
          </div>

          <div>
            <Label htmlFor="timezone" className="font-bold flex items-center gap-2">
              <Clock size={16} />
              TIMEZONE
            </Label>
            <Input
              id="timezone"
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-2 border-2 border-[#33272a]"
              disabled={saving}
              placeholder="e.g., America/New_York"
            />
          </div>

          <div className="pt-4 border-t-2 border-[#33272a]/20">
            <KrilinButtonEnhanced
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </KrilinButtonEnhanced>
          </div>
        </div>
      </KrilinCardEnhanced>

      <KrilinCardEnhanced
        title="ACCOUNT INFO"
        variant="default"
        headerColor="#4ecdc4"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-bold">ACCOUNT STATUS</span>
            <span className="px-3 py-1 bg-[#95e1d3] text-[#33272a] text-xs font-bold">
              {user.is_active ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-bold">VERIFIED</span>
            <span className="px-3 py-1 bg-[#4ecdc4] text-white text-xs font-bold">
              {user.is_verified ? 'YES' : 'NO'}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-bold">MEMBER SINCE</span>
            <span className="text-sm text-[#594a4e]">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>

          {user.last_login && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-bold">LAST LOGIN</span>
              <span className="text-sm text-[#594a4e]">
                {new Date(user.last_login).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </KrilinCardEnhanced>

      <KrilinCardEnhanced
        title="DANGER ZONE"
        variant="default"
        headerColor="#ff6b35"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#594a4e]">
            Logout from your account. You'll need to login again to access Krilin AI.
          </p>

          <KrilinButtonEnhanced
            variant="secondary"
            onClick={handleLogout}
            className="w-full gap-2 bg-red-100 hover:bg-red-200 text-red-700"
          >
            <LogOut size={16} />
            LOGOUT
          </KrilinButtonEnhanced>
        </div>
      </KrilinCardEnhanced>
    </KrilinPageLayout>
  )
}