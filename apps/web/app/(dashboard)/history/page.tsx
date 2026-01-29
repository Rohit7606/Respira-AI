"use client"

import { useState, useMemo } from "react"
import { useHistoryGet } from "@/lib/api/generated"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, User, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { PatientProgressView } from "@/components/history/PatientProgressView"

type GroupedPatient = {
    id: string
    name: string
    lastVisit: string
    totalVisits: number
    latestRisk: number
    records: any[]
}

export default function HistoryPage() {
    const { data: historyData, isLoading } = useHistoryGet()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

    // Group raw history records by Patient ID to create unique "Patient Profiles"
    const groupedPatients = useMemo(() => {
        const data = historyData?.data
        if (!data) return []

        const groups: Record<string, GroupedPatient> = {}

        data.forEach(record => {
            // Use patient_id as grouping key (added in new schema)
            // Fallback to record.id if migration hasn't run or data is missing
            const groupingId = (record as any).patient_id || record.id

            if (!groups[groupingId]) {
                groups[groupingId] = {
                    id: groupingId,
                    name: record.patient_name || "Unknown Patient",
                    lastVisit: record.created_at,
                    totalVisits: 0,
                    latestRisk: 0,
                    records: []
                }
            }
            groups[groupingId].records.push(record)
            groups[groupingId].totalVisits++
            // Keep track of latest visit for sorting
            if (new Date(record.created_at) > new Date(groups[groupingId].lastVisit)) {
                groups[groupingId].lastVisit = record.created_at
                groups[groupingId].latestRisk = record.risk_score
            }
        })

        // Convert to array and sort by last visit (most recent first)
        return Object.values(groups).sort((a, b) =>
            new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
        )
    }, [historyData])

    // Filter based on search
    const filteredPatients = groupedPatients.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const selectedPatient = selectedPatientId
        ? groupedPatients.find(p => p.id === selectedPatientId)
        : null

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] gap-6 p-6 relative overflow-hidden rounded-3xl border border-teal-50/50 shadow-sm">
            <div className="absolute inset-0 mesh-gradient-light -z-10" />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-1"
            >
                <h1 className="text-3xl font-bold tracking-tight text-teal-950 font-display">Patient History</h1>
                <p className="text-slate-500/80 font-medium">Search and analyze patient progress trajectories.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">

                {/* LEFT COLUMN: Patient List */}
                <Card variant="glass" className="lg:col-span-4 flex flex-col h-full border-teal-100/40 shadow-xl shadow-teal-900/5 rounded-3xl overflow-hidden">
                    <div className="p-4 border-b border-teal-100/30 space-y-4 bg-white/40 backdrop-blur-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-teal-600/50" />
                            <Input
                                type="search"
                                placeholder="Search Name or ID..."
                                className="pl-10 bg-white/50 border-teal-200/50 focus:border-teal-500/50 focus:bg-white/80 transition-all rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold text-teal-700/60 uppercase tracking-wider px-1">
                            <span>Patients</span>
                            <span className="bg-teal-100/50 text-teal-800 px-2 py-0.5 rounded-full">{filteredPatients.length}</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex justify-center p-8 text-teal-600/60">Loading...</div>
                        ) : filteredPatients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-teal-600/60 text-sm">
                                No patients found.
                            </div>
                        ) : (
                            filteredPatients.map(patient => (
                                <button
                                    key={patient.id}
                                    onClick={() => setSelectedPatientId(patient.id)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-xl border transition-all duration-300 flex items-center justify-between group relative overflow-hidden",
                                        selectedPatientId === patient.id
                                            ? "bg-teal-500/10 border-teal-500/30 shadow-sm"
                                            : "bg-white/40 border-transparent hover:bg-white/60 hover:border-teal-100 hover:shadow-sm"
                                    )}
                                >
                                    {/* Active Indicator */}
                                    {selectedPatientId === patient.id && (
                                        <motion.div
                                            layoutId="active-patient"
                                            className="absolute inset-0 bg-teal-500/5 -z-10"
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}

                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                            selectedPatientId === patient.id
                                                ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                                                : "bg-teal-50 text-teal-400 group-hover:scale-105 group-hover:bg-teal-100 transition-transform"
                                        )}>
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className={cn("font-semibold text-sm truncate transition-colors", selectedPatientId === patient.id ? "text-teal-950" : "text-slate-700")}>
                                                {patient.name}
                                            </h3>
                                            <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                                                ID: {patient.id.slice(0, 8)}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className={cn(
                                        "h-4 w-4 text-teal-400 opacity-0 transition-all duration-300",
                                        selectedPatientId === patient.id ? "opacity-100 translate-x-0" : "group-hover:opacity-50 group-hover:-translate-x-1"
                                    )} />
                                </button>
                            ))
                        )}
                    </div>
                </Card>

                {/* RIGHT COLUMN: Progress Details */}
                <div className="lg:col-span-8 h-full min-h-0 overflow-y-auto pr-2 pb-10">
                    <AnimatePresence mode="wait">
                        {selectedPatient ? (
                            <motion.div
                                key={selectedPatient.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <PatientProgressView
                                    records={selectedPatient.records}
                                    patientName={selectedPatient.name}
                                    patientId={selectedPatient.id}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-slate-400"
                            >
                                <User className="h-16 w-16 mb-4 opacity-20" />
                                <h3 className="text-lg font-semibold">No Patient Selected</h3>
                                <p className="text-sm max-w-xs text-center mt-2">
                                    Select a patient from the list on the left to view their detailed progress report and analytics.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    )
}
