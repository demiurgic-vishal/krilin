"use client"

import { useState } from "react"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Slider } from "../ui/slider"
import { Switch } from "../ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"

// Device types for smart home integration
type SmartDevice = {
  id: string
  name: string
  type: "light" | "thermostat" | "lock" | "camera" | "speaker" | "sensor"
  room: string
  status: string
  batteryLevel?: number
  isOn?: boolean
  brightness?: number
  temperature?: number
  humidity?: number
  motion?: boolean
}

type Scene = {
  id: string
  name: string
  icon: string
  devices: string[]
  active: boolean
}

type Automation = {
  id: string
  name: string
  trigger: string
  action: string
  active: boolean
  lastRun?: string
}

export default function KrilinSmartHome() {
  // Sample smart home devices
  const [devices, setDevices] = useState<SmartDevice[]>([
    { id: "l1", name: "Living Room Light", type: "light", room: "Living Room", status: "Online", isOn: true, brightness: 70 },
    { id: "l2", name: "Bedroom Light", type: "light", room: "Bedroom", status: "Online", isOn: false, brightness: 50 },
    { id: "t1", name: "Living Room Thermostat", type: "thermostat", room: "Living Room", status: "Online", temperature: 72, humidity: 45 },
    { id: "lock1", name: "Front Door", type: "lock", room: "Entryway", status: "Online", isOn: true, batteryLevel: 85 },
    { id: "cam1", name: "Doorbell Camera", type: "camera", room: "Entryway", status: "Online", batteryLevel: 90 },
    { id: "s1", name: "Kitchen Speaker", type: "speaker", room: "Kitchen", status: "Online", isOn: false },
    { id: "sensor1", name: "Living Room Motion", type: "sensor", room: "Living Room", status: "Online", motion: false, batteryLevel: 75 }
  ])
  
  // Sample scenes
  const [scenes, setScenes] = useState<Scene[]>([
    { id: "sc1", name: "Morning Routine", icon: "🌅", devices: ["l1", "t1", "s1"], active: false },
    { id: "sc2", name: "Movie Night", icon: "🎬", devices: ["l1", "l2"], active: false },
    { id: "sc3", name: "Away Mode", icon: "🏃", devices: ["l1", "l2", "lock1", "cam1"], active: false },
    { id: "sc4", name: "Bedtime", icon: "🌙", devices: ["l1", "l2", "t1", "lock1"], active: false }
  ])
  
  // Sample automations
  const [automations, setAutomations] = useState<Automation[]>([
    { 
      id: "a1", 
      name: "Turn on lights at sunset", 
      trigger: "When sun sets (detected via Weather MCP)", 
      action: "Turn on Living Room and Porch lights",
      active: true,
      lastRun: "Yesterday, 6:42 PM"
    },
    { 
      id: "a2", 
      name: "Energy saving mode", 
      trigger: "When energy usage exceeds daily average (detected via Energy MCP)",
      action: "Reduce brightness of all lights by 20%",
      active: true,
      lastRun: "Today, 2:15 PM"
    },
    { 
      id: "a3", 
      name: "Secure home when away", 
      trigger: "When no one is home (detected via Location MCP)",
      action: "Lock all doors, enable cameras, set thermostat to eco mode",
      active: true,
      lastRun: "Today, 8:30 AM"
    },
    { 
      id: "a4", 
      name: "Morning coffee", 
      trigger: "When alarm goes off (detected via Calendar MCP)",
      action: "Turn on kitchen lights and start coffee maker",
      active: false
    }
  ])
  
  const [activeTab, setActiveTab] = useState("devices")
  
  const toggleDevice = (id: string) => {
    setDevices(devices.map(device => {
      if (device.id === id && device.isOn !== undefined) {
        return { ...device, isOn: !device.isOn }
      }
      return device
    }))
  }
  
  const updateBrightness = (id: string, value: number) => {
    setDevices(devices.map(device => {
      if (device.id === id && device.brightness !== undefined) {
        return { ...device, brightness: value }
      }
      return device
    }))
  }
  
  const updateTemperature = (id: string, value: number) => {
    setDevices(devices.map(device => {
      if (device.id === id && device.temperature !== undefined) {
        return { ...device, temperature: value }
      }
      return device
    }))
  }
  
  const activateScene = (id: string) => {
    // Update scenes to mark selected as active
    setScenes(scenes.map(scene => ({
      ...scene,
      active: scene.id === id
    })))
    
    // Simulate device changes based on scene
    if (id === "sc1") { // Morning routine
      setDevices(devices.map(device => {
        if (device.id === "l1") return { ...device, isOn: true, brightness: 80 }
        if (device.id === "t1") return { ...device, temperature: 72 }
        if (device.id === "s1") return { ...device, isOn: true }
        return device
      }))
    } else if (id === "sc2") { // Movie night
      setDevices(devices.map(device => {
        if (device.id === "l1") return { ...device, isOn: true, brightness: 30 }
        if (device.id === "l2") return { ...device, isOn: false }
        return device
      }))
    }
    // Other scenes would have similar logic
  }
  
  const toggleAutomation = (id: string) => {
    setAutomations(automations.map(automation => {
      if (automation.id === id) {
        return { ...automation, active: !automation.active }
      }
      return automation
    }))
  }
  
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white shadow-md rounded-lg border-2 border-[#ffc6c7]">
        <h2 className="text-2xl font-bold text-[#33272a] mb-4">SMART HOME CONTROL</h2>
        <p className="text-[#594a4e] mb-6">
          Control your smart home devices and create automations that integrate with your other data sources via MCP servers.
        </p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="devices">DEVICES</TabsTrigger>
            <TabsTrigger value="scenes">SCENES</TabsTrigger>
            <TabsTrigger value="automations">AUTOMATIONS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="devices" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Connected Devices</h3>
              <Button variant="outline" size="sm">Add Device</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map(device => (
                <Card key={device.id} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-bold">{device.name}</div>
                      <div className="text-xs text-[#594a4e]">{device.room} • {device.status}</div>
                    </div>
                    <Badge variant={device.status === "Online" ? "default" : "destructive"}>
                      {device.status}
                    </Badge>
                  </div>
                  
                  {device.batteryLevel !== undefined && (
                    <div className="mb-4">
                      <div className="text-sm text-[#594a4e] mb-1">Battery</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${device.batteryLevel}%` }}
                        />
                      </div>
                      <div className="text-xs text-right mt-1">{device.batteryLevel}%</div>
                    </div>
                  )}
                  
                  {device.isOn !== undefined && (
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-[#594a4e]">{device.type === "lock" ? "Locked" : "Power"}</span>
                      <Switch 
                        checked={device.isOn} 
                        onCheckedChange={() => toggleDevice(device.id)} 
                      />
                    </div>
                  )}
                  
                  {device.brightness !== undefined && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-[#594a4e]">Brightness</span>
                        <span className="text-xs">{device.brightness}%</span>
                      </div>
                      <Slider
                        value={[device.brightness]}
                        min={5}
                        max={100}
                        step={5}
                        disabled={!device.isOn}
                        onValueChange={(value) => updateBrightness(device.id, value[0])}
                      />
                    </div>
                  )}
                  
                  {device.temperature !== undefined && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-[#594a4e]">Temperature</span>
                        <span className="text-xs">{device.temperature}°F</span>
                      </div>
                      <Slider
                        value={[device.temperature]}
                        min={60}
                        max={80}
                        step={1}
                        onValueChange={(value) => updateTemperature(device.id, value[0])}
                      />
                    </div>
                  )}
                  
                  {device.motion !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#594a4e]">Motion Detected</span>
                      <Badge variant={device.motion ? "default" : "outline"}>{device.motion ? "Yes" : "No"}</Badge>
                    </div>
                  )}
                </Card>
              ))}
            </div>
            
            <p className="text-xs text-[#594a4e] mt-4">
              Data provided by Smart Home MCP Server • Last updated: {new Date().toLocaleTimeString()}
            </p>
          </TabsContent>
          
          <TabsContent value="scenes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Scenes</h3>
              <Button variant="outline" size="sm">Create Scene</Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {scenes.map(scene => (
                <Card 
                  key={scene.id} 
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${scene.active ? 'border-2 border-[#ff8ba7]' : ''}`}
                  onClick={() => activateScene(scene.id)}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{scene.icon}</div>
                    <div className="font-bold">{scene.name}</div>
                    <div className="text-xs text-[#594a4e] mt-1">
                      {scene.devices.length} devices
                    </div>
                    <Button 
                      variant={scene.active ? "default" : "outline"} 
                      size="sm"
                      className="mt-3 w-full"
                    >
                      {scene.active ? "Active" : "Activate"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="mt-6 bg-[#faeee7] p-4 rounded-lg">
              <h4 className="font-bold mb-2">Data Integration with Scenes</h4>
              <p className="text-sm text-[#594a4e] mb-3">
                Scenes can be triggered automatically based on data from your connected MCP servers:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="text-[#ff8ba7] font-bold">→</div>
                  <div>Activate "Movie Night" when your streaming service starts playing (Media MCP)</div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="text-[#ff8ba7] font-bold">→</div>
                  <div>Set "Away Mode" automatically based on your location (Location MCP)</div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="text-[#ff8ba7] font-bold">→</div>
                  <div>Trigger "Bedtime" based on your sleep schedule goals (Health MCP)</div>
                </li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="automations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Smart Automations</h3>
              <Button variant="outline" size="sm">Create Automation</Button>
            </div>
            
            <div className="space-y-4">
              {automations.map(automation => (
                <Card key={automation.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold">{automation.name}</h4>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm">
                          <span className="text-[#594a4e]">Trigger: </span>
                          {automation.trigger}
                        </div>
                        <div className="text-sm">
                          <span className="text-[#594a4e]">Action: </span>
                          {automation.action}
                        </div>
                        {automation.lastRun && (
                          <div className="text-xs text-[#594a4e]">
                            Last run: {automation.lastRun}
                          </div>
                        )}
                      </div>
                    </div>
                    <Switch 
                      checked={automation.active} 
                      onCheckedChange={() => toggleAutomation(automation.id)} 
                    />
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="mt-6 bg-[#faeee7] p-4 rounded-lg">
              <h4 className="font-bold mb-2">Cross-Service Automations</h4>
              <p className="text-sm text-[#594a4e] mb-3">
                Create powerful automations that work across multiple services using MCP integrations:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="text-[#ff8ba7] font-bold">→</div>
                  <div>When health metrics indicate stress (Health MCP), dim lights and play calming music</div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="text-[#ff8ba7] font-bold">→</div>
                  <div>When weather forecast shows rain (Weather MCP), turn on dehumidifier</div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="text-[#ff8ba7] font-bold">→</div>
                  <div>When calendar shows meeting (Calendar MCP), adjust lighting for video calls</div>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
