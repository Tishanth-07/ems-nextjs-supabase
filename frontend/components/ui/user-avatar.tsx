"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { UserCircle } from "lucide-react"

interface UserAvatarProps extends React.ComponentProps<typeof Avatar> {
    photoUrl?: string | null
    name?: string | null
    email?: string | null
    className?: string
}

export function UserAvatar({
    photoUrl,
    name,
    email,
    className,
    ...props
}: UserAvatarProps) {
    // Derive initials
    const initials = React.useMemo(() => {
        if (name) {
            return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
        }
        if (email) {
            return email.substring(0, 2).toUpperCase()
        }
        return null
    }, [name, email])

    return (
        <Avatar
            className={cn(
                "cursor-pointer transition-transform hover:scale-105 shadow-sm",
                className
            )}
            {...props}
        >
            <AvatarImage
                src={photoUrl || undefined}
                alt={name || "User avatar"}
                className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary">
                {initials || <UserCircle className="h-4 w-4" />}
            </AvatarFallback>
        </Avatar>
    )
}
