"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { toast } from "sonner"

interface ReportsExportProps {
    data: any[]
    filename?: string
    label?: string
}

export function ReportsExport({ data, filename = "report", label = "Export CSV" }: ReportsExportProps) {
    const handleExport = () => {
        try {
            if (!data || data.length === 0) {
                toast.error("No data to export")
                return
            }

            // Simple CSV generation
            const headers = Object.keys(data[0])
            const csvContent = [
                headers.join(","), // Header row
                ...data.map(row => headers.map(fieldName => {
                    const value = row[fieldName]
                    // Handle strings with commas
                    return typeof value === 'string' && value.includes(',')
                        ? `"${value}"`
                        : value
                }).join(","))
            ].join("\n")

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.setAttribute("href", url)
            link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success("Report downloaded")
        } catch (error) {
            console.error("Export failed:", error)
            toast.error("Failed to export report")
        }
    }

    return (
        <Button variant="outline" onClick={handleExport}>
            <FileText className="mr-2 h-4 w-4" />
            {label}
        </Button>
    )
}
