'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/supabase'

export async function deleteEmployeeAction(userId: string) {
    try {
        const supabase = await createClient()

        // Check if caller is admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (adminProfile?.role !== 'admin') {
            return { error: 'Only admins can delete employees' }
        }

        // Create admin client for auth deletion
        const supabaseAdmin = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        console.log('[deleteEmployeeAction] Deleting employee:', userId)

        // Delete from auth.users (this will cascade to profiles and employees via ON DELETE CASCADE)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (authError) {
            console.error('[deleteEmployeeAction] Auth deletion failed:', authError)
            return { error: `Failed to delete user: ${authError.message}` }
        }

        console.log('[deleteEmployeeAction] Employee deleted successfully')

        revalidatePath('/admin/employees')

        return { success: true, message: 'Employee deleted successfully' }
    } catch (error: any) {
        console.error('[deleteEmployeeAction] Error:', error)
        return { error: error.message || 'Failed to delete employee' }
    }
}
