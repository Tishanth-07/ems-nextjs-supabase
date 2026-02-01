import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/signin')
    }

    // Fetch user profile to get role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return <div>Profile not found. Please contact support.</div>
    }

    const role = profile.role

    console.log('[/dashboard] Redirecting user with role:', role)

    // Redirect based on role - NO hardcoded /employee!
    if (role === 'admin') {
        redirect('/admin')
    } else if (role === 'manager') {
        redirect('/manager')
    } else if (role === 'employee') {
        redirect('/employee')
    } else {
        return <div>Unknown role: {role}. Please contact support.</div>
    }
}
