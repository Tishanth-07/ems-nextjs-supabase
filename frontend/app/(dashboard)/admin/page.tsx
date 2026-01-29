export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Statistics Cards */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Employees</div>
                    <div className="mt-2 text-3xl font-bold">128</div>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Now</div>
                    <div className="mt-2 text-3xl font-bold">14</div>
                </div>
            </div>
        </div>
    )
}
