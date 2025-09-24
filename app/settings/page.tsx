"use client"
import KrilinHeader from "@/components/krilin-header"
import KrilinButton from "@/components/krilin-button"
import KrilinSettingsPanel from "@/components/settings/krilin-settings-panel"
import { ArrowLeft } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#fffaeb] font-pixel">
      <KrilinHeader />

      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-4">
          <KrilinButton variant="secondary" onClick={() => (window.location.href = "/")} className="gap-2">
            <ArrowLeft size={16} />
            BACK
          </KrilinButton>
        </div>

        <div className="pixel-border bg-[#594a4e] p-1 mb-6">
          <div className="bg-[#33272a] text-white p-2 text-center">
            <h1 className="text-xl">SYSTEM CONFIGURATION</h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <KrilinSettingsPanel />
        </div>
      </main>

      <footer className="bg-[#33272a] text-white p-4 text-center text-xs mt-8">
        <p>© 2025 KRILIN.AI - PERSONAL ASSISTANT</p>
        <p className="mt-2">POWER UP YOUR PRODUCTIVITY</p>
      </footer>
    </div>
  )
}

