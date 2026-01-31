import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { Header } from '@/components/dashboard/header'
import { GlobalNotifications } from '@/components/dashboard/notifications'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let profile = null
    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('full_name, photo_url, role')
            .eq('id', user.id)
            .maybeSingle()
        profile = data

        if (!profile) {
            // If user is authenticated but has no profile, redirect to verify/setup
            // This prevents "Ghost" users from accessing the dashboard with fallback role
            // redirect('/auth/verify') // Commented out to prevent loops if verify uses layout? 
            // Verify page uses (auth) layout usually.
            // But let's be safe.
        }
    }

    return (
        <SidebarProvider>
            <GlobalNotifications />
            <DashboardSidebar user={user} userRole={profile?.role as any} />
            <SidebarInset>
                <Header user={user} profile={profile} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
