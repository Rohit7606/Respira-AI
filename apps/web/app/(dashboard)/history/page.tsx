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
        <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-teal-900">Patient History</h1>
                <p className="text-muted-foreground">Search and analyze patient progress trajectories.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">

                {/* LEFT COLUMN: Patient List */}
                <Card className="lg:col-span-4 flex flex-col border-teal-200 bg-white/50 backdrop-blur-sm shadow-sm h-full overflow-hidden">
                    <div className="p-4 border-b border-teal-100 space-y-4 bg-white/80">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-teal-600/50" />
                            <Input
                                type="search"
                                placeholder="Search Name or ID..."
                                className="pl-10 bg-white border-teal-200 focus:border-teal-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="text-xs font-semibold text-teal-600/70 uppercase tracking-wider">
                            Patients ({filteredPatients.length})
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {isLoading ? (
                            <div className="flex justify-center p-8 text-muted-foreground">Loading...</div>
                        ) : filteredPatients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                                No patients found.
                            </div>
                        ) : (
                            filteredPatients.map(patient => (
                                <button
                                    key={patient.id}
                                    onClick={() => setSelectedPatientId(patient.id)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-center justify-between group",
                                        selectedPatientId === patient.id
                                            ? "bg-teal-50 border-teal-500 shadow-sm"
                                            : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                                    )}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                            selectedPatientId === patient.id ? "bg-teal-200 text-teal-800" : "bg-slate-100 text-slate-500"
                                        )}>
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm truncate text-slate-900">
                                                {patient.name}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground truncate font-mono">
                                                ID: {patient.id.slice(0, 8)}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className={cn(
                                        "h-4 w-4 text-teal-400 opacity-0 transition-all",
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
                                className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400"
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
