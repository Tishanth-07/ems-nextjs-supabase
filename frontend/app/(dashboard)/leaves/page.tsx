import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LeaveRequestForm } from './leave-request-form'
import { CancelLeaveButton } from './cancel-leave-button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default async function LeavesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: leaves } = await (supabase as any)
        .from('leaves')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Leave Management</h1>

            <div className="grid gap-6 md:grid-cols-2">
                <LeaveRequestForm />

                <Card>
                    <CardHeader>
                        <CardTitle>Balance (Demo)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Vacation</span>
                                <span className="font-bold">12 / 15 Days</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Sick</span>
                                <span className="font-bold">5 / 10 Days</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-md border bg-white dark:bg-gray-800">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaves?.map((leave: any) => (
                            <TableRow key={leave.id}>
                                <TableCell>{leave.type}</TableCell>
                                <TableCell>{leave.start_date} to {leave.end_date}</TableCell>
                                <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold capitalize
                    ${leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'}`}>
                                        {leave.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    {leave.status === 'pending' && (
                                        <CancelLeaveButton leaveId={leave.id} />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {leaves?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No leave requests found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
