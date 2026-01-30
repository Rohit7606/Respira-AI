"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ShieldAlert } from "lucide-react"

interface AnomalyAlertProps {
    isOpen: boolean
    onAcknowledge: () => void
    anomalyScore: number
    flaggedFeatures: string[]
}

// NOTE: Since I don't have the full Radix Alert Dialog installed via CLI, 
// I will build a custom accessible modal using Fragment/Divs and Framer Motion 
// to match the existing premium aesthetic without complex dependency chains.
// Wait, I should probably stick to the plan. Let's build a custom Premium Alert component.

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function AnomalyAlert({ isOpen, onAcknowledge, anomalyScore, flaggedFeatures }: AnomalyAlertProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-md"
                    >
                        <Card className="border-amber-200 shadow-xl overflow-hidden">
                            <div className="bg-amber-500/10 p-6 flex flex-col items-center text-center space-y-4">
                                <div className="p-3 bg-amber-100 rounded-full">
                                    <ShieldAlert className="h-8 w-8 text-amber-600" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-xl text-amber-900">Unusual Patient Profile</h3>
                                    <p className="text-sm text-amber-700/80">
                                        The Trust Engine detected that this patient&apos;s data deviates significantly from typical asthma profiles.
                                    </p>
                                </div>

                                <div className="w-full bg-white/50 rounded-lg p-4 text-left space-y-2">
                                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Detection Reasons</p>
                                    <ul className="space-y-1">
                                        {flaggedFeatures.map((reason, i) => (
                                            <li key={i} className="text-sm text-amber-900 flex items-center gap-2">
                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                {reason}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="pt-2 border-t border-amber-200/50 mt-2 flex justify-between items-center text-xs text-amber-600">
                                        <span>Anomaly Score</span>
                                        <span className="font-mono font-bold">{anomalyScore.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="w-full pt-2">
                                    <Button
                                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                                        onClick={onAcknowledge}
                                    >
                                        Acknowledge & View Prediction
                                    </Button>
                                    <p className="text-[10px] text-amber-600/60 mt-2">
                                        An anomaly event has been logged for audit.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
