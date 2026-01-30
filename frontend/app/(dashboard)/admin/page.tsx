import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
    const supabase = await createClient()
    const { count: totalEmployees } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: verifiedUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true)

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Statistics Cards */}
                <div className="p-6 bg-white dark:bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Total Users</div>
                    <div className="mt-2 text-3xl font-bold">{totalEmployees || 0}</div>
                </div>
                <div className="p-6 bg-white dark:bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Verified Users</div>
                    <div className="mt-2 text-3xl font-bold">{verifiedUsers || 0}</div>
                </div>
            </div>
        </div>
    )
}
