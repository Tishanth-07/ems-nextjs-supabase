import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApprovalActions } from './approval-actions'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default async function ApprovalsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: pendingLeaves } = await (supabase as any)
        .from('leaves')
        .select(`
      *,
      profiles:employee_id (full_name, email)
    `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Pending Approvals</h1>

            <div className="rounded-md border bg-white dark:bg-gray-800">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingLeaves?.map((leave: any) => (
                            <TableRow key={leave.id}>
                                <TableCell>
                                    <div className="font-medium">{leave.profiles?.full_name}</div>
                                    <div className="text-xs text-gray-500">{leave.profiles?.email}</div>
                                </TableCell>
                                <TableCell>{leave.type}</TableCell>
                                <TableCell>{leave.start_date} - {leave.end_date}</TableCell>
                                <TableCell className="max-w-xs">{leave.reason}</TableCell>
                                <TableCell className="text-right">
                                    <ApprovalActions id={leave.id} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {pendingLeaves?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No pending requests.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
