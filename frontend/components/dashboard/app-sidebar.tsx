"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    LayoutDashboard,
    Users,
    Clock,
    CalendarDays,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    CreditCard,
    BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"

type Role = "admin" | "manager" | "employee"

interface SidebarItem {
    href: string
    label: string
    icon: React.ElementType
    roles: Role[]
}

const menuItems: SidebarItem[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
    { href: "/manager", label: "Dashboard", icon: LayoutDashboard, roles: ["manager"] },
    { href: "/employee", label: "Dashboard", icon: LayoutDashboard, roles: ["employee"] },

    { href: "/admin/employees", label: "Employees", icon: Users, roles: ["admin"] },
    { href: "/admin/payroll", label: "Payroll", icon: CreditCard, roles: ["admin"] },
    { href: "/admin/reports", label: "Analytics", icon: BarChart3, roles: ["admin"] },

    { href: "/attendance", label: "Attendance", icon: Clock, roles: ["employee", "manager", "admin"] },
    { href: "/leaves", label: "Leaves", icon: CalendarDays, roles: ["employee", "manager", "admin"] },
    { href: "/manager/approvals", label: "Approvals", icon: FileText, roles: ["manager"] },

    { href: "/profile", label: "Profile", icon: Settings, roles: ["employee", "manager", "admin"] },
]

export function AppSidebar() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const [role, setRole] = useState<Role | null>(null)

    useEffect(() => {
        // Fetch role effectively. For now, derived from path or auth. 
        // Ideally passed from layout or context. 
        // Simplified: Check local storage or refetch profile client side
        async function getRole() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                setRole(data?.role as Role)
            }
        }
        getRole()
    }, [])

    const filteredItems = menuItems.filter(item => role && item.roles.includes(role))

    return (
        <>
            {/* Mobile Trigger */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X /> : <Menu />}
                </Button>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 bg-card border-r h-screen sticky top-0">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-primary">EMS</h1>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {filteredItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                pathname === item.href
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t flex items-center justify-between">
                    <Button
                        variant="ghost"
                        className="justify-start text-muted-foreground hover:text-destructive"
                        onClick={async () => {
                            const supabase = createClient()
                            await supabase.auth.signOut()
                            router.push('/login')
                        }}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                    <ModeToggle />
                </div>
            </aside>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r z-50 lg:hidden flex flex-col"
                        >
                            <div className="p-6 border-b flex justify-between items-center">
                                <h1 className="text-2xl font-bold text-primary">EMS</h1>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            <nav className="flex-1 p-4 space-y-1">
                                {filteredItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                            pathname === item.href
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                            <div className="p-4 border-t">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-muted-foreground hover:text-destructive"
                                    onClick={async () => {
                                        const supabase = createClient()
                                        await supabase.auth.signOut()
                                        router.push('/login')
                                    }}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </Button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
