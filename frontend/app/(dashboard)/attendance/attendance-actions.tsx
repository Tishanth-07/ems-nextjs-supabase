'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { clockIn, clockOut } from './actions'
import { toast } from 'sonner'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AttendanceActions({ todayLog }: { todayLog: any }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter() // Revalidate client cache if needed, though actions do it

    async function handleClockIn() {
        setLoading(true)
        const result = await clockIn()
        setLoading(false)
        if (result?.error) toast.error(result.error)
        else {
            toast.success('Clocked In!')
            // Optional: router.refresh() if revalidatePath isn't enough for client
        }
    }

    async function handleClockOut() {
        setLoading(true)
        const result = await clockOut()
        setLoading(false)
        if (result?.error) toast.error(result.error)
        else toast.success('Clocked Out!')
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Today's Action</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="text-lg">
                    Status: <span className="font-bold capitalize">{todayLog ? (todayLog.clock_out ? 'Clocked Out' : 'Clocked In') : 'Not Started'}</span>
                </div>

                <div className="flex gap-4">
                    {!todayLog && (
                        <Button
                            onClick={handleClockIn}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            {loading ? 'Clocking In...' : 'Clock In'}
                        </Button>
                    )}

                    {todayLog && !todayLog.clock_out && (
                        <Button
                            onClick={handleClockOut}
                            disabled={loading}
                            variant="destructive"
                            className="w-full"
                        >
                            {loading ? 'Clocking Out...' : 'Clock Out'}
                        </Button>
                    )}

                    {todayLog && todayLog.clock_out && (
                        <Button disabled variant="outline" className="w-full">Day Completed</Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
