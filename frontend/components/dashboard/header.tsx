"use client"

import Link from "next/link"
import { ModeToggle } from '@/components/mode-toggle'
import { UserAvatar } from '@/components/ui/user-avatar'

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

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
        <header className="bg-white dark:bg-card border-b z-10 px-4 flex justify-between items-center h-16 sticky top-0 shrink-0 gap-2">
            <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Dashboard</h2>
            </div>
            <div className="flex items-center space-x-4">
                <ModeToggle />
                <Link href="/profile" title="View Profile" aria-label="View your profile">
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
