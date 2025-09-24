"use client"

import { useState } from "react"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Avatar } from "../ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

type AiInteraction = {
  query: string
  response: string
  timestamp: Date
}

type AiInsight = {
  category: string
  title: string
  description: string
  confidence: number
  source: string
}

export default function KrilinAiAdvisor() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [interactions, setInteractions] = useState<AiInteraction[]>([
    {
      query: "What habits should I develop to improve my productivity?",
      response: "Based on your pattern of peak productivity between 9am-11am, I recommend scheduling your most challenging tasks during this time. Your health data suggests taking short walks every 90 minutes would help maintain energy levels throughout the day. Your calendar shows you often skip lunch on Wednesdays - try to maintain regular eating patterns for consistent energy.",
      timestamp: new Date(Date.now() - 86400000)
    },
    {
      query: "How can I improve my sleep quality?",
      response: "Your sleep data shows disturbed patterns on nights following days with high screen time after 9pm. I notice your smart home lights are at full brightness in the evening - consider using the warm light setting after 8pm. Your fitness tracker indicates you get best sleep quality after days with at least 8,000 steps. Based on your recurring calendar events, try to schedule exercise earlier in the day rather than evenings.",
      timestamp: new Date(Date.now() - 3600000)
    }
  ])
  
  const [aiInsights, setAiInsights] = useState<AiInsight[]>([
    {
      category: "Health",
      title: "Sleep Pattern Correlation",
      description: "There's a 78% correlation between your poor sleep nights and days when you consumed caffeine after 2pm.",
      confidence: 0.78,
      source: "Health MCP + Calendar MCP"
    },
    {
      category: "Productivity",
      title: "Meeting Effectiveness",
      description: "Meetings scheduled before 11am have 40% more action items completed than afternoon meetings.",
      confidence: 0.85,
      source: "Calendar MCP + Tasks MCP"
    },
    {
      category: "Finance",
      title: "Spending Pattern",
      description: "Your dining expenses increase by 65% during weeks with over 45 hours worked.",
      confidence: 0.72,
      source: "Finance MCP + Calendar MCP"
    },
    {
      category: "Learning",
      title: "Knowledge Retention",
      description: "You complete 3x more learning materials during the first week of each month.",
      confidence: 0.91,
      source: "Learning MCP + Calendar MCP"
    }
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setIsLoading(true)
    
    // Simulate AI response with integrated data
    setTimeout(() => {
      const newInteraction = {
        query,
        response: generateAdviceResponse(query),
        timestamp: new Date()
      }
      
      setInteractions([newInteraction, ...interactions])
      setQuery("")
      setIsLoading(false)
    }, 1500)
  }
  
  // Function to generate mock responses that reference MCP data
  const generateAdviceResponse = (userQuery: string): string => {
    const responses = [
      `Based on your recent health data from Health MCP, I notice your stress levels tend to peak on ${getRandomDay()}. Your calendar shows multiple back-to-back meetings on these days - consider implementing 15-minute buffers between meetings.`,
      
      `Your finance data from Finance MCP indicates you've spent 28% more on subscription services this month. I've cross-referenced with your usage patterns and found 3 services with less than 2 hours of use in the past 30 days.`,
      
      `According to your Weather MCP data, your productivity scores from your habit tracker are consistently higher on sunny days. Would you like me to suggest optimal working hours based on tomorrow's weather forecast?`,
      
      `Your News MCP feed shows you've been following developments in artificial intelligence. I've identified 3 learning resources from your Learning MCP that match your interests and available time slots in your calendar.`,
      
      `Your smart home data shows your home office has suboptimal lighting levels in the afternoon. Based on research from your Learning MCP, adjusting to 4500K brightness could improve your focus during these hours.`
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }
  
  const getRandomDay = () => {
    const days = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays"]
    return days[Math.floor(Math.random() * days.length)]
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white shadow-md rounded-lg border-2 border-[#ffc6c7]">
        <h2 className="text-2xl font-bold text-[#33272a] mb-4">AI ADVISOR</h2>
        <p className="text-[#594a4e] mb-6">
          Your personal AI advisor with deep knowledge about you. Integrated with multiple data sources to provide personalized insights and advice.
        </p>
        
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="chat">ADVISOR CHAT</TabsTrigger>
            <TabsTrigger value="insights">AI INSIGHTS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="space-y-4">
            <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
              <Input 
                placeholder="Ask for personalized advice..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-grow"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !query.trim()}
                className="bg-[#ffc6c7] hover:bg-[#ff8ba7] text-[#33272a]"
              >
                {isLoading ? "Thinking..." : "Ask"}
              </Button>
            </form>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto p-2">
              {interactions.map((interaction, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex gap-3 items-start">
                    <Avatar className="w-8 h-8 bg-[#33272a]">
                      <span className="text-xs">You</span>
                    </Avatar>
                    <div>
                      <p className="bg-[#fffaeb] p-3 rounded-lg border border-[#faeee7]">
                        {interaction.query}
                      </p>
                      <p className="text-xs text-[#594a4e] mt-1">
                        {interaction.timestamp.toLocaleTimeString()} • {interaction.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-start">
                    <Avatar className="w-8 h-8 bg-[#ff8ba7]">
                      <span className="text-xs">AI</span>
                    </Avatar>
                    <div>
                      <p className="bg-[#faeee7] p-3 rounded-lg border border-[#ffc6c7]">
                        {interaction.response}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 items-start animate-pulse">
                  <Avatar className="w-8 h-8 bg-[#ff8ba7]">
                    <span className="text-xs">AI</span>
                  </Avatar>
                  <div className="bg-[#faeee7] p-3 rounded-lg border border-[#ffc6c7] w-3/4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-4">
            <p className="text-sm text-[#594a4e] italic mb-4">
              Based on analysis of your connected data sources, your AI advisor has generated these insights:
            </p>
            
            {aiInsights.map((insight, i) => (
              <Card key={i} className="p-4 border-l-4" style={{ borderLeftColor: getInsightColor(insight.category) }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: getInsightColorLight(insight.category) }}>
                      {insight.category}
                    </span>
                    <h3 className="text-lg font-bold mt-2">{insight.title}</h3>
                  </div>
                  <div className="text-xs text-[#594a4e]">
                    Confidence: {(insight.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <p className="text-[#594a4e] mb-2">{insight.description}</p>
                <p className="text-xs text-[#594a4e]">Source: {insight.source}</p>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

// Helper functions for insight styling
function getInsightColor(category: string): string {
  switch (category) {
    case "Health": return "#06d6a0";
    case "Productivity": return "#118ab2";
    case "Finance": return "#ef476f";
    case "Learning": return "#ffd166";
    default: return "#073b4c";
  }
}

function getInsightColorLight(category: string): string {
  switch (category) {
    case "Health": return "rgba(6, 214, 160, 0.2)";
    case "Productivity": return "rgba(17, 138, 178, 0.2)";
    case "Finance": return "rgba(239, 71, 111, 0.2)";
    case "Learning": return "rgba(255, 209, 102, 0.2)";
    default: return "rgba(7, 59, 76, 0.2)";
  }
}
