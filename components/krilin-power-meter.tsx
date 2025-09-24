"use client"

import type React from "react"

interface KrilinPowerMeterProps {
  value: number // 0-100
  label?: string
  className?: string
}

export default function KrilinPowerMeter({ value, label = "POWER LEVEL", className = "" }: KrilinPowerMeterProps) {
  // Ensure value is between 0-100
  const safeValue = Math.max(0, Math.min(100, value))

  // Calculate color based on value
  let color = "#4ecdc4" // low
  if (safeValue > 30) color = "#ffd166" // medium
  if (safeValue > 70) color = "#ff6b6b" // high
  if (safeValue > 90) color = "#ff0000" // very high

  return (
    <div className={`${className}`}>
      <div className="flex justify-between mb-1">
        <span className="font-pixel text-xs text-[#33272a]">{label}</span>
        <span className="font-pixel text-xs text-[#33272a]">{safeValue}</span>
      </div>

      {/* Meter background */}
      <div className="h-6 bg-[#e5e5e5] border-2 border-[#33272a] relative">
        {/* Pixel corners */}
        <div className="absolute w-2 h-2 bg-[#33272a] top-[-2px] left-[-2px]"></div>
        <div className="absolute w-2 h-2 bg-[#33272a] top-[-2px] right-[-2px]"></div>
        <div className="absolute w-2 h-2 bg-[#33272a] bottom-[-2px] left-[-2px]"></div>
        <div className="absolute w-2 h-2 bg-[#33272a] bottom-[-2px] right-[-2px]"></div>

        {/* Meter fill */}
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${safeValue}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        ></div>

        {/* Meter segments */}
        <div className="absolute inset-0 flex">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex-1 border-r border-[#33272a] last:border-r-0"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

