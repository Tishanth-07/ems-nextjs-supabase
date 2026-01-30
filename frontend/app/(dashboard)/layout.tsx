import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { Header } from '@/components/dashboard/header'
import { GlobalNotifications } from '@/components/dashboard/notifications'

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
            .select('full_name, photo_url')
            .eq('id', user.id)
            .maybeSingle()
        profile = data
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-background">
            <GlobalNotifications />
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden lg:ml-0">
                <Header user={user} profile={profile} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
