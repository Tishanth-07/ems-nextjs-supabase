import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeaveRequests } from '@/components/manager/leave-requests'

export default async function ManagerLeavesPage() {
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

    // Get team member IDs
    const { data: teamMembers } = await supabase
        .from('profiles')
        .select('id')
        .eq('manager_id', user.id)

    const teamIds = teamMembers?.map(m => m.id) || []

    // Get leave requests from team
    const { data: leaveRequests } = await supabase
        .from('leaves')
        .select(`
            id,
            employee_id,
            type,
            start_date,
            end_date,
            reason,
            status,
            created_at,
            approved_by,
            profiles!leaves_employee_id_fkey (
                id,
                full_name,
                email,
                photo_url
            )
        `)
        .in('employee_id', teamIds.length > 0 ? teamIds : [''])
        .order('created_at', { ascending: false })

    // Separate by status
    const pending = leaveRequests?.filter(l => l.status === 'pending') || []
    const approved = leaveRequests?.filter(l => l.status === 'approved') || []
    const rejected = leaveRequests?.filter(l => l.status === 'rejected') || []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
                <p className="text-muted-foreground mt-2">
                    Review and manage leave requests from your team
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Pending</div>
                    <div className="mt-2 text-3xl font-bold text-yellow-600">{pending.length}</div>
                </div>
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Approved</div>
                    <div className="mt-2 text-3xl font-bold text-green-600">{approved.length}</div>
                </div>
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Rejected</div>
                    <div className="mt-2 text-3xl font-bold text-red-600">{rejected.length}</div>
                </div>
            </div>

            {/* Leave Requests List */}
            <LeaveRequests
                initialRequests={leaveRequests || []}
                teamIds={teamIds}
                managerId={user.id}
            />
        </div>
    )
}
