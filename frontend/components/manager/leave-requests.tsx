'use client'

import { useEffect, useState, useTransition } from 'react'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { approveLeaveAction, rejectLeaveAction } from '@/app/(dashboard)/manager/leaves/actions'

type LeaveRequest = {
    id: number
    employee_id: string
    type: string
    start_date: string
    end_date: string
    reason: string | null
    status: Database['public']['Enums']['leave_status'] | null
    created_at: string
    approved_by: string | null
    profiles: {
        id: string
        full_name: string | null
        email: string
        photo_url: string | null
    } | null
}

interface LeaveRequestsProps {
    initialRequests: LeaveRequest[]
    teamIds: string[]
    managerId: string
}

export function LeaveRequests({ initialRequests, teamIds, managerId }: LeaveRequestsProps) {
    const [requests, setRequests] = useState<LeaveRequest[]>(initialRequests)
    const [isPending, startTransition] = useTransition()
    const supabase = createClient()

    // Subscribe to real-time leave changes
    useEffect(() => {
        if (teamIds.length === 0) return

        const channel = supabase
            .channel('team-leaves-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leaves',
                },
                async (payload) => {
                    console.log('Leave update:', payload)

                    // Check if this leave belongs to our team
                    const employeeId = payload.new?.employee_id || payload.old?.employee_id

                    if (!teamIds.includes(employeeId as string)) {
                        return
                    }

                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        // Fetch full record with profile data
                        const { data } = await supabase
                            .from('leaves')
                            .select(`
                                id,
                                employee_id,
                                type,
                                start_date,
                                end_date,
                                reason,
                                status,
                                created_at,
                                approved_by,
                                profiles!leaves_employee_id_fkey (
                                    id,
                                    full_name,
                                    email,
                                    photo_url
                                )
                            `)
                            .eq('id', payload.new.id)
                            .single()

                        if (data) {
                            setRequests((current) => {
                                const exists = current.find((r) => r.id === data.id)
                                if (exists) {
                                    return current.map((r) => (r.id === data.id ? data as LeaveRequest : r))
                                } else {
                                    return [data as LeaveRequest, ...current]
                                }
                            })
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setRequests((current) => current.filter((r) => r.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [teamIds, supabase])

    const handleApprove = async (leaveId: number, employeeName: string) => {
        startTransition(async () => {
            const result = await approveLeaveAction(leaveId)

            if (result.error) {
                toast.error(result.error)
                return
            }

            toast.success(`Leave approved for ${employeeName}`)
        })
    }

    const handleReject = async (leaveId: number, employeeName: string) => {
        startTransition(async () => {
            const result = await rejectLeaveAction(leaveId)

            if (result.error) {
                toast.error(result.error)
                return
            }

            toast.error(`Leave rejected for ${employeeName}`)
        })
    }

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

    const calculateDays = (startDate: string, endDate: string) => {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        return diffDays
    }

    const pending = requests.filter(r => r.status === 'pending')
    const approved = requests.filter(r => r.status === 'approved')
    const rejected = requests.filter(r => r.status === 'rejected')

    const renderLeaveTable = (leaves: LeaveRequest[], showActions = false) => {
        if (leaves.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No leave requests</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        {showActions ? 'No pending requests at the moment' : 'No requests in this category'}
                    </p>
                </div>
            )
        }

        return (
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            {showActions && <TableHead>Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaves.map((leave) => (
                            <TableRow key={leave.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={leave.profiles?.photo_url || undefined} />
                                            <AvatarFallback className="text-xs">
                                                {getInitials(leave.profiles?.full_name || 'UN')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm">{leave.profiles?.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{leave.profiles?.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{leave.type}</Badge>
                                </TableCell>
                                <TableCell>
                                    {calculateDays(leave.start_date, leave.end_date)} day{calculateDays(leave.start_date, leave.end_date) > 1 ? 's' : ''}
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <div>{formatDate(leave.start_date)}</div>
                                        <div className="text-muted-foreground">to {formatDate(leave.end_date)}</div>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-xs">
                                    <p className="text-sm truncate">{leave.reason || '-'}</p>
                                </TableCell>
                                <TableCell>{getStatusBadge(leave.status)}</TableCell>
                                {showActions && (
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => handleApprove(leave.id, leave.profiles?.full_name || 'Employee')}
                                                disabled={isPending}
                                            >
                                                {isPending ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-3 w-3" />
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleReject(leave.id, leave.profiles?.full_name || 'Employee')}
                                                disabled={isPending}
                                            >
                                                {isPending ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <XCircle className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Leave Requests
                </CardTitle>
                <CardDescription>
                    Review and manage leave requests from your team members
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="pending">
                            Pending ({pending.length})
                        </TabsTrigger>
                        <TabsTrigger value="approved">
                            Approved ({approved.length})
                        </TabsTrigger>
                        <TabsTrigger value="rejected">
                            Rejected ({rejected.length})
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending" className="mt-4">
                        {renderLeaveTable(pending, true)}
                    </TabsContent>
                    <TabsContent value="approved" className="mt-4">
                        {renderLeaveTable(approved, false)}
                    </TabsContent>
                    <TabsContent value="rejected" className="mt-4">
                        {renderLeaveTable(rejected, false)}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
