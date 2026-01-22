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
            label: "Dashboard",
            icon: Activity,
            href: "/dashboard",
            color: "text-sky-500",
        },
        {
            label: "History",
            icon: Wind,
            href: "/history",
            color: "text-violet-500",
        },
        {
            label: "Anomalies",
            icon: ShieldAlert,
            href: "/anomalies",
            color: "text-pink-700",
        },
    ]

    return (
        <div className={cn("relative pb-12 min-h-screen border-r border-teal-800 bg-teal-800", className)}>
            <div className="space-y-4">
                <div className="px-3">
                    <div className="flex h-14 items-center px-4 lg:h-[60px]">
                        <h2 className="text-2xl font-bold tracking-tight text-white">
                            Respira AI
                        </h2>
                    </div>
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={pathname === route.href ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start text-base h-12 mb-1 text-teal-100 hover:text-white hover:bg-teal-700",
                                    pathname === route.href && "bg-teal-900 text-white hover:bg-teal-900"
                                )}
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className={cn("mr-3 h-5 w-5", "text-teal-200")} />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="absolute bottom-4 left-0 w-full px-3">
                <div className="border-t border-teal-700/50 pt-4 mb-2">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-teal-100/80 hover:text-white hover:bg-teal-700/50 transition-all duration-200"
                        onClick={handleSignOut}
                    >
                        <LogOut className="mr-3 h-5 w-5 text-teal-300" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </div >
    )
}
