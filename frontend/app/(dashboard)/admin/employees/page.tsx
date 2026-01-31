import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AddEmployeeDialog } from '@/components/admin/add-employee-dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { SearchInput } from '@/components/admin/search-input'
// ... (imports)

interface EmployeesPageProps {
    searchParams?: Promise<{
        query?: string
        page?: string
    }>
}

export default async function EmployeesPage(props: EmployeesPageProps) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    let queryBuilder = supabase
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

    if (query) {
        // ILIKE filter on full_name or email
        // Note: Supabase OR syntax is tricky
        queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    }

    const { data: profiles, error } = await queryBuilder

    if (error) {
        return <div>Error loading employees: {error.message}</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Employees & Users</h1>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <SearchInput placeholder="Search employees..." />
                    <AddEmployeeDialog />
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Verification</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {profiles?.map((profile: any) => {
                            const employeeRecord = profile.employees?.[0] || profile.employees
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
                                        {profile.is_verified ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                ✓ Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                ⏳ Pending
                                            </span>
                                        )}
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
