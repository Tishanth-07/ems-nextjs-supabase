"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    CreditCard,
    BarChart3,
    Clock,
    CalendarDays,
    FileText,
    Settings,
    LogOut,
    UserCircle,
    Command,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { signOutAction } from "@/app/auth/actions"
import { toast } from "sonner"
import { ModeToggle } from "@/components/mode-toggle"
import { User } from "@supabase/supabase-js"

type Role = "admin" | "manager" | "employee"

// Menu items configuration
const menuItems = {
    admin: [
        { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
        { title: "Employees", url: "/admin/employees", icon: Users },
        { title: "Payroll", url: "/admin/payroll", icon: CreditCard },
        { title: "Analytics", url: "/admin/reports", icon: BarChart3 },
        { title: "Settings", url: "/admin/settings", icon: Settings },
    ],
    manager: [
        { title: "Dashboard", url: "/manager", icon: LayoutDashboard },
        { title: "Attendance", url: "/manager/attendance", icon: Clock },
        { title: "Leave Requests", url: "/manager/leaves", icon: CalendarDays },
        { title: "Reports", url: "/manager/reports", icon: BarChart3 },
    ],
    employee: [
        { title: "Dashboard", url: "/employee", icon: LayoutDashboard },
        { title: "Attendance", url: "/attendance", icon: Clock },
        { title: "Leaves", url: "/leaves", icon: CalendarDays },
        { title: "My Profile", url: "/profile", icon: Settings },
    ],
}

interface DashboardSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user: User | null
    userRole: Role | null
}

export function DashboardSidebar({ user, userRole, ...props }: DashboardSidebarProps) {
    const pathname = usePathname()

    // Fallback to employee if role is null (or skeleton state handled by parent)
    const currentRole = userRole || "employee"
    const items = menuItems[currentRole] || menuItems.employee

    // Active state logic
    function isActive(url: string) {
        if (url === "/admin" || url === "/manager" || url === "/employee") {
            return pathname === url
        }
        return pathname.startsWith(url)
    }

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-1">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <Command className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">EMS</span>
                        <span className="truncate text-xs">Enterprise</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.url}>
                                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center justify-between p-2">
                            <ModeToggle />
                        </div>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={async () => {
                                toast.success("Logging out...")
                                await signOutAction()
                            }}
                            tooltip="Log out"
                        >
                            <LogOut />
                            <span>Log out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <div className="flex items-center justify-center py-2 text-xs text-muted-foreground uppercase tracking-wider">
                            Role: {currentRole}
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
