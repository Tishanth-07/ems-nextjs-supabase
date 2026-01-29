import { createClient } from '@/lib/supabase/server'
import { NotificationListener } from './notification-listener'

export async function GlobalNotifications() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // We need the role. Fetch profile.
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile) return null

    return <NotificationListener userId={user.id} role={profile.role} />
}
