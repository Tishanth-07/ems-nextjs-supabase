export default function ManagerDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Manager Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">My Team</div>
                    <div className="mt-2 text-3xl font-bold">12</div>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Leaves</div>
                    <div className="mt-2 text-3xl font-bold">3</div>
                </div>
            </div>
        </div>
    )
}
