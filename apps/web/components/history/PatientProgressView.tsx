"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts"
import {
    Activity,
    TrendingDown,
    TrendingUp,
    Wind,
    Calendar,
    ShieldAlert
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PredictionRecord } from "@/lib/api/generated"

interface PatientProgressViewProps {
    records: PredictionRecord[]
    patientName?: string
    patientId: string
}

export function PatientProgressView({ records, patientName, patientId }: PatientProgressViewProps) {

    // Sort records by date for accurate charting
    const sortedRecords = useMemo(() => {
        return [...records].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }, [records])

    const latestRecord = sortedRecords[sortedRecords.length - 1]
    const firstRecord = sortedRecords[0]

    // Calculate key metrics
    const avgRisk = records.reduce((acc, curr) => acc + curr.risk_score, 0) / records.length
    const avgFEV1 = records.reduce((acc, curr) => acc + curr.fev1, 0) / records.length
    const riskImprovement = firstRecord && latestRecord ? (firstRecord.risk_score - latestRecord.risk_score) * 100 : 0

    // Chart data
    const chartData = sortedRecords.map(r => ({
        date: new Date(r.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short' }),
        fullDate: new Date(r.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' }),
        risk: Number((r.risk_score * 100).toFixed(0)),
        fev1: r.fev1
    }))

    // Anomalies
    const anomalyRecords = sortedRecords.filter(r => (r as any).flagged_features && (r as any).flagged_features.length > 0)

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Profile Summary */}
            <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-teal-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-teal-900">{patientName || "Patient"}</h2>
                    <p className="text-sm font-mono text-teal-600/60 mt-1">ID: {patientId}</p>
                </div>
                <div className="flex gap-4 text-right">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Visits</p>
                        <p className="text-2xl font-bold text-teal-900">{records.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Last Visit</p>
                        <p className="text-xl font-bold text-teal-900">
                            {latestRecord ? new Date(latestRecord.created_at).toLocaleDateString("en-GB") : "N/A"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-emerald-50/50 border-emerald-100 hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Avg Risk Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-900">{(avgRisk * 100).toFixed(1)}%</div>
                        <p className="text-xs text-emerald-600/80 mt-1 flex items-center gap-1">
                            {riskImprovement > 0 ? (
                                <><TrendingDown className="h-3 w-3" /> Improved by {riskImprovement.toFixed(1)}%</>
                            ) : (
                                <><TrendingUp className="h-3 w-3" /> Changed by {Math.abs(riskImprovement).toFixed(1)}%</>
                            )} since first visit
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-sky-50/50 border-sky-100 hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-sky-800 flex items-center gap-2">
                            <Wind className="h-4 w-4" /> Avg FEV1
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-sky-900">{avgFEV1.toFixed(2)} L</div>
                        <p className="text-xs text-sky-600/80 mt-1">Lung function average</p>
                    </CardContent>
                </Card>

                <Card className="bg-amber-50/50 border-amber-100 hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-800 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" /> Anomaly Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-900">{anomalyRecords.length}</div>
                        <p className="text-xs text-amber-600/80 mt-1">Flagged sessions</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Chart */}
            <Card className="border-teal-100 shadow-sm overflow-hidden">
                <CardHeader>
                    <CardTitle>Risk Trajectory</CardTitle>
                    <CardDescription>Visualizing risk score evolution over time.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#64748b' }}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border border-teal-100 bg-white p-3 shadow-xl text-xs">
                                                <div className="font-semibold text-teal-900 mb-2 border-b border-gray-100 pb-1">
                                                    {payload[0].payload.fullDate}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium text-teal-600">Risk Score:</span>
                                                    <span className="font-bold">{payload[0].value}%</span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="font-medium text-sky-600">FEV1:</span>
                                                    <span className="font-bold">{payload[0].payload.fev1.toFixed(2)} L</span>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="risk"
                                stroke="#0d9488"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorRisk)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Recent Anomalies List (if any) */}
            {anomalyRecords.length > 0 && (
                <Card className="border-amber-200/50 bg-amber-50/10">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold text-amber-900">Recent Anomaly Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {anomalyRecords.slice(0, 3).map((r, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-amber-100/50">
                                <ShieldAlert className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-amber-900">
                                        {new Date(r.created_at).toLocaleDateString("en-GB")}
                                    </p>
                                    <div className="text-xs text-amber-700/80 mt-1">
                                        {(r as any).flagged_features?.join(", ") || "Unspecified Anomaly"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
