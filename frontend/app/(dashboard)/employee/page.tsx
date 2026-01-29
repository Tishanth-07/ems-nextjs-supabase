export default function EmployeeDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Employee Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance Today</div>
                    <div className="mt-2 text-3xl font-bold text-green-600">Present</div>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Leave Balance</div>
                    <div className="mt-2 text-3xl font-bold">15 Days</div>
                </div>
            </div>
        </div>
    )
}
