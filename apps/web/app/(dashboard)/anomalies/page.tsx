"use client"

import * as React from "react"
import { useHistoryGet } from "@/lib/api/generated"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ShieldAlert, CheckCircle, XCircle, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

export const dynamic = 'force-dynamic'

function AnomaliesContent() {
    const { data: historyData, isLoading } = useHistoryGet()
    const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set())

    // Load dismissed IDs from localStorage on mount
    React.useEffect(() => {
        const stored = localStorage.getItem("respira_dismissed_anomalies")
        if (stored) {
            setDismissedIds(new Set(JSON.parse(stored)))
        }
    }, [])

    // Filter for high risk or just mocked "anomalies" since we don't store "is_outlier" boolean
    const anomalies = React.useMemo(() => {
        return historyData?.data?.filter(r =>
            (r.trust_rating === 'low' || r.risk_score > 0.8) && !dismissedIds.has(r.id)
        ) || []
    }, [historyData, dismissedIds])

    const handleReview = (id: string) => {
        const newSet = new Set(dismissedIds)
        newSet.add(id)
        setDismissedIds(newSet)
        localStorage.setItem("respira_dismissed_anomalies", JSON.stringify(Array.from(newSet)))

        toast.success("Anomaly Dismissed", {
            description: `Record ${id.slice(0, 8)} has been hidden.`
        })
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] gap-8 p-8 relative overflow-hidden rounded-3xl border border-teal-50/50 shadow-sm">
            <div className="absolute inset-0 mesh-gradient-light -z-10" />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-1"
            >
                <h1 className="text-3xl font-bold tracking-tight text-amber-950 font-display flex items-center gap-3">
                    <ShieldAlert className="h-8 w-8 text-amber-600" />
                    Anomaly Detection
                </h1>
                <p className="text-amber-900/60 font-medium">
                    AI-flagged predictions requiring clinical review. These events deviate significantly from expected baselines.
                </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 overflow-y-auto pr-2 pb-20 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {anomalies.map((record) => (
                        <motion.div
                            key={record.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        >
                            <Card variant="glass" className="border-amber-200/60 bg-white/60 shadow-lg shadow-amber-900/5 hover:border-amber-300 transition-all duration-300 group rounded-3xl overflow-hidden flex flex-col h-full">
                                <CardHeader className="pb-3 border-b border-amber-100/50 bg-white/40">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="h-10 w-10 rounded-full bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
                                                <span className="font-bold">{(record.patient_name || "P").charAt(0)}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <CardTitle className="text-base font-bold text-amber-950 truncate leading-tight">
                                                    {record.patient_name || "Unknown Patient"}
                                                </CardTitle>
                                                <CardDescription className="font-mono text-[10px] text-amber-800/60 mt-0.5 truncate flex items-center gap-1">
                                                    <span className="opacity-50">ID:</span> {record.id}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <div className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-red-200/50">
                                                Critical
                                            </div>
                                            <div className="text-[10px] font-medium text-amber-900/50 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(record.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    {/* Vitals Row - Merged Risk & FEV1 for better density */}
                                    <div className="flex justify-between items-stretch bg-white/50 rounded-2xl border border-amber-100/50 shadow-sm overflow-hidden">
                                        <div className="p-3 flex-1 border-r border-amber-100/50">
                                            <span className="text-xs font-bold text-amber-800/70 uppercase tracking-wider block mb-1">Risk Score</span>
                                            <div className="flex items-baseline gap-0.5">
                                                <span className="font-bold text-red-600 text-3xl">{(record.risk_score * 100).toFixed(0)}</span>
                                                <span className="text-sm text-red-400 font-medium">%</span>
                                            </div>
                                        </div>
                                        <div className="p-3 flex-1 bg-amber-50/30 flex flex-col justify-center">
                                            <span className="text-[10px] text-amber-600/70 uppercase font-bold block mb-1">FEV1 Level</span>
                                            <p className="font-bold text-slate-700 text-lg">{record.fev1.toFixed(2)} L</p>
                                        </div>
                                    </div>

                                    {/* Anomaly Context - The "Why" */}
                                    <div className="p-3 bg-white/50 rounded-2xl border border-amber-100/50 shadow-sm space-y-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] text-amber-600/70 uppercase font-bold">Anomaly Factors</p>
                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${record.trust_rating === 'high' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {record.trust_rating} Confidence
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(record as any).flagged_features && (record as any).flagged_features.length > 0 ? (
                                                (record as any).flagged_features.map((feature: string, i: number) => (
                                                    <span key={i} className="inline-flex items-center px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-100 capitalize">
                                                        {feature.replace(/_/g, ' ')}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-amber-800/50 italic">Multi-variate deviation detected</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 pb-4 px-4 mt-2">
                                    <Button
                                        variant="outline"
                                        className="w-full h-11 border-amber-200/50 text-amber-800 bg-white/60 hover:bg-red-50 hover:text-red-700 hover:border-red-200/80 transition-all font-medium rounded-xl hover:shadow-sm"
                                        onClick={() => handleReview(record.id)}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Dismiss Anomaly
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {anomalies.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-full h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white/30 backdrop-blur-md rounded-3xl border border-emerald-100/50 border-dashed"
                    >
                        <div className="h-20 w-20 rounded-full bg-emerald-100/50 flex items-center justify-center mb-6">
                            <CheckCircle className="h-10 w-10 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-emerald-950 font-display">System All Clear</h3>
                        <p className="text-emerald-800/60 max-w-sm mt-2">
                            No anomalies detected in recent patient sessions. The AI monitoring system is active and running.
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    )
}

export default function AnomaliesPage() {
    return (
        <React.Suspense fallback={
            <div className="flex h-full items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
        }>
            <AnomaliesContent />
        </React.Suspense>
    )
}
