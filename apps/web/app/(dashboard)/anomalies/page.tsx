"use client"

import * as React from "react"
import { useHistoryGet } from "@/lib/api/generated"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ShieldAlert, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

export default function AnomaliesPage() {
    const { data: historyData } = useHistoryGet()
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

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-amber-900">Anomaly Detection</h1>
                <p className="text-muted-foreground">Flagged predictions requiring clinical review.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                    {anomalies.map((record) => (
                        <motion.div
                            key={record.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        >
                            <Card className="border-amber-200 bg-amber-50/30 transition-all duration-300">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-amber-900">
                                            {new Date(record.created_at).toLocaleDateString("en-GB")}
                                        </CardTitle>
                                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <CardDescription>ID: {record.id.slice(0, 8)}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Risk Score:</span>
                                            <span className="font-bold text-red-600">{(record.risk_score * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Trust Rating:</span>
                                            <span className="font-bold uppercase text-amber-700">{record.trust_rating}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>FEV1:</span>
                                            <span>{record.fev1} L</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        variant="outline"
                                        className="w-full border-amber-200 hover:bg-red-50 hover:text-red-900 hover:border-red-200"
                                        onClick={() => handleReview(record.id)}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Dismiss
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {anomalies.length === 0 && (
                    <div className="col-span-full p-12 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                        <CheckCircle className="h-10 w-10 mb-4 opacity-50 text-emerald-500" />
                        <p className="font-medium text-lg text-emerald-900">All Clear</p>
                        <p>No pending anomalies detected.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
