import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Users,
    UserCheck,
    Calendar,
    Clock,
    TrendingUp,
    ArrowRight
} from 'lucide-react'

export default async function AdminDashboard() {
    const supabase = await createClient()

    // Server-Side Guard
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/signin')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        console.log('[/admin] Non-admin detected, role:', profile?.role)
        // Redirect to correct dashboard based on actual role
        const redirectPath = profile?.role === 'manager' ? '/manager' : '/employee'
        redirect(redirectPath)
    }

    // Fetch comprehensive admin data
    const { count: totalEmployees } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    const { count: verifiedUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true)

    const { count: activeManagers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'manager')

    const { count: activeEmployees } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'employee')

    // Today's attendance
    const today = new Date().toISOString().split('T')[0]
    const { data: todayAttendance } = await supabase
        .from('attendance_logs')
        .select('status')
        .eq('date', today)

    const presentToday = todayAttendance?.filter(a => a.status === 'present').length || 0
    const totalExpectedToday = (activeEmployees || 0) + (activeManagers || 0)
    const attendanceRate = totalExpectedToday > 0
        ? Math.round((presentToday / totalExpectedToday) * 100)
        : 0

    // Pending leave approvals
    const { count: pendingLeaves } = await supabase
        .from('leaves')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

    // Recent employees (last 5)
    const { data: recentEmployees } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

    // Pending leave requests with employee details
    const { data: pendingLeaveRequests } = await supabase
        .from('leaves')
        .select(`
            id,
            type,
            start_date,
            end_date,
            created_at,
            profiles!leaves_employee_id_fkey (
                full_name,
                email
            )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Overview of your organization
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEmployees || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {verifiedUsers || 0} verified
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attendance Today</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{presentToday}/{totalExpectedToday}</div>
                        <p className="text-xs text-muted-foreground">
                            {attendanceRate}% attendance rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{pendingLeaves || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting approval
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Managers</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeManagers || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Managing teams
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions & Info Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Employees */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Employees</CardTitle>
                            <CardDescription>Latest additions to your team</CardDescription>
                        </div>
                        <Link href="/admin/employees">
                            <Button variant="ghost" size="sm">
                                View All <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentEmployees && recentEmployees.length > 0 ? (
                            <div className="space-y-4">
                                {recentEmployees.map((employee) => (
                                    <div key={employee.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{employee.full_name || 'N/A'}</p>
                                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                                        </div>
                                        <Badge variant="outline">
                                            {employee.role}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No employees yet
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Pending Leave Requests */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Pending Leave Requests</CardTitle>
                            <CardDescription>Requests awaiting approval</CardDescription>
                        </div>
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {pendingLeaveRequests && pendingLeaveRequests.length > 0 ? (
                            <div className="space-y-4">
                                {pendingLeaveRequests.map((leave) => (
                                    <div key={leave.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm">
                                                {(leave.profiles as any)?.full_name || 'Unknown'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {leave.type} • {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                            Pending
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No pending requests
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Link href="/admin/employees">
                            <Button variant="outline" className="w-full justify-start">
                                <Users className="mr-2 h-4 w-4" />
                                Manage Employees
                            </Button>
                        </Link>
                        <Link href="/admin/payroll">
                            <Button variant="outline" className="w-full justify-start">
                                <Clock className="mr-2 h-4 w-4" />
                                Process Payroll
                            </Button>
                        </Link>
                        <Link href="/admin/reports">
                            <Button variant="outline" className="w-full justify-start">
                                <TrendingUp className="mr-2 h-4 w-4" />
                                View Reports
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
