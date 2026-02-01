import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamAttendance } from '@/components/manager/team-attendance'

export default async function ManagerAttendancePage() {
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
        .select('id, full_name, email')
        .eq('manager_id', user.id)
        .order('full_name', { ascending: true })

    const teamIds = teamMembers?.map(m => m.id) || []

    // Get today's attendance for team
    const today = new Date().toISOString().split('T')[0]

    const { data: todayAttendance } = await supabase
        .from('attendance_logs')
        .select(`
            id,
            employee_id,
            date,
            clock_in,
            clock_out,
            status,
            duration,
            profiles!attendance_logs_employee_id_fkey (
                id,
                full_name,
                email,
                photo_url
            )
        `)
        .in('employee_id', teamIds.length > 0 ? teamIds : [''])
        .eq('date', today)
        .order('clock_in', { ascending: true })

    // Get attendance summary for this week
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const { data: weekAttendance } = await supabase
        .from('attendance_logs')
        .select('employee_id, status')
        .in('employee_id', teamIds.length > 0 ? teamIds : [''])
        .gte('date', weekStartStr)

    // Calculate stats
    const stats = {
        present: todayAttendance?.filter(a => a.status === 'present').length || 0,
        absent: todayAttendance?.filter(a => a.status === 'absent').length || 0,
        late: todayAttendance?.filter(a => a.status === 'half_day').length || 0,
        onLeave: todayAttendance?.filter(a => a.status === 'on_leave').length || 0,
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Team Attendance</h1>
                <p className="text-muted-foreground mt-2">
                    Monitor your team's attendance and punctuality
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Present Today</div>
                    <div className="mt-2 text-3xl font-bold text-green-600">{stats.present}</div>
                </div>
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Absent Today</div>
                    <div className="mt-2 text-3xl font-bold text-red-600">{stats.absent}</div>
                </div>
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Half Day</div>
                    <div className="mt-2 text-3xl font-bold text-yellow-600">{stats.late}</div>
                </div>
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">On Leave</div>
                    <div className="mt-2 text-3xl font-bold text-blue-600">{stats.onLeave}</div>
                </div>
            </div>

            {/* Real-time Attendance List */}
            <TeamAttendance
                initialAttendance={todayAttendance || []}
                teamIds={teamIds}
                teamMembers={teamMembers || []}
            />
        </div>
    )
}
