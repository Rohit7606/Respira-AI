"use client"

import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/Sidebar"
import { Button } from "@/components/ui/button"

export function Header() {
    return (
        <div className="flex h-14 items-center gap-4 border-b border-teal-200 bg-teal-50/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                    <Sidebar className="w-full border-none" />
                </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
                {/* Add search or title here if needed */}
                <h1 className="text-2xl font-semibold text-teal-900">Clinical Dashboard</h1>
            </div>
        </div>
    )
}
