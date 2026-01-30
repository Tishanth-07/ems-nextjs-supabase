"use client"

import Link from "next/link"
import { ModeToggle } from '@/components/mode-toggle'
import { UserAvatar } from '@/components/ui/user-avatar'

interface HeaderProps {
    user?: {
        email?: string
    } | null
    profile?: {
        full_name?: string | null
        photo_url?: string | null
    } | null
}

export function Header({ user, profile }: HeaderProps) {
    return (
        <header className="bg-white dark:bg-card border-b z-10 p-4 flex justify-between items-center h-16 sticky top-0">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Dashboard</h2>
            <div className="flex items-center space-x-4">
                <ModeToggle />
                <Link href="/profile" title="View Profile">
                    <UserAvatar
                        name={profile?.full_name}
                        photoUrl={profile?.photo_url}
                        email={user?.email}
                    />
                </Link>
            </div>
        </header>
    )
}
