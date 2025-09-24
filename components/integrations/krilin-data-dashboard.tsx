"use client"

import { useState, useEffect } from "react"
import { Card } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "../ui/chart"

// Mock data types to simulate MCP server data
type WeatherData = {
  location: string
  forecast: Array<{
    date: string
    temperature: number
    condition: string
    icon: string
  }>
}

type FinancialData = {
  balance: number
  recentTransactions: Array<{
    id: string
    date: string
    description: string
    amount: number
    category: string
  }>
  spendingByCategory: Array<{
    category: string
    amount: number
  }>
}

type HealthData = {
  steps: Array<{
    date: string
    count: number
  }>
  sleep: Array<{
    date: string
    hours: number
    quality: number
  }>
  heartRate: Array<{
    date: string
    rate: number
  }>
}

type NewsItem = {
  id: string
  title: string
  source: string
  publishedAt: string
  category: string
  relevanceScore: number
  summary: string
  url: string
}

export default function KrilinDataDashboard() {
  const [activeTab, setActiveTab] = useState("weather")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [newsData, setNewsData] = useState<NewsItem[]>([])
  
  // Colors for charts
  const COLORS = ['#ff8ba7', '#ffc6c7', '#f1c0e8', '#cfbaf0', '#a3c4f3', '#90dbf4', '#8eecf5', '#98f5e1', '#b9fbc0'];
  
  useEffect(() => {
    // Simulate fetching data from MCP servers
    simulateMcpDataFetch()
  }, [])
  
  const simulateMcpDataFetch = () => {
    // Weather MCP data
    setWeatherData({
      location: "San Francisco, CA",
      forecast: [
        { date: "Today", temperature: 68, condition: "Sunny", icon: "☀️" },
        { date: "Tomorrow", temperature: 72, condition: "Partly Cloudy", icon: "⛅" },
        { date: "Wednesday", temperature: 65, condition: "Foggy", icon: "🌫️" },
        { date: "Thursday", temperature: 63, condition: "Rainy", icon: "🌧️" },
        { date: "Friday", temperature: 70, condition: "Sunny", icon: "☀️" }
      ]
    })
    
    // Financial MCP data
    setFinancialData({
      balance: 12457.89,
      recentTransactions: [
        { id: "t1", date: "2025-04-03", description: "Grocery Store", amount: -78.35, category: "Groceries" },
        { id: "t2", date: "2025-04-02", description: "Electric Bill", amount: -124.50, category: "Utilities" },
        { id: "t3", date: "2025-04-01", description: "Salary Deposit", amount: 3200.00, category: "Income" },
        { id: "t4", date: "2025-03-30", description: "Restaurant", amount: -58.75, category: "Dining" },
        { id: "t5", date: "2025-03-28", description: "Gas Station", amount: -42.15, category: "Transportation" }
      ],
      spendingByCategory: [
        { category: "Housing", amount: 1800 },
        { category: "Food", amount: 650 },
        { category: "Transportation", amount: 250 },
        { category: "Entertainment", amount: 180 },
        { category: "Utilities", amount: 320 },
        { category: "Shopping", amount: 290 },
        { category: "Healthcare", amount: 150 }
      ]
    })
    
    // Health MCP data
    setHealthData({
      steps: [
        { date: "Mon", count: 8245 },
        { date: "Tue", count: 10321 },
        { date: "Wed", count: 7654 },
        { date: "Thu", count: 9128 },
        { date: "Fri", count: 12540 },
        { date: "Sat", count: 5430 },
        { date: "Sun", count: 6782 }
      ],
      sleep: [
        { date: "Mon", hours: 7.2, quality: 85 },
        { date: "Tue", hours: 6.8, quality: 75 },
        { date: "Wed", hours: 7.5, quality: 90 },
        { date: "Thu", hours: 6.5, quality: 70 },
        { date: "Fri", hours: 8.0, quality: 95 },
        { date: "Sat", hours: 7.8, quality: 85 },
        { date: "Sun", hours: 7.1, quality: 80 }
      ],
      heartRate: [
        { date: "Mon", rate: 68 },
        { date: "Tue", rate: 72 },
        { date: "Wed", rate: 65 },
        { date: "Thu", rate: 70 },
        { date: "Fri", rate: 67 },
        { date: "Sat", rate: 63 },
        { date: "Sun", rate: 65 }
      ]
    })
    
    // News MCP data
    setNewsData([
      {
        id: "n1",
        title: "New Breakthrough in Quantum Computing",
        source: "Tech Daily",
        publishedAt: "2025-04-04T09:30:00Z",
        category: "Technology",
        relevanceScore: 0.89,
        summary: "Researchers have achieved a new milestone in quantum computing, demonstrating a 128-qubit processor with unprecedented stability.",
        url: "#"
      },
      {
        id: "n2",
        title: "Global Markets Respond to New Economic Policies",
        source: "Financial Times",
        publishedAt: "2025-04-04T08:15:00Z",
        category: "Finance",
        relevanceScore: 0.75,
        summary: "Markets across Asia and Europe show positive trends following the announcement of new economic stimulus packages.",
        url: "#"
      },
      {
        id: "n3",
        title: "Latest Study on Intermittent Fasting Shows Promising Results",
        source: "Health Journal",
        publishedAt: "2025-04-03T15:45:00Z",
        category: "Health",
        relevanceScore: 0.82,
        summary: "A long-term study reveals significant benefits of intermittent fasting for metabolic health and longevity.",
        url: "#"
      }
    ])
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white shadow-md rounded-lg border-2 border-[#ffc6c7]">
        <h2 className="text-2xl font-bold text-[#33272a] mb-4">EXTERNAL DATA DASHBOARD</h2>
        <p className="text-[#594a4e] mb-6">
          Integrated data from various external sources through MCP servers. These connections allow KRILIN to provide personalized insights based on real-world data.
        </p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="weather">WEATHER</TabsTrigger>
            <TabsTrigger value="financial">FINANCIAL</TabsTrigger>
            <TabsTrigger value="health">HEALTH</TabsTrigger>
            <TabsTrigger value="news">NEWS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weather" className="space-y-4">
            {weatherData ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">{weatherData.location}</h3>
                  <Button variant="outline" size="sm">Change Location</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {weatherData.forecast.map((day, i) => (
                    <Card key={i} className="p-4 text-center">
                      <div className="text-4xl mb-2">{day.icon}</div>
                      <div className="font-bold">{day.date}</div>
                      <div className="text-2xl my-2">{day.temperature}°F</div>
                      <div className="text-sm text-[#594a4e]">{day.condition}</div>
                    </Card>
                  ))}
                </div>
                <p className="text-xs text-[#594a4e] mt-4">
                  Data provided by Weather MCP Server • Last updated: {new Date().toLocaleTimeString()}
                </p>
              </>
            ) : (
              <div className="flex justify-center items-center h-40">
                <p>Loading weather data...</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="financial" className="space-y-4">
            {financialData ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Financial Summary</h3>
                  <Button variant="outline" size="sm">Sync Accounts</Button>
                </div>
                
                <Card className="p-4 border-l-4 border-l-[#ff8ba7]">
                  <div className="text-sm text-[#594a4e]">Current Balance</div>
                  <div className="text-3xl font-bold">${financialData.balance.toLocaleString()}</div>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-3">Recent Transactions</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {financialData.recentTransactions.map(transaction => (
                        <div key={transaction.id} className="flex justify-between items-center p-2 border-b">
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-xs text-[#594a4e]">{transaction.date} • {transaction.category}</div>
                          </div>
                          <div className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : ''}`}>
                            {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-bold mb-3">Spending by Category</h4>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={financialData.spendingByCategory}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                            nameKey="category"
                          >
                            {financialData.spendingByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-[#594a4e] mt-4">
                  Data provided by Financial MCP Server • Last updated: {new Date().toLocaleTimeString()}
                </p>
              </>
            ) : (
              <div className="flex justify-center items-center h-40">
                <p>Loading financial data...</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="health" className="space-y-4">
            {healthData ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Health Metrics</h3>
                  <Button variant="outline" size="sm">Connect Devices</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <h4 className="font-bold mb-3">Daily Steps</h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={healthData.steps}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#ff8ba7" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <h4 className="font-bold mb-3">Sleep Hours</h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={healthData.sleep}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="hours" stroke="#ffc6c7" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <h4 className="font-bold mb-3">Heart Rate</h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={healthData.heartRate}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="rate" stroke="#f1c0e8" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
                
                <p className="text-xs text-[#594a4e] mt-4">
                  Data provided by Health MCP Server • Last updated: {new Date().toLocaleTimeString()}
                </p>
              </>
            ) : (
              <div className="flex justify-center items-center h-40">
                <p>Loading health data...</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="news" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Personalized News</h3>
              <Button variant="outline" size="sm">Update Preferences</Button>
            </div>
            
            <div className="space-y-4">
              {newsData.map(news => (
                <Card key={news.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{news.title}</h4>
                    <Badge variant="outline">{news.category}</Badge>
                  </div>
                  <p className="text-sm text-[#594a4e] mb-2">{news.summary}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-[#594a4e]">
                      {news.source} • {new Date(news.publishedAt).toLocaleDateString()}
                    </div>
                    <Button size="sm" variant="ghost">Read More</Button>
                  </div>
                </Card>
              ))}
            </div>
            
            <p className="text-xs text-[#594a4e] mt-4">
              Data provided by News MCP Server • Relevance algorithm customized to your interests
            </p>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
