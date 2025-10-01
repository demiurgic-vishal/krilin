"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { ArrowRight, ArrowLeft, Check } from "lucide-react"

interface OnboardingStepsProps {
  onComplete: () => void
  className?: string
}

export default function OnboardingSteps({ onComplete, className }: OnboardingStepsProps) {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    assistantType: "general",
    notifications: true,
  })

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const steps = [
    {
      title: "Welcome to Your AI Assistant",
      description: "Let's set up your personal assistant in a few quick steps",
      content: (
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">What should I call you?</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
            />
          </div>
        </div>
      ),
    },
    {
      title: "Choose Your Assistant Type",
      description: "Select the type of assistant that best fits your needs",
      content: (
        <div className="space-y-4 py-4">
          <RadioGroup
            value={formData.assistantType}
            onValueChange={(value) => updateFormData("assistantType", value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="general" id="general" />
              <Label htmlFor="general" className="flex-1 cursor-pointer">
                <div className="font-medium">General Assistant</div>
                <div className="text-sm text-muted-foreground">Helps with everyday tasks and questions</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="productivity" id="productivity" />
              <Label htmlFor="productivity" className="flex-1 cursor-pointer">
                <div className="font-medium">Productivity Focus</div>
                <div className="text-sm text-muted-foreground">Specialized in task management and organization</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="creative" id="creative" />
              <Label htmlFor="creative" className="flex-1 cursor-pointer">
                <div className="font-medium">Creative Partner</div>
                <div className="text-sm text-muted-foreground">
                  Helps with writing, brainstorming, and creative tasks
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="research" id="research" />
              <Label htmlFor="research" className="flex-1 cursor-pointer">
                <div className="font-medium">Research Assistant</div>
                <div className="text-sm text-muted-foreground">Focused on information gathering and analysis</div>
              </Label>
            </div>
          </RadioGroup>
        </div>
      ),
    },
    {
      title: "Almost Done!",
      description: "Just a few final preferences to set up",
      content: (
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notifications" className="text-base">
              Notifications
            </Label>
            <RadioGroup
              defaultValue={formData.notifications ? "yes" : "no"}
              onValueChange={(value) => updateFormData("notifications", value === "yes")}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="notifications-yes" />
                <Label htmlFor="notifications-yes">Enable notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="notifications-no" />
                <Label htmlFor="notifications-no">Disable notifications</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      ),
    },
    {
      title: "You're All Set!",
      description: "Your personal AI assistant is ready to help",
      content: (
        <div className="py-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Check size={32} className="text-primary" />
          </div>
          <h3 className="text-xl font-medium mb-2">{formData.name ? `Hello, ${formData.name}!` : "Hello!"}</h3>
          <p className="text-muted-foreground">
            Your AI assistant is configured and ready to assist you. You can always adjust your settings later.
          </p>
        </div>
      ),
    },
  ]

  const currentStep = steps[step]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader>
        <CardTitle>{currentStep.title}</CardTitle>
        <CardDescription>{currentStep.description}</CardDescription>
      </CardHeader>
      <CardContent>{currentStep.content}</CardContent>
      <CardFooter className="flex justify-between">
        {step > 0 ? (
          <Button variant="outline" onClick={handleBack} className="gap-1">
            <ArrowLeft size={14} />
            Back
          </Button>
        ) : (
          <div></div>
        )}
        <Button onClick={handleNext} className="gap-1">
          {step < steps.length - 1 ? (
            <>
              Next
              <ArrowRight size={14} />
            </>
          ) : (
            "Get Started"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

