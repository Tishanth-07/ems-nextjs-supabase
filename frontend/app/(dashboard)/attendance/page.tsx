import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AttendanceActions } from './attendance-actions'
import { AttendanceRealtimeListener } from '@/components/attendance/realtime-listener'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default async function AttendancePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const today = new Date().toISOString().split('T')[0]

    // Fetch today's status
    const { data: todayLog } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', today)
        .single()

    // Fetch history
    const { data: history } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', user.id)
        .order('date', { ascending: false })
        .limit(10)

    return (
        <div className="space-y-6">
            <AttendanceRealtimeListener userId={user.id} />
            <h1 className="text-2xl font-bold">Attendance</h1>

            <div className="grid gap-6 md:grid-cols-2">
                <AttendanceActions todayLog={todayLog} />

                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div>Work Hours Today: {todayLog?.duration || 0} hrs</div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-md border bg-white dark:bg-gray-800">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Clock In</TableHead>
                            <TableHead>Clock Out</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history?.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>{log.date}</TableCell>
                                <TableCell>{log.clock_in ? new Date(log.clock_in).toLocaleTimeString() : '-'}</TableCell>
                                <TableCell>{log.clock_out ? new Date(log.clock_out).toLocaleTimeString() : '-'}</TableCell>
                                <TableCell>{log.duration} hrs</TableCell>
                                <TableCell className="capitalize">{log.status}</TableCell>
                            </TableRow>
                        ))}
                        {history?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No attendance records found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
