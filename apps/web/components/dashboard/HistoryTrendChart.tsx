"use client"

import { useMemo } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { PredictionRecord } from "@/lib/api/generated"

interface HistoryTrendChartProps {
    data: PredictionRecord[]
}

export function HistoryTrendChart({ data }: HistoryTrendChartProps) {
    const chartData = useMemo(() => {
        // Sort by date ascending for the chart
        const sorted = [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

        // Take only the last 20 records to prevent congestion
        return sorted.slice(-20).map(record => ({
            date: new Date(record.created_at).toLocaleDateString("en-GB", { month: 'numeric', day: 'numeric' }),
            risk: Number((record.risk_score * 100).toFixed(0)),
            fullDate: new Date(record.created_at).toLocaleDateString("en-GB")
        }))
    }, [data])

    if (chartData.length < 2) return null

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <defs>
                        <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#2dd4bf" />
                            <stop offset="100%" stopColor="#0d9488" />
                        </linearGradient>
                    </defs>
                    <Tooltip
                        cursor={{ stroke: '#99f6e4', strokeWidth: 2 }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="rounded-lg border border-teal-100 bg-white/95 backdrop-blur-sm p-3 shadow-xl text-xs z-50">
                                        <div className="font-bold text-teal-900 mb-1">{payload[0].payload.fullDate}</div>
                                        <div className="font-bold text-teal-600 flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-teal-500"></div>
                                            Risk: {payload[0].value}%
                                        </div>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="risk"
                        stroke="url(#lineColor)"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: "white", fill: "#0d9488" }}
                        animationDuration={1500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
