"use client"

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface RiskGaugeCardProps {
    riskScore?: number | null
    lowerBound?: number
    upperBound?: number
    trustRating?: "high" | "medium" | "low"
    isLoading?: boolean
}

export function RiskGaugeCard({
    riskScore,
    lowerBound = 0,
    upperBound = 0,
    trustRating = "medium",
    isLoading = false,
}: RiskGaugeCardProps) {
    if (isLoading) {
        return (
            <Card className="w-full h-[400px]">
                <CardHeader>
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <Skeleton className="h-48 w-48 rounded-full" />
                </CardContent>
            </Card>
        )
    }

    if (riskScore === null || riskScore === undefined) {
        return null
    }

    const percentage = Math.round(riskScore * 100)
    const intervalWidth = upperBound - lowerBound
    const isLowTrust = intervalWidth > 0.20

    // Color logic
    let riskColor = "#059669" // Emerald-600 (Low Risk)
    if (percentage >= 70) riskColor = "#ef4444" // Red-500 (High Risk)
    else if (percentage >= 30) riskColor = "#d97706" // Amber-600 (Medium Risk)

    const chartData = [
        {
            name: "Risk",
            value: percentage,
            fill: riskColor,
        },
    ]

    // Width percentages for whiskers
    const lowerPct = Math.max(0, Math.round(lowerBound * 100))
    const upperPct = Math.min(100, Math.round(upperBound * 100))
    const barLeft = `${lowerPct}%`
    const barWidth = `${upperPct - lowerPct}%`

    return (
        <Card variant="glass" className={cn("w-full transition-all duration-500 border-teal-200/50 shadow-md backdrop-blur-xl", isLowTrust ? "bg-teal-50/40" : "bg-white/40")}>
            <CardHeader className="text-center pb-2 pt-4 border-b border-teal-100/30">
                <CardTitle className="text-teal-900">Risk Assessment</CardTitle>
                <CardDescription className="text-teal-800/60">
                    AI-generated risk score with confidence interval.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pb-2 pt-4">
                <div className="relative w-72 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="80%"
                            outerRadius="100%"
                            barSize={10}
                            data={chartData}
                            startAngle={90}
                            endAngle={-270} // Full circle background
                        >
                            <PolarAngleAxis
                                type="number"
                                domain={[0, 100]}
                                angleAxisId={0}
                                tick={false}
                            />
                            <RadialBar
                                background
                                dataKey="value"
                                cornerRadius={10}
                                fill={riskColor}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-black tracking-tighter" style={{ color: riskColor }}>{percentage}%</span>
                        <span className="text-sm text-muted-foreground uppercase font-semibold tracking-wide">{trustRating} Confidence</span>
                    </div>
                </div>

                {/* Confidence Interval Visualization */}
                <div className="w-full px-8 mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1 font-medium">
                        <span>0%</span>
                        <span className="font-bold text-teal-900">Confidence Interval</span>
                        <span>100%</span>
                    </div>
                    <div className="relative h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                        {/* The Interval Bar */}
                        <div
                            className="absolute h-full bg-teal-500/50 rounded-full transition-all duration-500 backdrop-blur-sm"
                            style={{
                                left: barLeft,
                                width: barWidth
                            }}
                        />
                        {/* The Risk Point */}
                        <div
                            className="absolute h-full w-1 bg-teal-700 z-10 box-shadow-sm"
                            style={{ left: `${percentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                        <span>L: {lowerPct}%</span>
                        <span>U: {upperPct}%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
