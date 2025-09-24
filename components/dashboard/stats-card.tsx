import type React from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  trend?: number
  icon?: React.ReactNode
  className?: string
}

export default function StatsCard({ title, value, description, trend, icon, className }: StatsCardProps) {
  const showTrend = trend !== undefined
  const isPositive = trend && trend > 0

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="h-8 w-8 rounded-md bg-primary/10 p-1.5 text-primary">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
      {showTrend && (
        <CardFooter className="p-2 pt-0">
          <div className={cn("flex items-center text-xs", isPositive ? "text-green-500" : "text-red-500")}>
            {isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
            <span>{Math.abs(trend)}% from last period</span>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

