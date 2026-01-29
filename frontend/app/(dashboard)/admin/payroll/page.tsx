import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default async function PayrollPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Demo: Fetch payroll summaries
    const { data: payrolls } = await supabase
        .from('payroll_summaries')
        .select(`
      *,
      profiles:employee_id (full_name, email, department)
    `)
        .order('pay_period_end', { ascending: false })

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Payroll & Salary</h1>

            <div className="rounded-md border bg-white dark:bg-gray-800">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Gross Pay</TableHead>
                            <TableHead>Net Pay</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payrolls?.map((pay) => (
                            <TableRow key={pay.id}>
                                <TableCell>
                                    <div className="font-medium">{pay.profiles?.full_name}</div>
                                    <div className="text-xs text-gray-500">{pay.profiles?.department}</div>
                                </TableCell>
                                <TableCell>{pay.pay_period_start} - {pay.pay_period_end}</TableCell>
                                <TableCell>{pay.total_hours}</TableCell>
                                <TableCell>${pay.gross_pay}</TableCell>
                                <TableCell className="font-bold">${pay.net_pay}</TableCell>
                                <TableCell>
                                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                        Paid
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                        {payrolls?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No payroll records found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
