import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSettings } from './actions'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/signin')

    // Check admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        redirect('/dashboard')
    }

    // Get settings
    let settings = {}
    try {
        settings = await getSettings()
    } catch (error) {
        console.error('Failed to load settings:', error)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage company-wide settings and configurations
                </p>
            </div>

            <SettingsForm initialSettings={settings} />
        </div>
    )
}
