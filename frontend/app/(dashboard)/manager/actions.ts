'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Assign an employee to manager's team
 */
export async function assignToTeamAction(employeeId: string) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return { error: 'Not authenticated' }
        }

        // Check if current user is a manager
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'manager') {
            return { error: 'Only managers can assign team members' }
        }

        // Assign employee to this manager
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ manager_id: user.id })
            .eq('id', employeeId)

        if (updateError) {
            console.error('[assignToTeamAction] Update error:', updateError)
            return { error: 'Failed to assign team member' }
        }

        revalidatePath('/manager')

        return { success: true, message: 'Team member added successfully' }
    } catch (error: any) {
        console.error('[assignToTeamAction] Error:', error)
        return { error: error.message || 'Failed to assign team member' }
    }
}

/**
 * Remove an employee from manager's team
 */
export async function removeFromTeamAction(employeeId: string) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return { error: 'Not authenticated' }
        }

        // Check if current user is a manager
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'manager') {
            return { error: 'Only managers can remove team members' }
        }

        // Remove employee from this manager's team
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ manager_id: null })
            .eq('id', employeeId)
            .eq('manager_id', user.id) // Security: only remove if they're actually in this manager's team

        if (updateError) {
            console.error('[removeFromTeamAction] Update error:', updateError)
            return { error: 'Failed to remove team member' }
        }

        revalidatePath('/manager')

        return { success: true, message: 'Team member removed successfully' }
    } catch (error: any) {
        console.error('[removeFromTeamAction] Error:', error)
        return { error: error.message || 'Failed to remove team member' }
    }
}
