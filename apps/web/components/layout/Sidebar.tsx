"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Activity, ShieldAlert, Wind, LogOut } from "lucide-react"
import { createBrowserClient } from '@supabase/ssr'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function Sidebar({ className }: React.HTMLAttributes<HTMLDivElement>) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push("/auth")
        toast.success("Signed out successfully")
    }

    const routes = [
        {
            label: "Clinical Dashboard",
            icon: Activity,
            href: "/dashboard",
        },
        {
            label: "Patient History",
            icon: Wind,
            href: "/history",
        },
        {
            label: "Anomaly Detection",
            icon: ShieldAlert,
            href: "/anomalies",
        },
    ]

    return (
        <div className={cn("sticky top-0 flex flex-col h-screen bg-teal-900 border-r border-teal-800 text-teal-100", className)}>
            {/* Brand Section */}
            <div className="flex h-20 items-center px-6 lg:h-[80px] border-b border-teal-800">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center text-teal-950">
                        <Wind className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-white font-display">
                        Respira AI
                    </h2>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 flex flex-col gap-2 p-4">
                <div className="space-y-1">
                    {routes.map((route) => {
                        const isActive = pathname === route.href
                        return (
                            <Button
                                key={route.href}
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start text-sm font-medium h-11 px-4 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-teal-800 text-white shadow-sm"
                                        : "text-teal-300 hover:bg-teal-800/50 hover:text-white"
                                )}
                                asChild
                            >
                                <Link href={route.href} className="flex items-center">
                                    <route.icon className={cn(
                                        "mr-3 h-5 w-5",
                                        isActive ? "text-teal-400" : "text-teal-400/70 group-hover:text-teal-400"
                                    )} />
                                    {route.label}
                                </Link>
                            </Button>
                        )
                    })}
                </div>
            </div>

            {/* User / Footer */}
            <div className="p-4 border-t border-teal-800">
                <div className="flex items-center justify-between px-2 mb-4">
                    <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Account</h3>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-teal-300 hover:text-white hover:bg-teal-800 transition-colors h-10 px-4 rounded-lg"
                    onClick={handleSignOut}
                >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div >
    )
}
