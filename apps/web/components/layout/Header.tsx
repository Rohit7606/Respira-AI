"use client"

import { useState } from "react"
import { Menu, Search, Bell, AlertTriangle, CheckCircle } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/Sidebar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useHistoryGet } from "@/lib/api/generated"
import { useRouter, useSearchParams } from "next/navigation"

export function Header() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { data: historyData } = useHistoryGet()
    const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")

    // Filter for high-risk alerts (Risk > 80% or Critical)
    const alerts = historyData?.data?.filter(record => record.risk_score > 0.8) || []

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchValue(value)
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set("search", value)
        } else {
            params.delete("search")
        }
        router.replace(`?${params.toString()}`)
    }

    return (
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-teal-100/40 bg-white/70 backdrop-blur-xl px-8 transition-all">
            <div className="flex items-center gap-4 shrink-0">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 md:hidden text-teal-700 hover:bg-teal-50"
                        >
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col p-0 border-r border-teal-800/50 bg-teal-950">
                        <Sidebar className="w-full border-none shadow-none" />
                    </SheetContent>
                </Sheet>
                <div>
                    <h1 className="text-xl font-bold text-teal-950 tracking-tight font-display hidden md:block">
                        Clinical Dashboard
                    </h1>
                </div>
            </div>

            {/* Global Search */}
            <div className="flex-1 max-w-md mx-auto hidden md:block group">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600/50 group-focus-within:text-teal-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search patients, ID, or vitals..."
                        value={searchValue}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 h-10 rounded-full bg-teal-50/50 border border-teal-100/50 text-sm text-teal-900 placeholder:text-teal-600/40 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-teal-600 hover:bg-teal-50 hover:text-teal-800 rounded-full">
                            <Bell className="h-5 w-5" />
                            {alerts.length > 0 && (
                                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white animate-pulse" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-[320px] p-0 shadow-xl border-teal-100 bg-white/95 backdrop-blur-md">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-teal-50">
                            <h4 className="font-semibold text-teal-900 text-sm">Notifications</h4>
                            <span className="text-xs text-teal-500 font-medium">{alerts.length} New</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {alerts.length > 0 ? (
                                alerts.map((alert) => (
                                    <div key={alert.id} className="p-3 border-b border-teal-50 hover:bg-teal-50/50 transition-colors flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">Critical Risk Detected</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Patient <span className="font-semibold">{alert.patient_name || alert.id.slice(0, 8)}</span> has a risk score of {(alert.risk_score * 100).toFixed(0)}%.
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1.5">
                                                {new Date(alert.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 flex flex-col items-center justify-center text-center text-slate-500">
                                    <CheckCircle className="h-8 w-8 text-emerald-400 mb-2" />
                                    <p className="text-sm">All Clear</p>
                                    <p className="text-xs text-slate-400">No critical anomalies detected.</p>
                                </div>
                            )}
                        </div>
                        {alerts.length > 0 && (
                            <div className="p-2 bg-teal-50/30 border-t border-teal-50 text-center">
                                <Button variant="link" className="text-xs text-teal-600 h-auto p-0 hover:no-underline">
                                    View All History
                                </Button>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>

                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-teal-100 to-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-xs ring-2 ring-white shadow-sm cursor-pointer hover:ring-teal-200 transition-all">
                    DR
                </div>
            </div>
        </header>
    )
}
