'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requestLeave(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const type = formData.get('type') as string
    const startDate = formData.get('start_date') as string
    const endDate = formData.get('end_date') as string
    const reason = formData.get('reason') as string

    const { error } = await (supabase as any)
        .from('leaves')
        .insert({
            employee_id: user.id,
            type,
            start_date: startDate,
            end_date: endDate,
            reason,
            status: 'pending'
        })

    if (error) return { error: error.message }
    revalidatePath('/leaves')
    return { success: true }
}

export async function cancelLeave(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string

    const { error } = await (supabase as any)
        .from('leaves')
        .update({ status: 'cancelled' })
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/leaves')
    return { success: true }
}
