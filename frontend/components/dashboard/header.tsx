'use client'

import { ModeToggle } from '@/components/mode-toggle'

export function Header() {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10 p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Dashboard</h2>
            <div className="flex items-center space-x-4">
                <ModeToggle />
                <div className="h-8 w-8 rounded-full bg-gray-300"></div>
            </div>
        </header>
    )
}
