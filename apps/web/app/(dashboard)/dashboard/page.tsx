"use client"

import { useState, useEffect, Suspense } from "react"
import {
    Activity,
    Wind,
    ShieldAlert,
    MessageSquareText,
    Bot,
    Loader2,
} from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PatientIntakeForm } from "@/components/dashboard/PatientIntakeForm"
import { RiskGaugeCard } from "@/components/dashboard/RiskGaugeCard"
import { HistoryTrendChart } from "@/components/dashboard/HistoryTrendChart"
import { PredictionResponse, useHistoryGet, useStatsGet } from "@/lib/api/generated"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"

// Components
import { EnvironmentalContextCard } from "@/components/dashboard/EnvironmentalContextCard"
import { EnvironmentalFallback } from "@/components/dashboard/EnvironmentalFallback"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { AnomalyAlert } from "@/components/dashboard/AnomalyAlert"
import { ExplainerChat, Message } from "@/components/dashboard/ExplainerChat"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"

export const dynamic = 'force-dynamic'

function DashboardContent() {
    const searchParams = useSearchParams()
    const searchTerm = searchParams.get("search")?.toLowerCase() || ""

    const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null)
    const [showAnomalyAlert, setShowAnomalyAlert] = useState(false)
    const [showChat, setShowChat] = useState(false)
    const [currentFeatures, setCurrentFeatures] = useState<any>(null)
    const [messages, setMessages] = useState<Message[]>([])

    const { data: historyData, refetch: refetchHistory } = useHistoryGet()
    const { data: statsData, refetch: refetchStats } = useStatsGet()

    // Filter history based on search
    const filteredHistory = historyData?.data?.filter(record => {
        if (!searchTerm) return true
        const nameMatch = record.patient_name?.toLowerCase().includes(searchTerm)
        const idMatch = record.id.toLowerCase().includes(searchTerm)
        return nameMatch || idMatch
    }) || []

    useEffect(() => {
        refetchHistory()
        refetchStats()
    }, [refetchHistory, refetchStats])

    const handleSuccess = (result: PredictionResponse, features?: any) => {
        setPredictionResult(result)
        if (features) setCurrentFeatures(features)

        setMessages([{
            id: "welcome",
            role: "assistant",
            text: `I've analyzed the patient profile (Risk: ${(result.prediction.risk_score * 100).toFixed(0)}%). Ask me about the key drivers.`
        }])

        if (result.anomaly_detection && result.anomaly_detection.is_outlier) {
            setShowAnomalyAlert(true)
        }

        setTimeout(() => {
            refetchHistory()
            refetchStats()
        }, 500)
    }

    return (
        <div className="flex flex-col min-h-screen gap-6 p-6 relative bg-background/50">
            {/* Background Mesh */}
            <div className="absolute inset-0 mesh-gradient-light opacity-30 pointer-events-none -z-10" />

            {/* Explainer Chat Overlay */}
            <ExplainerChat
                isOpen={showChat}
                onClose={() => setShowChat(false)}
                currentPrediction={predictionResult && currentFeatures ? {
                    risk_score: predictionResult.prediction.risk_score,
                    features: currentFeatures
                } : null}
                messages={messages}
                setMessages={setMessages}
            />

            {/* Chat FAB */}
            <AnimatePresence>
                {predictionResult && !showChat && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowChat(true)}
                        className="fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full bg-teal-600 text-white shadow-lg shadow-teal-500/40 flex items-center justify-center hover:bg-teal-700 transition-colors"
                    >
                        <MessageSquareText className="h-6 w-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Anomaly Alert Modal */}
            {predictionResult?.anomaly_detection && (
                <AnomalyAlert
                    isOpen={showAnomalyAlert}
                    onAcknowledge={() => setShowAnomalyAlert(false)}
                    anomalyScore={predictionResult.anomaly_detection.anomaly_score}
                    flaggedFeatures={predictionResult.anomaly_detection.flagged_features}
                />
            )}

            {/* Top Stats Row (Bento) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BentoGridItem
                    className="md:col-span-1 bg-white/60 dark:bg-slate-900/60"
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Patients</h3>
                            <Activity className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                {statsData?.data?.total_patients || 0}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 font-medium">Analyzed to date</p>
                        </div>
                    </div>
                </BentoGridItem>

                <BentoGridItem
                    className="md:col-span-1 bg-white/60 dark:bg-slate-900/60"
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">High Risk</h3>
                            <ShieldAlert className="h-5 w-5 text-rose-500" />
                        </div>
                        <div>
                            <div className="text-4xl font-black text-rose-600 tracking-tight">
                                {statsData?.data?.high_risk_count || 0}
                            </div>
                            <p className="text-xs text-rose-600/70 mt-1 font-medium">Critical cases flagged</p>
                        </div>
                    </div>
                </BentoGridItem>

                <BentoGridItem
                    className="md:col-span-1 bg-white/60 dark:bg-slate-900/60"
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Avg FEV1</h3>
                            <Wind className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-4xl font-black text-emerald-600 tracking-tight">
                                {statsData?.data?.avg_fev1?.toFixed(1) || "0.0"} <span className="text-xl font-semibold text-emerald-600/60">L</span>
                            </div>
                            <p className="text-xs text-emerald-600/70 mt-1 font-medium">Population Average</p>
                        </div>
                    </div>
                </BentoGridItem>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch relative">
                {/* Left Column: Intake or Result (Span 2) - Master of Height */}
                <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence mode="wait">
                        {predictionResult ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-6"
                            >
                                <ErrorBoundary fallback={<EnvironmentalFallback />}>
                                    <EnvironmentalContextCard
                                        data={predictionResult.environmental_data}
                                        isLoading={false}
                                    />
                                </ErrorBoundary>

                                <RiskGaugeCard
                                    riskScore={predictionResult.prediction.risk_score}
                                    lowerBound={predictionResult.trust_signal.prediction_interval.lower_bound}
                                    upperBound={predictionResult.trust_signal.prediction_interval.upper_bound}
                                    trustRating={predictionResult.trust_signal.trust_rating}
                                />

                                <div className="flex justify-center flex-col items-center gap-3 p-4 glass rounded-xl border-dashed border-2 border-teal-200/30">
                                    <button
                                        className="text-sm text-teal-700 font-bold hover:text-teal-900 flex items-center gap-2 group transition-colors"
                                        onClick={() => setShowChat(true)}
                                    >
                                        <Bot className="h-5 w-5 text-teal-600 group-hover:scale-110 transition-transform" />
                                        Explain this prediction
                                    </button>
                                    <button
                                        className="text-xs text-muted-foreground hover:text-primary underline decoration-dotted underline-offset-4"
                                        onClick={() => setPredictionResult(null)}
                                    >
                                        Start New Analysis
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <PatientIntakeForm
                                    onPredictionSuccess={(data) => handleSuccess(data)}
                                    onPredictionSuccessWithData={(data, features) => handleSuccess(data, features)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Column: History Sidebar (Span 1) - Follower of Height */}
                <div className="lg:col-span-1 relative min-h-[500px]">
                    <div className="lg:absolute lg:inset-0 h-full w-full">
                        <Card variant="glass" className="flex flex-col h-full relative overflow-hidden backdrop-blur-xl bg-white/40 border-white/20 rounded-3xl">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                            <CardHeader className="py-4 border-b border-teal-100/30 relative z-10 shrink-0">
                                <CardTitle className="text-lg font-semibold text-teal-900/80 flex items-center gap-2">
                                    <Activity className="h-4 w-4" /> Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-hidden p-0 relative z-10">
                                <div className="h-full overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar">
                                    <AnimatePresence mode="popLayout">
                                        {filteredHistory.length > 0 ? (
                                            filteredHistory.map((record, index) => (
                                                <motion.div
                                                    key={record.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="group p-3 rounded-xl bg-white/50 border border-white/40 hover:bg-white/80 hover:shadow-md transition-all cursor-default"
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="font-semibold text-slate-800 text-sm">
                                                            {record.patient_name || "Anonymous Patient"}
                                                        </p>
                                                        <span className={cn(
                                                            "text-xs font-bold px-2 py-0.5 rounded-full",
                                                            record.risk_score > 0.7 ? "bg-red-100 text-red-700" :
                                                                record.risk_score > 0.3 ? "bg-amber-100 text-amber-700" :
                                                                    "bg-emerald-100 text-emerald-700"
                                                        )}>
                                                            {(record.risk_score * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div className="text-xs text-slate-500">
                                                            {new Date(record.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {record.age} yrs
                                                        </div>
                                                        {(record as any).flagged_features?.length > 0 && (
                                                            <TooltipProvider>
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <ShieldAlert className="h-4 w-4 text-amber-500 cursor-help hover:text-amber-600 transition-colors" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="left" className="bg-white/95 backdrop-blur-xl border-amber-200 text-amber-900 shadow-xl p-3">
                                                                        <div className="flex items-center gap-2 mb-2 border-b border-amber-100 pb-1">
                                                                            <ShieldAlert className="h-3 w-3 text-amber-500" />
                                                                            <p className="font-semibold text-xs">Anomaly Factors</p>
                                                                        </div>
                                                                        <ul className="space-y-1">
                                                                            {(record as any).flagged_features.map((f: string, i: number) => (
                                                                                <li key={i} className="text-xs flex items-center gap-1.5 capitalize">
                                                                                    <span className="h-1 w-1 rounded-full bg-amber-400" />
                                                                                    {f.replace(/_/g, ' ')}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/50">
                                                <p className="text-sm">No recent history</p>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </CardContent>
                            {/* Mini Chart at bottom of sidebar */}
                            <div className="h-[120px] border-t border-teal-100/30 p-4 bg-white/20 relative z-10 shrink-0">
                                {historyData?.data && <HistoryTrendChart data={historyData.data} />}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                <p className="text-teal-900/60 font-medium">Loading Dashboard...</p>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    )
}
