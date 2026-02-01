import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmployeeDashboard } from '@/components/employee/employee-dashboard'

export default async function EmployeeDashboardPage() {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect('/auth/signin')
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0]
    const { data: todayAttendance } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', today)
        .maybeSingle()

    // Get all attendance for this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0]

    const { data: monthAttendance } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', user.id)
        .gte('date', startOfMonthStr)
        .order('date', { ascending: false })

    // Get leave requests
    const { data: leaveRequests } = await supabase
        .from('leaves')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })

    // Get pending leaves count
    const { count: pendingLeaves } = await supabase
        .from('leaves')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', user.id)
        .eq('status', 'pending')

    // Calculate leave balance
    const approvedLeaves = leaveRequests?.filter(l => l.status === 'approved') || []
    const calculateDays = (startDate: string, endDate: string) => {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    }

    const usedLeaveDays = approvedLeaves.reduce((sum, leave) =>
        sum + calculateDays(leave.start_date, leave.end_date), 0
    )

    const totalLeaveDays = 20 // Could be fetched from settings table
    const remainingLeaveDays = totalLeaveDays - usedLeaveDays

    // Calculate attendance stats
    const presentDays = monthAttendance?.filter(a => a.status === 'present').length || 0
    const absentDays = monthAttendance?.filter(a => a.status === 'absent').length || 0
    const halfDays = monthAttendance?.filter(a => a.status === 'half_day').length || 0

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, {profile?.full_name || 'Employee'}!
                </h1>
                <p className="text-muted-foreground mt-2">
                    Here's your dashboard overview
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Today's Status */}
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Today's Status</div>
                    <div className={`mt-2 text-2xl font-bold ${todayAttendance?.status === 'present' ? 'text-green-600' :
                            todayAttendance?.status === 'absent' ? 'text-red-600' :
                                todayAttendance?.status === 'half_day' ? 'text-yellow-600' :
                                    todayAttendance?.status === 'on_leave' ? 'text-blue-600' :
                                        'text-gray-500'
                        }`}>
                        {todayAttendance?.status === 'present' ? 'Present ✓' :
                            todayAttendance?.status === 'absent' ? 'Absent' :
                                todayAttendance?.status === 'half_day' ? 'Half Day' :
                                    todayAttendance?.status === 'on_leave' ? 'On Leave' :
                                        'Not Clocked In'}
                    </div>
                    {todayAttendance?.clock_in && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Clocked in at {new Date(todayAttendance.clock_in).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    )}
                </div>

                {/* Leave Balance */}
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Leave Balance</div>
                    <div className="mt-2 text-3xl font-bold">{remainingLeaveDays} Days</div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {usedLeaveDays} used of {totalLeaveDays} total
                    </p>
                </div>

                {/* Pending Requests */}
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Pending Leave Requests</div>
                    <div className="mt-2 text-3xl font-bold text-yellow-600">{pendingLeaves || 0}</div>
                </div>

                {/* This Month Stats */}
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">This Month</div>
                    <div className="mt-2 space-y-1">
                        <div className="text-sm">
                            <span className="text-green-600 font-semibold">{presentDays}</span> Present
                        </div>
                        <div className="text-sm">
                            <span className="text-yellow-600 font-semibold">{halfDays}</span> Half Days
                        </div>
                        <div className="text-sm">
                            <span className="text-red-600 font-semibold">{absentDays}</span> Absent
                        </div>
                    </div>
                </div>
            </div>

            {/* Real-time Dashboard Component */}
            <EmployeeDashboard
                userId={user.id}
                initialAttendance={todayAttendance}
                initialLeaves={leaveRequests || []}
                monthAttendance={monthAttendance || []}
            />
        </div>
    )
}
