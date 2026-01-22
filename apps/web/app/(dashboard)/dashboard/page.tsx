"use client"

import { useState, useEffect } from "react"
import {
    Activity,
    Wind,
    ShieldAlert,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PatientIntakeForm } from "@/components/dashboard/PatientIntakeForm"
import { RiskGaugeCard } from "@/components/dashboard/RiskGaugeCard"
import { HistoryTrendChart } from "@/components/dashboard/HistoryTrendChart"
import { PredictionResponse } from "@/lib/api/generated"
import { useHistoryGet, useStatsGet } from "@/lib/api/generated"
import { motion, AnimatePresence } from "framer-motion"

// Phase 8 Imports
import { EnvironmentalContextCard } from "@/components/dashboard/EnvironmentalContextCard"
import { EnvironmentalFallback } from "@/components/dashboard/EnvironmentalFallback"
import { ErrorBoundary } from "@/components/ui/error-boundary"

// Phase 9 Imports
// Phase 9 Imports
import { AnomalyAlert } from "@/components/dashboard/AnomalyAlert"

// Phase 10 Imports
import { ExplainerChat, Message } from "@/components/dashboard/ExplainerChat"
import { MessageSquareText, Bot } from "lucide-react"

export default function DashboardPage() {
    const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null)
    const [showAnomalyAlert, setShowAnomalyAlert] = useState(false)
    // Phase 10 State
    const [showChat, setShowChat] = useState(false)
    const [currentFeatures, setCurrentFeatures] = useState<any>(null)
    const [messages, setMessages] = useState<Message[]>([])

    // Add history refresh trigger
    const { data: historyData, refetch: refetchHistory } = useHistoryGet()
    const { data: statsData, refetch: refetchStats } = useStatsGet()

    // Force refetch on mount to ensure fresh data
    useEffect(() => {
        refetchHistory()
        refetchStats()
    }, [refetchHistory, refetchStats])

    // Refresh history when a new prediction is made
    const handleSuccess = (result: PredictionResponse, features?: any) => {
        setPredictionResult(result)
        if (features) setCurrentFeatures(features)

        // Reset Chat with Welcome Message
        setMessages([{
            id: "welcome",
            role: "assistant",
            text: `I've analyzed the patient profile (Risk: ${(result.prediction.risk_score * 100).toFixed(0)}%). Ask me about the key drivers.`
        }])

        // Phase 9: Logic to trigger anomaly alert
        if (result.anomaly_detection && result.anomaly_detection.is_outlier) {
            setShowAnomalyAlert(true)
        }

        // Wait a small moment for DB propagation then refetch
        setTimeout(() => {
            refetchHistory()
            refetchStats()
        }, 500)
    }

    return (
        <div className="flex flex-col h-full gap-4 p-4 pt-0 relative overflow-hidden">
            {/* Phase 10: Explainer Chatbot */}
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

            {/* Fab for Chat (Only visible when prediction exists) */}
            {predictionResult && !showChat && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setShowChat(true)}
                    className="fixed bottom-8 right-8 z-30 h-14 w-14 rounded-full bg-teal-600 text-white shadow-xl flex items-center justify-center hover:bg-teal-700 transition-colors"
                >
                    <MessageSquareText className="h-6 w-6" />
                </motion.button>
            )}

            {/* Phase 9: Global Anomaly Alert Modal */}
            {predictionResult?.anomaly_detection && (
                <AnomalyAlert
                    isOpen={showAnomalyAlert}
                    onAcknowledge={() => setShowAnomalyAlert(false)}
                    anomalyScore={predictionResult.anomaly_detection.anomaly_score}
                    flaggedFeatures={predictionResult.anomaly_detection.flagged_features}
                />
            )}

            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <Card className="border-teal-200 bg-teal-50/50 shadow-sm transition-all hover:bg-teal-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-teal-800 uppercase tracking-wide">
                            Total Patients
                        </CardTitle>
                        <Activity className="h-5 w-5 text-teal-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-teal-900 mt-2">
                            {statsData?.data?.total_patients || 0}
                        </div>
                        <p className="text-xs font-medium text-teal-600/80 mt-1">
                            Analyzed to date
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50/30 shadow-sm transition-all hover:bg-red-50/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-red-800 uppercase tracking-wide">
                            High Risk
                        </CardTitle>
                        <ShieldAlert className="h-5 w-5 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-red-900 mt-2">
                            {statsData?.data?.high_risk_count || 0}
                        </div>
                        <p className="text-xs font-medium text-red-600/80 mt-1">
                            Patients flagged
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-teal-200 bg-emerald-50/30 shadow-sm transition-all hover:bg-emerald-50/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">
                            Avg FEV1
                        </CardTitle>
                        <Wind className="h-5 w-5 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-emerald-900 mt-2">
                            {statsData?.data?.avg_fev1?.toFixed(1) || "0.0"} <span className="text-lg font-semibold text-emerald-600/70">L</span>
                        </div>
                        <p className="text-xs font-medium text-emerald-600/80 mt-1">
                            Pop. Average
                        </p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <AnimatePresence mode="wait">
                        {predictionResult ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-2"
                            >
                                {/* Phase 8 Integration: Environmental Data */}
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
                                <div className="flex justify-center flex-col items-center gap-2">
                                    <button
                                        className="text-sm text-teal-600 font-medium hover:underline flex items-center gap-1"
                                        onClick={() => setShowChat(true)}
                                    >
                                        <Bot className="h-4 w-4" /> Ask Dr. AI for explanation
                                    </button>
                                    <button
                                        className="text-sm text-muted-foreground underline hover:text-primary transition-colors"
                                        onClick={() => setPredictionResult(null)}
                                    >
                                        Reset and analyze new patient
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
                <div className="col-span-3">
                    <Card className="flex flex-col border-teal-200 shadow-sm bg-white h-[600px]">
                        <CardHeader className="bg-teal-50/50 border-b border-teal-100 py-4">
                            <CardTitle className="text-teal-900 text-xl font-semibold">Recent Predictions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col pt-4 overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-2 min-h-0 space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {historyData?.data && historyData.data.length > 0 ? (
                                        historyData.data.map((record, index) => (
                                            <motion.div
                                                key={record.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex items-center justify-between border-b border-teal-100/50 pb-3 last:border-0 last:pb-0"
                                            >
                                                <div className="space-y-1">
                                                    <p className="text-base font-semibold leading-none text-teal-900">
                                                        {record.patient_name || `Patient ${record.id.slice(0, 4)}`}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        <span className="font-medium">{record.age} years old</span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                                                        {new Date(record.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-sm font-bold ${record.risk_score > 0.7 ? "text-red-600" :
                                                        record.risk_score > 0.3 ? "text-amber-600" : "text-emerald-600"
                                                        }`}>
                                                        {(record.risk_score * 100).toFixed(0)}% Risk
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                            <p className="text-sm">No recent history</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="mt-2 pt-2 border-t border-teal-100">
                                {historyData?.data && <HistoryTrendChart data={historyData.data} />}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
