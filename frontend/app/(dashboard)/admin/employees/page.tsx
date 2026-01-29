import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default async function EmployeesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch employees with their profile details
    const { data: employees, error } = await supabase
        .from('employees')
        .select(`
      *,
      profiles (
        full_name,
        email,
        department,
        role
      )
    `)

    if (error) {
        return <div>Error loading employees: {error.message}</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
                <Button asChild>
                    <Link href="/admin/employees/new">Add Employee</Link>
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-gray-800">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees?.map((employee: any) => (
                            <TableRow key={employee.id}>
                                <TableCell className="font-medium">{employee.profiles?.full_name || 'N/A'}</TableCell>
                                <TableCell>{employee.profiles?.email}</TableCell>
                                <TableCell>{employee.position}</TableCell>
                                <TableCell>{employee.profiles?.department}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {employee.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/admin/employees/${employee.id}`}>Edit</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {employees?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No employees found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
