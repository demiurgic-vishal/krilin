import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Save, Trash2 } from "lucide-react"

interface SettingsPanelProps {
  className?: string
}

export default function SettingsPanel({ className }: SettingsPanelProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Assistant Settings</CardTitle>
        <CardDescription>Customize how your AI assistant works</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assistant-name">Assistant Name</Label>
                <Select defaultValue="default">
                  <SelectTrigger id="assistant-name">
                    <SelectValue placeholder="Select assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Assistant</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <Select defaultValue="gpt4">
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt4">GPT-4o</SelectItem>
                    <SelectItem value="gpt3">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude">Claude</SelectItem>
                    <SelectItem value="llama">Llama 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="voice-responses">Voice Responses</Label>
                  <div className="text-xs text-muted-foreground">Enable spoken responses from your assistant</div>
                </div>
                <Switch id="voice-responses" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="response-length">Response Length</Label>
                  <span className="text-xs text-muted-foreground">Medium</span>
                </div>
                <Slider id="response-length" defaultValue={[50]} max={100} step={1} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Concise</span>
                  <span>Detailed</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="save-history">Save Conversation History</Label>
                  <div className="text-xs text-muted-foreground">Store your conversations for future reference</div>
                </div>
                <Switch id="save-history" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="data-collection">Data Collection</Label>
                  <div className="text-xs text-muted-foreground">
                    Allow anonymous usage data to improve the assistant
                  </div>
                </div>
                <Switch id="data-collection" />
              </div>

              <div className="pt-4">
                <Button variant="destructive" size="sm" className="gap-1">
                  <Trash2 size={14} />
                  Delete All Conversation Data
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Slider id="temperature" defaultValue={[70]} max={100} step={1} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="api-mode">Developer API Mode</Label>
                  <div className="text-xs text-muted-foreground">Enable advanced features for developers</div>
                </div>
                <Switch id="api-mode" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="context-window">Context Window</Label>
                <Select defaultValue="medium">
                  <SelectTrigger id="context-window">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (5 messages)</SelectItem>
                    <SelectItem value="medium">Medium (15 messages)</SelectItem>
                    <SelectItem value="large">Large (30 messages)</SelectItem>
                    <SelectItem value="xl">Extra Large (50 messages)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Reset to Defaults</Button>
        <Button className="gap-1">
          <Save size={14} />
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  )
}

