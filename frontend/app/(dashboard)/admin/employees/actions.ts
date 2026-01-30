'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createEmployeeSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    role: z.enum(['admin', 'manager', 'employee']),
    department: z.string().min(2, "Department is required"),
    position: z.string().min(2, "Position is required"),
    // Optional: password? Or auto-generate.
    // For now, let's auto-generate a temp password and return it, or set a default.
    // User prompt: "password: temp/random"
})

export async function createEmployeeAction(prevState: any, formData: FormData) {
    const validatedFields = createEmployeeSchema.safeParse({
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        role: formData.get('role'),
        department: formData.get('department'),
        position: formData.get('position'),
    })

    if (!validatedFields.success) {
        return { error: 'Invalid fields', errors: validatedFields.error.flatten().fieldErrors }
    }

    const { fullName, email, role, department, position } = validatedFields.data

    const supabase = await createClient()

    // 1. Verify Admin Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (currentUserProfile?.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' }
    }

    // 2. Create User via Admin API
    // We use the service_role key to bypass RLS and use admin auth methods
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm so they can login immediately
        user_metadata: {
            full_name: fullName,
            username: email.split('@')[0], // Default username
            role: role, // Trigger should use this
            department: department // Trigger might not use this, so we might need to update profile
        }
    })

    if (createError) {
        return { error: createError.message }
    }

    if (!newUser.user) {
        return { error: 'Failed to create user' }
    }

    // 3. Ensure Profile is updated (in case trigger missed department or role)
    // The trigger handles ID, email, username, role, full_name.
    // But does it handle 'department'?
    // My trigger function was:
    // INSERT INTO profiles ... VALUES (..., COALESCE(meta->>'role'), meta->>'full_name', ...)
    // It did NOT insert department.
    // So we must update the profile to set department.

    // We also need to insert into 'employees' table.

    const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ department: department })
        .eq('id', newUser.user.id)

    if (profileUpdateError) {
        // Log but don't fail, as user is created
        console.error('Error updating profile department:', profileUpdateError)
    }

    // 4. Insert into Employees table
    const { error: employeeError } = await supabaseAdmin
        .from('employees')
        .insert({
            profile_id: newUser.user.id,
            position: position,
            status: 'active',
            hire_date: new Date().toISOString().split('T')[0] // Today
        })

    if (employeeError) {
        return { error: 'User created but failed to create employee record: ' + employeeError.message, tempPassword }
    }

    revalidatePath('/admin/employees')

    return { success: true, tempPassword, message: `Employee created! Password: ${tempPassword}` }
}
