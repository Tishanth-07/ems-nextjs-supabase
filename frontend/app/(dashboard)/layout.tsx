import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { Header } from '@/components/dashboard/header'
import { GlobalNotifications } from '@/components/dashboard/notifications'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
            <GlobalNotifications />
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden lg:ml-0">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
