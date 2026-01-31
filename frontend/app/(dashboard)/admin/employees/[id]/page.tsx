import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmployeeForm } from './employee-form'

export default async function EditEmployeePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()
    const { id } = params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: employee, error } = await (supabase as any)
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
        .eq('id', id)
        .single()

    if (error || !employee) {
        return <div>Employee not found</div>
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Edit Employee: {employee.profiles?.full_name}</h1>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <EmployeeForm employee={employee} />
            </div>
        </div>
    )
}
