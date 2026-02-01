'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, CheckCircle2, XCircle, AlertCircle, Coffee } from 'lucide-react'

type AttendanceLog = {
    id: number
    employee_id: string
    date: string
    clock_in: string | null
    clock_out: string | null
    status: Database['public']['Enums']['attendance_status'] | null
    duration: number | null
    profiles: {
        id: string
        full_name: string | null
        email: string
        photo_url: string | null
    } | null
}

type TeamMember = {
    id: string
    full_name: string | null
    email: string
}

interface TeamAttendanceProps {
    initialAttendance: AttendanceLog[]
    teamIds: string[]
    teamMembers: TeamMember[]
}

export function TeamAttendance({ initialAttendance, teamIds, teamMembers }: TeamAttendanceProps) {
    const [attendance, setAttendance] = useState<AttendanceLog[]>(initialAttendance)
    const supabase = createClient()

    // Subscribe to real-time attendance changes
    useEffect(() => {
        if (teamIds.length === 0) return

        const today = new Date().toISOString().split('T')[0]

        const channel = supabase
            .channel('team-attendance-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'attendance_logs',
                    filter: `date=eq.${today}`,
                },
                async (payload) => {
                    console.log('Attendance update:', payload)

                    // Check if this attendance belongs to our team
                    const employeeId = payload.new?.employee_id || payload.old?.employee_id

                    if (!teamIds.includes(employeeId as string)) {
                        return
                    }

                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        // Fetch full record with profile data
                        const { data } = await supabase
                            .from('attendance_logs')
                            .select(`
                                id,
                                employee_id,
                                date,
                                clock_in,
                                clock_out,
                                status,
                                duration,
                                profiles!attendance_logs_employee_id_fkey (
                                    id,
                                    full_name,
                                    email,
                                    photo_url
                                )
                            `)
                            .eq('id', payload.new.id)
                            .single()

                        if (data) {
                            setAttendance((current) => {
                                const exists = current.find((a) => a.id === data.id)
                                if (exists) {
                                    return current.map((a) => (a.id === data.id ? data as AttendanceLog : a))
                                } else {
                                    return [...current, data as AttendanceLog]
                                }
                            })
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setAttendance((current) => current.filter((a) => a.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [teamIds, supabase])

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'present':
                return (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Present
                    </Badge>
                )
            case 'absent':
                return (
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                        <XCircle className="mr-1 h-3 w-3" />
                        Absent
                    </Badge>
                )
            case 'half_day':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Half Day
                    </Badge>
                )
            case 'on_leave':
                return (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        <Coffee className="mr-1 h-3 w-3" />
                        On Leave
                    </Badge>
                )
            default:
                return <Badge variant="outline">Unknown</Badge>
        }
    }

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '-'
        return new Date(timeStr).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const formatDuration = (minutes: number | null) => {
        if (!minutes) return '-'
        const hours = Math.floor(minutes / 60)
        const mins = Math.round(minutes % 60)
        return `${hours}h ${mins}m`
    }

    // Find team members who haven't clocked in yet
    const attendedIds = new Set(attendance.map(a => a.employee_id))
    const notClockedIn = teamMembers.filter(m => !attendedIds.has(m.id))

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Today's Attendance
                </CardTitle>
                <CardDescription>
                    Real-time attendance tracking for your team - {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {attendance.length === 0 && notClockedIn.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No attendance records yet</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            Team members will appear here once they clock in
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Clocked In */}
                        {attendance.length > 0 && (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Clock In</TableHead>
                                            <TableHead>Clock Out</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendance.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={log.profiles?.photo_url || undefined} />
                                                            <AvatarFallback className="text-xs">
                                                                {getInitials(log.profiles?.full_name || 'UN')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-sm">{log.profiles?.full_name}</p>
                                                            <p className="text-xs text-muted-foreground">{log.profiles?.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatTime(log.clock_in)}</TableCell>
                                                <TableCell>{formatTime(log.clock_out)}</TableCell>
                                                <TableCell>{formatDuration(log.duration)}</TableCell>
                                                <TableCell>{getStatusBadge(log.status)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Not Clocked In */}
                        {notClockedIn.length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Not Clocked In Yet</h4>
                                <div className="rounded-md border bg-muted/20">
                                    <Table>
                                        <TableBody>
                                            {notClockedIn.map((member) => (
                                                <TableRow key={member.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback className="text-xs">
                                                                    {getInitials(member.full_name || 'UN')}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-sm">{member.full_name}</p>
                                                                <p className="text-xs text-muted-foreground">{member.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="outline" className="text-muted-foreground">
                                                            Waiting
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
