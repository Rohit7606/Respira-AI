"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

// This type definition must match your API response item structure
export type HistoryRecord = {
    id: string
    created_at: string
    patient_name?: string // Added patient_name
    age: number
    fev1: number
    risk_score: number
    trust_rating: string
}

export const columns: ColumnDef<HistoryRecord>[] = [
    {
        accessorKey: "created_at",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue("created_at"))
            return <div className="pl-4">{date.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        },
    },
    {
        accessorKey: "patient_name",
        header: "Patient Name",
        cell: ({ row }) => <div className="font-medium text-teal-900">{row.getValue("patient_name") || "N/A"}</div>,
    },
    {
        accessorKey: "id",
        header: "Patient ID",
        cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">{String(row.getValue("id")).slice(0, 8)}...</div>,
    },
    {
        accessorKey: "age",
        header: "Age",
    },
    {
        accessorKey: "fev1",
        header: "FEV1 (L)",
        cell: ({ row }) => <div>{Number(row.getValue("fev1")).toFixed(2)}</div>,
    },
    {
        accessorKey: "gender",
        header: "Gender",
        cell: ({ row }) => <div className="capitalize text-muted-foreground">{row.getValue("gender") || "-"}</div>,
    },
    {
        accessorKey: "bmi",
        header: "BMI",
        cell: ({ row }) => <div>{row.getValue("bmi") ? Number(row.getValue("bmi")).toFixed(1) : "-"}</div>,
    },
    {
        accessorKey: "smoking",
        header: "Smoking",
        cell: ({ row }) => <div className="text-sm">{row.getValue("smoking") || "-"}</div>,
    },
    {
        accessorKey: "medication_use",
        header: "Meds",
        cell: ({ row }) => (
            <div>
                {row.getValue("medication_use") ? (
                    <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20">Yes</span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </div>
        ),
    },
    {
        accessorKey: "risk_score",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Risk Score
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const score = Number(row.getValue("risk_score"))
            return (
                <div className={`font-bold pl-4 ${score > 0.7 ? "text-red-600" : score > 0.3 ? "text-amber-600" : "text-emerald-600"}`}>
                    {(score * 100).toFixed(0)}%
                </div>
            )
        },
    },
    {
        accessorKey: "trust_rating",
        header: "Trust",
        cell: ({ row }) => <div className="capitalize">{row.getValue("trust_rating")}</div>,
    },
]
