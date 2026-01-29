'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

export function AttendanceRealtimeListener({ userId }: { userId: string }) {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel('attendance-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'attendance_logs',
                    filter: `employee_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('Realtime change:', payload)
                    router.refresh()

                    if (payload.eventType === 'INSERT') {
                        toast.info('Attendance started')
                    } else if (payload.eventType === 'UPDATE') {
                        const newRecord = payload.new as any
                        if (newRecord.clock_out) {
                            toast.info('Attendance ended (Clocked Out)')
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, router, userId])

    return null
}
