'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

type AttendanceLog = Database['public']['Tables']['attendance_logs']['Row']
type Leave = Database['public']['Tables']['leaves']['Row']

interface EmployeeDashboardProps {
    userId: string
    initialAttendance: AttendanceLog | null
    initialLeaves: Leave[]
    monthAttendance: AttendanceLog[]
}

export function EmployeeDashboard({
    userId,
    initialAttendance,
    initialLeaves,
    monthAttendance: initialMonthAttendance
}: EmployeeDashboardProps) {
    const [todayAttendance, setTodayAttendance] = useState<AttendanceLog | null>(initialAttendance)
    const [leaves, setLeaves] = useState<Leave[]>(initialLeaves)
    const [monthAttendance, setMonthAttendance] = useState<AttendanceLog[]>(initialMonthAttendance)
    const supabase = createClient()

    // Subscribe to real-time attendance changes
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]

        const attendanceChannel = supabase
            .channel('my-attendance')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'attendance_logs',
                    filter: `employee_id=eq.${userId}`,
                },
                async (payload) => {
                    console.log('Attendance update:', payload)

                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const updatedLog = payload.new as AttendanceLog

                        // Update today's attendance
                        if (updatedLog.date === today) {
                            setTodayAttendance(updatedLog)
                        }

                        // Update month attendance
                        setMonthAttendance((current) => {
                            const exists = current.find((a) => a.id === updatedLog.id)
                            if (exists) {
                                return current.map((a) => (a.id === updatedLog.id ? updatedLog : a))
                            } else {
                                return [updatedLog, ...current]
                            }
                        })
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = (payload.old as AttendanceLog).id
                        if (todayAttendance?.id === deletedId) {
                            setTodayAttendance(null)
                        }
                        setMonthAttendance((current) => current.filter((a) => a.id !== deletedId))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(attendanceChannel)
        }
    }, [userId, supabase, todayAttendance])

    // Subscribe to real-time leave changes
    useEffect(() => {
        const leavesChannel = supabase
            .channel('my-leaves')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leaves',
                    filter: `employee_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('Leave update:', payload)

                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const updatedLeave = payload.new as Leave
                        setLeaves((current) => {
                            const exists = current.find((l) => l.id === updatedLeave.id)
                            if (exists) {
                                return current.map((l) => (l.id === updatedLeave.id ? updatedLeave : l))
                            } else {
                                return [updatedLeave, ...current]
                            }
                        })
                    } else if (payload.eventType === 'DELETE') {
                        setLeaves((current) => current.filter((l) => l.id !== (payload.old as Leave).id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(leavesChannel)
        }
    }, [userId, supabase])

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'pending':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                )
            case 'approved':
                return (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Approved
                    </Badge>
                )
            case 'rejected':
                return (
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                        <XCircle className="mr-1 h-3 w-3" />
                        Rejected
                    </Badge>
                )
            default:
                return <Badge variant="outline">Unknown</Badge>
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '-'
        return new Date(timeStr).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Attendance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Attendance
                    </CardTitle>
                    <CardDescription>Your attendance for this month</CardDescription>
                </CardHeader>
                <CardContent>
                    {monthAttendance.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No attendance records yet
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Clock In</TableHead>
                                        <TableHead>Clock Out</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {monthAttendance.slice(0, 10).map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{formatDate(log.date)}</TableCell>
                                            <TableCell>{formatTime(log.clock_in)}</TableCell>
                                            <TableCell>{formatTime(log.clock_out)}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    log.status === 'present' ? 'default' :
                                                        log.status === 'absent' ? 'destructive' :
                                                            'outline'
                                                }>
                                                    {log.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Leave Requests */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Leave Requests
                    </CardTitle>
                    <CardDescription>Your recent leave applications</CardDescription>
                </CardHeader>
                <CardContent>
                    {leaves.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No leave requests yet
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {leaves.slice(0, 5).map((leave) => (
                                <div key={leave.id} className="p-4 border rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-semibold">{leave.type}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                                            </p>
                                        </div>
                                        {getStatusBadge(leave.status)}
                                    </div>
                                    {leave.reason && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {leave.reason}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
