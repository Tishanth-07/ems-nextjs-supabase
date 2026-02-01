
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReportsFilter } from "@/components/reports/reports-filter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, CalendarDays, Clock, FileText, Users, AlertCircle, Banknote } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { AttendanceChart } from "@/components/reports/attendance-chart"
import { LeavesChart } from "@/components/reports/leaves-chart"
import { ReportsExport } from "@/components/reports/reports-export"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { differenceInBusinessDays, parseISO } from "date-fns"


export default async function ManagerReportsPage({
    searchParams,
}: {
    searchParams: { from?: string; to?: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/signin")
    }

    // Fetch Team Members
    const { data: teamMembers } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('manager_id', user.id)

    const teamIds = teamMembers?.map(m => m.id) || []
    const totalTeamSize = teamIds.length

    // Determine Date Range
    const from = await searchParams.from || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    const to = await searchParams.to || new Date().toISOString().split('T')[0]

    // 1. ATTENDANCE & OVERTIME DATA
    const { data: logs } = await supabase
        .from('attendance_logs')
        .select('employee_id, date, status, duration')
        .in('employee_id', teamIds)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true })

    const chartDataMap = new Map<string, { date: string, present: number, late: number, absent: number }>()

    // Init Map
    const startDate = new Date(from)
    const endDate = new Date(to)
    // Avoid infinite loop if dates invalid, simple sanity check
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let loopDate = new Date(startDate)
    for (let i = 0; i <= diffDays; i++) {
        const dateStr = loopDate.toISOString().split('T')[0]
        chartDataMap.set(dateStr, { date: dateStr, present: 0, late: 0, absent: totalTeamSize })
        loopDate.setDate(loopDate.getDate() + 1)
    }

    // Stats Accumulators
    let totalPresent = 0
    let totalLate = 0
    let totalOvertimeHours = 0
    const STANDARD_HOURS = 8 // Standard workday
    const overtimeByEmployee = new Map<string, number>()

    if (logs) {
        logs.forEach(log => {
            const dateStr = log.date
            if (chartDataMap.has(dateStr)) {
                const entry = chartDataMap.get(dateStr)!

                // Fix: Cast status to string for safe comparison
                const status = log.status as string

                if (status === 'present' || status === 'half_day') {
                    entry.present += 1
                    entry.absent = Math.max(0, entry.absent - 1)
                    totalPresent++
                } else if (status === 'late') {
                    entry.late += 1
                    entry.absent = Math.max(0, entry.absent - 1)
                    totalLate++
                    totalPresent++
                }

                // Overtime Calculation
                // Fix: Cast duration to number (minutes) based on lint feedback
                const durationMinutes = (log.duration as any) as number || 0
                const workedHours = durationMinutes / 60

                if (workedHours > STANDARD_HOURS) {
                    const ot = workedHours - STANDARD_HOURS
                    totalOvertimeHours += ot

                    const currentOt = overtimeByEmployee.get(log.employee_id) || 0
                    overtimeByEmployee.set(log.employee_id, currentOt + ot)
                }
            }
        })
    }
    const attendanceData = Array.from(chartDataMap.values())


    // 2. LEAVES DATA
    const { data: leaves } = await supabase
        .from('leaves')
        .select('employee_id, type, status, start_date, end_date')
        .in('employee_id', teamIds)
        .gte('start_date', from)

    const leaveStatsMap = new Map<string, number>()
    const employeeLeaveStats = new Map<string, { name: string, days: number, count: number }>()
    let pendingLeavesCount = 0

    // Init employee stats
    teamMembers?.forEach(m => {
        employeeLeaveStats.set(m.id, { name: m.full_name || m.email || 'Unknown', days: 0, count: 0 })
    })

    if (leaves) {
        leaves.forEach(leave => {
            if (leave.status === 'pending') {
                pendingLeavesCount++
            } else if (leave.status === 'approved') {
                const start = parseISO(leave.start_date)
                const end = parseISO(leave.end_date)
                const days = Math.max(1, differenceInBusinessDays(end, start) + 1)

                leaveStatsMap.set(leave.type, (leaveStatsMap.get(leave.type) || 0) + days)

                if (employeeLeaveStats.has(leave.employee_id)) {
                    const stat = employeeLeaveStats.get(leave.employee_id)!
                    stat.days += days
                    stat.count += 1
                }
            }
        })
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']
    const leavesChartData = Array.from(leaveStatsMap.entries()).map(([name, value], index) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: COLORS[index % COLORS.length]
    }))

    const leaveTableData = Array.from(employeeLeaveStats.values())

    const totalPotentialDays = totalTeamSize * attendanceData.length || 1
    const avgAttendance = ((totalPresent / totalPotentialDays) * 100).toFixed(1)

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Team Reports</h2>
                    <p className="text-muted-foreground">
                        Analyze your team's performance, attendance, and leave trends.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Suspense>
                        <ReportsFilter />
                    </Suspense>
                    <ReportsExport
                        data={attendanceData}
                        filename="team_attendance_report"
                    />
                </div>
            </div>

            <Separator />

            <Tabs defaultValue="attendance" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="attendance">
                        <Clock className="mr-2 h-4 w-4" />
                        Attendance
                    </TabsTrigger>
                    <TabsTrigger value="leaves">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Leaves
                    </TabsTrigger>
                    <TabsTrigger value="overtime">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Overtime
                    </TabsTrigger>
                    <TabsTrigger value="summary">
                        <FileText className="mr-2 h-4 w-4" />
                        Summary
                    </TabsTrigger>
                </TabsList>

                {/* ATTENDANCE TAB */}
                <TabsContent value="attendance" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{avgAttendance}%</div>
                                <p className="text-xs text-muted-foreground">for selected period</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalLate}</div>
                                <p className="text-xs text-muted-foreground">total occurrences</p>
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance Overview</CardTitle>
                            <CardDescription>
                                Daily trends from {from} to {to}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <AttendanceChart data={attendanceData} teamId={teamIds} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* LEAVES TAB */}
                <TabsContent value="leaves" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Leave Types Distribution</CardTitle>
                                <CardDescription>
                                    Breakdown of approved leave days.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <LeavesChart data={leavesChartData} />
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Team Balances</CardTitle>
                                <CardDescription>
                                    Days taken in this period.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead className="text-right">Days</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leaveTableData.map((emp) => (
                                            <TableRow key={emp.name}>
                                                <TableCell className="font-medium">{emp.name}</TableCell>
                                                <TableCell className="text-right">{emp.days}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* OVERTIME TAB */}
                <TabsContent value="overtime" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Overtime</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalOvertimeHours.toFixed(1)} hrs</div>
                                <p className="text-xs text-muted-foreground">above 8h/day standard</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Est. Cost</CardTitle>
                                <Banknote className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">--</div>
                                <p className="text-xs text-muted-foreground">Rate info not available</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Overtime by Employee</CardTitle>
                            <CardDescription>
                                Hours worked beyond standard shifts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead className="text-right">Overtime Hours</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Array.from(overtimeByEmployee.entries()).map(([empId, hours]) => {
                                        const emp = employeeLeaveStats.get(empId) // Reuse map for names
                                        return (
                                            <TableRow key={empId}>
                                                <TableCell className="font-medium">{emp?.name || empId}</TableCell>
                                                <TableCell className="text-right font-bold">{hours.toFixed(1)} hrs</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                    {overtimeByEmployee.size === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                                                No overtime recorded in this period.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SUMMARY TAB */}
                <TabsContent value="summary" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Headcount</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalTeamSize}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{avgAttendance}%</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{pendingLeavesCount}</div>
                                <p className="text-xs text-muted-foreground">requests awaiting action</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Overtime</CardTitle>
                                <Banknote className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalOvertimeHours.toFixed(0)}h</div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
