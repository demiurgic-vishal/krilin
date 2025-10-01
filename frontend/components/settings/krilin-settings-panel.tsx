"use client"

import React from "react"
import KrilinCard from "@/components/krilin-card"
import KrilinButton from "@/components/krilin-button"
import KrilinPowerMeter from "@/components/krilin-power-meter"
import { cn } from "@/lib/utils"

interface KrilinSettingsPanelProps {
  className?: string
}

export default function KrilinSettingsPanel({ className }: KrilinSettingsPanelProps) {
  const [activeTab, setActiveTab] = React.useState("general")
  const [aiModel, setAiModel] = React.useState("gpt4")
  const [voiceEnabled, setVoiceEnabled] = React.useState(false)
  const [temperature, setTemperature] = React.useState(70)

  return (
    <KrilinCard title="POWER SETTINGS" className={cn("w-full", className)}>
      <div className="space-y-6">
        <div className="flex border-4 border-[#33272a] mb-6">
          {["general", "privacy", "advanced"].map((tab) => (
            <button
              key={tab}
              className={cn(
                "flex-1 py-2 px-4 text-center uppercase",
                activeTab === tab ? "bg-[#ff6b35] text-white" : "bg-[#fffaeb] text-[#33272a] hover:bg-[#ffc15e]/30",
              )}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold mb-2">AI MODEL</label>
              <div className="border-4 border-[#33272a] bg-white">
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full p-2 bg-transparent focus:outline-none"
                >
                  <option value="gpt4">GPT-4o (MAXIMUM POWER)</option>
                  <option value="gpt3">GPT-3.5 Turbo (BALANCED)</option>
                  <option value="claude">Claude (CREATIVE)</option>
                  <option value="llama">Llama 3 (EFFICIENT)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold">VOICE RESPONSES</label>
                <div
                  className={cn(
                    "w-12 h-6 border-4 border-[#33272a] relative cursor-pointer",
                    voiceEnabled ? "bg-[#ff6b35]" : "bg-[#594a4e]",
                  )}
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                >
                  <div
                    className={cn(
                      "absolute top-0 w-4 h-4 bg-white border-2 border-[#33272a] transition-transform",
                      voiceEnabled ? "transform translate-x-5" : "transform translate-x-0",
                    )}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-[#594a4e]">Enable spoken responses from your assistant</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="block text-sm font-bold">RESPONSE LENGTH</label>
                <span className="text-xs">MEDIUM</span>
              </div>
              <KrilinPowerMeter value={50} label="LENGTH" />
              <div className="flex justify-between text-xs text-[#594a4e]">
                <span>CONCISE</span>
                <span>DETAILED</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold">SAVE HISTORY</label>
                <div className="w-12 h-6 border-4 border-[#33272a] bg-[#ff6b35] relative cursor-pointer">
                  <div className="absolute top-0 w-4 h-4 bg-white border-2 border-[#33272a] transform translate-x-5"></div>
                </div>
              </div>
              <p className="text-xs text-[#594a4e]">Store your conversations for future reference</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold">DATA COLLECTION</label>
                <div className="w-12 h-6 border-4 border-[#33272a] bg-[#594a4e] relative cursor-pointer">
                  <div className="absolute top-0 w-4 h-4 bg-white border-2 border-[#33272a] transform translate-x-0"></div>
                </div>
              </div>
              <p className="text-xs text-[#594a4e]">Allow anonymous usage data to improve the assistant</p>
            </div>

            <div className="pt-4">
              <KrilinButton variant="secondary" className="text-xs gap-1.5 bg-red-500 text-white hover:bg-red-600">
                DELETE ALL CONVERSATION DATA
              </KrilinButton>
            </div>
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="block text-sm font-bold">TEMPERATURE</label>
                <span className="text-xs">{temperature}%</span>
              </div>
              <KrilinPowerMeter value={temperature} label="CREATIVITY" onChange={(value) => setTemperature(value)} />
              <div className="flex justify-between text-xs text-[#594a4e]">
                <span>PRECISE</span>
                <span>CREATIVE</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold">DEVELOPER MODE</label>
                <div className="w-12 h-6 border-4 border-[#33272a] bg-[#594a4e] relative cursor-pointer">
                  <div className="absolute top-0 w-4 h-4 bg-white border-2 border-[#33272a] transform translate-x-0"></div>
                </div>
              </div>
              <p className="text-xs text-[#594a4e]">Enable advanced features for developers</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold mb-2">CONTEXT WINDOW</label>
              <div className="border-4 border-[#33272a] bg-white">
                <select className="w-full p-2 bg-transparent focus:outline-none" defaultValue="medium">
                  <option value="small">SMALL (5 MESSAGES)</option>
                  <option value="medium">MEDIUM (15 MESSAGES)</option>
                  <option value="large">LARGE (30 MESSAGES)</option>
                  <option value="xl">MAXIMUM POWER (50 MESSAGES)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t-4 border-[#33272a]">
          <KrilinButton variant="secondary">RESET DEFAULTS</KrilinButton>
          <KrilinButton>SAVE SETTINGS</KrilinButton>
        </div>
      </div>
    </KrilinCard>
  )
}

