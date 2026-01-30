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

    // Fetch all profiles (because new signups are profiles first)
    // Left join employees to get employment details if they exist
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            email,
            role,
            department,
            is_verified,
            created_at,
            employees (
                position,
                status,
                hire_date
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        return <div>Error loading employees: {error.message}</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Employees & Users</h1>
                <Button asChild>
                    <Link href="/admin/employees/new">Add Employee</Link>
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {profiles?.map((profile: any) => {
                            const employeeRecord = profile.employees?.[0] || profile.employees // handle array or object depending on relationship (one-to-one usually object if single, array if many. Supabase returns array by default unless .single())
                            // Actually, one-to-many returns array. One-to-one returns object if specified? No, usually array in Select.
                            // We'll assume array.
                            const empData = Array.isArray(profile.employees) ? profile.employees[0] : profile.employees
                            const status = empData?.status || (profile.is_verified ? 'verified' : 'unverified')

                            return (
                                <TableRow key={profile.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{profile.full_name || 'No Name'}</span>
                                            <span className="text-xs text-muted-foreground md:hidden">{profile.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{profile.email}</TableCell>
                                    <TableCell className="capitalize">{profile.role}</TableCell>
                                    <TableCell>{profile.department || '-'}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${status === 'active' || status === 'verified' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}>
                                            {status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/admin/employees/${profile.id}`}>Edit</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {profiles?.length === 0 && (
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
