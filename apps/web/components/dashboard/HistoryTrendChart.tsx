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
        return [...data]
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map(record => ({
                date: new Date(record.created_at).toLocaleDateString("en-GB", { month: 'numeric', day: 'numeric' }),
                risk: (record.risk_score * 100).toFixed(0),
                fullDate: new Date(record.created_at).toLocaleDateString("en-GB")
            }))
    }, [data])

    if (chartData.length < 2) return null

    return (
        <div className="h-[60px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="rounded-lg border border-teal-100 bg-white p-3 shadow-lg text-xs z-50">
                                        <div className="font-semibold text-teal-900 mb-1">{payload[0].payload.fullDate}</div>
                                        <div className="font-bold text-teal-600">Risk: {payload[0].value}%</div>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="risk"
                        stroke="#0d9488"
                        strokeWidth={2}
                        dot={{ r: 2, fill: "#0d9488" }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
