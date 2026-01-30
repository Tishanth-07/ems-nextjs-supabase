import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-background">
            {/* Sidebar Skeleton */}
            <div className="hidden lg:flex flex-col w-64 border-r h-screen bg-card p-4 space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <div className="space-y-2 mt-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex flex-col flex-1 overflow-hidden lg:ml-0">
                {/* Header Skeleton */}
                <div className="h-16 border-b flex items-center px-6 justify-between bg-card">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>

                {/* Page Content Skeleton */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
                    <Skeleton className="h-12 w-48" />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Skeleton className="h-32 rounded-xl" />
                        <Skeleton className="h-32 rounded-xl" />
                        <Skeleton className="h-32 rounded-xl" />
                        <Skeleton className="h-32 rounded-xl" />
                    </div>
                    <Skeleton className="h-96 rounded-xl" />
                </div>
            </div>
        </div>
    )
}
