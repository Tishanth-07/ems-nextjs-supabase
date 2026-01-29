import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user profile to get role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile) {
        // Handle case where profile doesn't exist yet (should trigger from sign up)
        // For now, redirect to a setup or waiting page, or stay on a generic dashboard
        return <div>Profile not found. Please contact support.</div>
    }

    // Redirect based on role
    switch (profile.role) {
        case 'admin':
            redirect('/admin')
        case 'manager':
            redirect('/manager')
        case 'employee':
            redirect('/employee')
        default:
            return <div>Unknown role</div>
    }
}
