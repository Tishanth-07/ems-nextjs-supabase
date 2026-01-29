'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function NotificationListener({ userId, role }: { userId: string, role: string }) {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel('global-notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leaves',
                },
                (payload) => {
                    // If Employee: Listen for updates to my leaves
                    if (role === 'employee' && payload.eventType === 'UPDATE') {
                        const newRecord = payload.new as any
                        if (newRecord.employee_id === userId) {
                            if (newRecord.status === 'approved') toast.success('Your leave request was Approved!')
                            if (newRecord.status === 'rejected') toast.error('Your leave request was Rejected.')
                            router.refresh()
                        }
                    }

                    // If Manager/Admin: Listen for new INSERTs (requests)
                    if ((role === 'manager' || role === 'admin') && payload.eventType === 'INSERT') {
                        const newRecord = payload.new as any
                        // Ideally check if this employee belongs to this manager
                        toast.info('New Leave Request Received')
                        router.refresh()
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, router, userId, role])

    return null
}
