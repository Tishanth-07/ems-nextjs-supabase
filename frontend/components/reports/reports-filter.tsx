"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { addDays, format, subDays } from "date-fns"
import { DateRange } from "react-day-picker"
import { CalendarDateRangePicker } from "@/components/date-range-picker"

export function ReportsFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Initialize state from URL params or default to last 30 days
    const [date, setDate] = useState<DateRange | undefined>({
        from: searchParams.get("from") ? new Date(searchParams.get("from")!) : subDays(new Date(), 30),
        to: searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date(),
    })

    // Update URL when date changes (debounced or on effect)
    useEffect(() => {
        if (date?.from) {
            const params = new URLSearchParams(searchParams.toString())
            params.set("from", format(date.from, "yyyy-MM-dd"))
            if (date.to) {
                params.set("to", format(date.to, "yyyy-MM-dd"))
            } else {
                params.delete("to")
            }
            router.push(`?${params.toString()}`, { scroll: false })
        }
    }, [date, router, searchParams])

    return (
        <div className="flex items-center gap-2">
            <CalendarDateRangePicker date={date} setDate={setDate} />
        </div>
    )
}
