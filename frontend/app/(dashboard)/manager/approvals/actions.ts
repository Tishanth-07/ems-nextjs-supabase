'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function processLeave(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login') // Should also check if Manager

    const id = formData.get('id') as string
    const action = formData.get('action') as string // 'approve' | 'reject'

    const status = action === 'approve' ? 'approved' : 'rejected'

    const { error } = await supabase
        .from('leaves')
        .update({
            status,
            approved_by: user.id
        })
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/manager/approvals')
    return { success: true }
}
