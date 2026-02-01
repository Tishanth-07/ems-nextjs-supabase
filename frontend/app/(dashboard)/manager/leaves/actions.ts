'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Approve a leave request
 */
export async function approveLeaveAction(leaveId: number) {
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
            return { error: 'Only managers can approve leave requests' }
        }

        // Update leave status
        const { error: updateError } = await supabase
            .from('leaves')
            .update({
                status: 'approved',
                approved_by: user.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', leaveId)

        if (updateError) {
            console.error('[approveLeaveAction] Update error:', updateError)
            return { error: 'Failed to approve leave request' }
        }

        revalidatePath('/manager/leaves')

        return { success: true, message: 'Leave request approved' }
    } catch (error: any) {
        console.error('[approveLeaveAction] Error:', error)
        return { error: error.message || 'Failed to approve leave request' }
    }
}

/**
 * Reject a leave request
 */
export async function rejectLeaveAction(leaveId: number) {
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
            return { error: 'Only managers can reject leave requests' }
        }

        // Update leave status
        const { error: updateError } = await supabase
            .from('leaves')
            .update({
                status: 'rejected',
                approved_by: user.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', leaveId)

        if (updateError) {
            console.error('[rejectLeaveAction] Update error:', updateError)
            return { error: 'Failed to reject leave request' }
        }

        revalidatePath('/manager/leaves')

        return { success: true, message: 'Leave request rejected' }
    } catch (error: any) {
        console.error('[rejectLeaveAction] Error:', error)
        return { error: error.message || 'Failed to reject leave request' }
    }
}
