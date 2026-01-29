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
        <div className="space-y-6 animate-in fade-in duration-500 h-full">
            {/* Header / Profile Summary */}
            <Card variant="glass" className="flex items-center justify-between p-6 border-teal-200/40 bg-white/40 shadow-lg shadow-teal-900/5 rounded-3xl overflow-hidden">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="h-14 w-14 rounded-full bg-linear-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/30 shrink-0">
                        <span className="text-xl font-bold">{patientName?.charAt(0) || "P"}</span>
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-2xl font-bold text-teal-950 font-display truncate">{patientName || "Patient"}</h2>
                        <p className="text-sm font-mono text-teal-600/80 mt-1 truncate max-w-[280px]" title={patientId}>ID: {patientId}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/40 px-3 py-3 rounded-2xl border border-white/50 flex flex-col items-center justify-center w-[125px] backdrop-blur-sm transition-all hover:bg-white/50 hover:shadow-sm">
                        <p className="text-[10px] text-teal-600/80 uppercase tracking-wider font-bold mb-0.5 whitespace-nowrap">Total Visits</p>
                        <p className="text-3xl font-bold text-teal-900 leading-none mt-1">{records.length}</p>
                    </div>
                    <div className="bg-white/40 px-5 py-3 rounded-2xl border border-white/50 flex flex-col items-center justify-center w-[160px] backdrop-blur-sm transition-all hover:bg-white/50 hover:shadow-sm">
                        <p className="text-[10px] text-teal-600/80 uppercase tracking-wider font-bold mb-0.5 whitespace-nowrap">Last Visit</p>
                        <p className="text-xl font-bold text-teal-900 mt-1">
                            {latestRecord ? new Date(latestRecord.created_at).toLocaleDateString("en-GB") : "N/A"}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card variant="glass" className="bg-white/30 border-emerald-100/50 hover:bg-emerald-50/30 hover:shadow-lg transition-all duration-300 group rounded-3xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <Activity className="h-4 w-4" />
                            </div>
                            Avg Risk Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-900">{(avgRisk * 100).toFixed(1)}%</div>
                        <p className="text-xs text-emerald-600/80 mt-1 flex items-center gap-1 font-medium">
                            {riskImprovement > 0 ? (
                                <><TrendingDown className="h-3 w-3" /> Improved by {riskImprovement.toFixed(1)}%</>
                            ) : (
                                <><TrendingUp className="h-3 w-3" /> Changed by {Math.abs(riskImprovement).toFixed(1)}%</>
                            )}
                            <span className="opacity-70 font-normal ml-1 text-emerald-600/60">since first visit</span>
                        </p>
                    </CardContent>
                </Card>

                <Card variant="glass" className="bg-white/30 border-sky-100/50 hover:bg-sky-50/30 hover:shadow-lg transition-all duration-300 group rounded-3xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-sky-800 flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-sky-100 text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                                <Wind className="h-4 w-4" />
                            </div>
                            Avg FEV1L
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-sky-900">{avgFEV1.toFixed(2)} L</div>
                        <p className="text-xs text-sky-600/80 mt-1 font-medium">Lung function average</p>
                    </CardContent>
                </Card>

                <Card variant="glass" className="bg-white/30 border-amber-100/50 hover:bg-amber-50/30 hover:shadow-lg transition-all duration-300 group rounded-3xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-800 flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <ShieldAlert className="h-4 w-4" />
                            </div>
                            Anomaly Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-900">{anomalyRecords.length}</div>
                        <p className="text-xs text-amber-600/80 mt-1 font-medium">Flagged sessions</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Chart */}
            <Card variant="glass" className="border-teal-200/30 bg-white/40 shadow-xl shadow-teal-900/5 rounded-3xl overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-teal-950">Risk Trajectory</CardTitle>
                    <CardDescription className="text-teal-600/60">Visualizing risk score evolution over time.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0f766e" strokeOpacity={0.1} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-xl border border-white/50 bg-white/80 backdrop-blur-md p-4 shadow-xl text-xs">
                                                <div className="font-bold text-teal-950 mb-2 border-b border-teal-100/50 pb-2">
                                                    {payload[0].payload.fullDate}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-semibold text-teal-600">Risk Score:</span>
                                                    <span className="font-bold text-base text-teal-900">{payload[0].value}%</span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="font-semibold text-sky-600">FEV1:</span>
                                                    <span className="font-bold text-base text-sky-900">{payload[0].payload.fev1.toFixed(2)} L</span>
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
                                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2, fill: "#0d9488" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Recent Anomalies List (if any) */}
            {anomalyRecords.length > 0 && (
                <Card variant="glass" className="border-amber-200/50 bg-amber-50/30">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-amber-900 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" />
                            Recent Anomaly Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {anomalyRecords.slice(0, 3).map((r, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-white/60 rounded-xl border border-amber-100/50 hover:bg-white/80 transition-colors">
                                <ShieldAlert className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-amber-900">
                                        {new Date(r.created_at).toLocaleDateString("en-GB")}
                                    </p>
                                    <div className="text-xs text-amber-700/80 mt-1 font-medium">
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
