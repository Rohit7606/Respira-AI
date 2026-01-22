"use client"

import { useHistoryGet } from "@/lib/api/generated"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"

export default function HistoryPage() {
    const { data: historyData, isLoading } = useHistoryGet()

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-teal-900">Patient History</h1>
                <p className="text-muted-foreground">Complete record of all screenings.</p>
            </div>

            <Card className="border-teal-200 bg-white shadow-sm">
                <CardHeader>
                    <CardTitle>All Records</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <div className="h-8 w-full bg-muted animate-pulse rounded" />
                            <div className="h-12 w-full bg-muted/50 animate-pulse rounded" />
                            <div className="h-12 w-full bg-muted/50 animate-pulse rounded" />
                            <div className="h-12 w-full bg-muted/50 animate-pulse rounded" />
                        </div>
                    ) : (
                        <DataTable columns={columns} data={historyData?.data || []} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
