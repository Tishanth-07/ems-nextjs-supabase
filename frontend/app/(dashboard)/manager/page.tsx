import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamList } from '@/components/manager/team-list'

export default async function ManagerDashboardPage() {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect('/login')
    }

    // Get user profile and check role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

    // Only managers can access this page
    if (profile?.role !== 'manager') {
        redirect('/dashboard')
    }

    // Fetch team members (employees where manager_id = current user)
    const { data: teamMembers, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, department, photo_url, created_at')
        .eq('manager_id', user.id)
        .order('full_name', { ascending: true })

    if (error) {
        console.error('Error fetching team:', error)
    }

    // Get counts for stats
    const teamCount = teamMembers?.length || 0

    // Get pending leave requests count
    const { count: pendingLeavesCount } = await supabase
        .from('leaves')
        .select('*', { count: 'exact', head: true })
        .in('employee_id', teamMembers?.map(m => m.id) || [])
        .eq('status', 'pending')

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Welcome back, {profile.full_name}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">My Team</div>
                    <div className="mt-2 text-3xl font-bold">{teamCount}</div>
                </div>
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Pending Leaves</div>
                    <div className="mt-2 text-3xl font-bold">{pendingLeavesCount || 0}</div>
                </div>
            </div>

            {/* Team List with Real-Time Updates */}
            <TeamList initialTeam={teamMembers || []} managerId={user.id} />
        </div>
    )
}
