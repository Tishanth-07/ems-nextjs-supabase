'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function clockIn() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Check if already clocked in for today?
    // Or just insert a new log with clock_in time
    // Schema: employee_id, date, clock_in, clock_out

    const today = new Date().toISOString().split('T')[0]

    // Check existing log
    const { data: existing } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', today)
        .single()

    if (existing) {
        return { error: 'Already initialized attendance for today' }
    }

    const { error } = await supabase
        .from('attendance_logs')
        .insert({
            employee_id: user.id,
            date: today,
            clock_in: new Date().toISOString(),
            status: 'present'
        })

    if (error) return { error: error.message }
    revalidatePath('/attendance')
    return { success: true }
}

export async function clockOut() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const today = new Date().toISOString().split('T')[0]

    // Update existing log
    const { data: existing } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', today)
        .single()

    if (!existing) return { error: 'No attendance record found for today' }
    if (existing.clock_out) return { error: 'Already clocked out' }

    const clockInTime = new Date(existing.clock_in!).getTime()
    const clockOutTime = new Date().getTime()
    const duration = (clockOutTime - clockInTime) / (1000 * 60 * 60) // Hours

    const { error } = await supabase
        .from('attendance_logs')
        .update({
            clock_out: new Date().toISOString(),
            duration: parseFloat(duration.toFixed(2)),
            status: duration < 4 ? 'half_day' : 'present' // Simple logic
        })
        .eq('id', existing.id)

    if (error) return { error: error.message }
    revalidatePath('/attendance')
    return { success: true }
}
