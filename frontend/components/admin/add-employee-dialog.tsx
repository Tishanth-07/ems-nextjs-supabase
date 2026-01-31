"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Loader2, Copy, Check, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { createEmployeeAction } from "@/app/(dashboard)/admin/employees/actions"

const formSchema = z.object({
    fullName: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    role: z.enum(['admin', 'manager', 'employee']),
    department: z.string().min(2, "Department is required"),
    position: z.string().min(2, "Position is required"),
    password: z.string()
        .min(8, "Min 8 chars")
        .regex(/[A-Z]/, "Needs uppercase")
        .regex(/[a-z]/, "Needs lowercase")
        .regex(/[0-9]/, "Needs number")
        .regex(/[!@#$%^&*]/, "Needs special char"),
})

export function AddEmployeeDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [tempPassword, setTempPassword] = useState<string | null>(null)
    const [hasCopied, setHasCopied] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            role: "employee",
            department: "",
            position: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setTempPassword(null)

        const formData = new FormData()
        Object.entries(values).forEach(([key, value]) => {
            formData.append(key, value)
        })

        const result = await createEmployeeAction(null, formData)

        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else if (result?.success) {
            toast.success("Employee created successfully")
            setTempPassword(result.tempPassword)
            form.reset()
            // Don't close dialog yet, let them copy password
        }
    }

    const copyToClipboard = () => {
        if (tempPassword) {
            navigator.clipboard.writeText(tempPassword)
            setHasCopied(true)
            toast.success("Password copied to clipboard")
            setTimeout(() => setHasCopied(false), 2000)
        }
    }

    const handleClose = () => {
        setOpen(false)
        setTempPassword(null)
        form.reset()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Employee
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                        Create a new employee account. They will be able to log in with the temporary password.
                    </DialogDescription>
                </DialogHeader>

                {tempPassword ? (
                    <div className="space-y-4 py-4">
                        <div className="rounded-md bg-muted p-4">
                            <div className="text-sm font-medium text-muted-foreground mb-1">
                                Temporary Password
                            </div>
                            <div className="flex items-center justify-between">
                                <code className="text-lg font-mono font-bold">{tempPassword}</code>
                                <Button size="icon" variant="ghost" onClick={copyToClipboard}>
                                    {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                            Please copy this password safely. It will not be shown again.
                        </p>
                        <DialogFooter>
                            <Button onClick={handleClose} className="w-full">Done</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="email@company.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="employee">Employee</SelectItem>
                                                    <SelectItem value="manager">Manager</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="department"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Department</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Engineering" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="position"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Position</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Software Engineer" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => {
                                    const val = field.value || ""
                                    const hasMin = val.length >= 8
                                    const hasUpper = /[A-Z]/.test(val)
                                    const hasLower = /[a-z]/.test(val)
                                    const hasNum = /[0-9]/.test(val)
                                    const hasSpecial = /[!@#$%^&*]/.test(val)

                                    return (
                                        <FormItem>
                                            <FormLabel>Temporary Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Enter initial password"
                                                        {...field}
                                                        className="pr-10"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                        onClick={() => setShowPassword((prev) => !prev)}
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                        <span className="sr-only">Toggle password visibility</span>
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <div className="space-y-1 text-xs text-muted-foreground mt-2 border p-2 rounded bg-muted/50">
                                                <p className="font-medium mb-1">Password Requirements:</p>
                                                <div className="grid grid-cols-2 gap-1">
                                                    <div className={`flex items-center gap-1 ${hasMin ? "text-green-600 dark:text-green-400" : ""}`}>
                                                        {hasMin ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />} 8+ Characters
                                                    </div>
                                                    <div className={`flex items-center gap-1 ${hasUpper ? "text-green-600 dark:text-green-400" : ""}`}>
                                                        {hasUpper ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />} Uppercase
                                                    </div>
                                                    <div className={`flex items-center gap-1 ${hasLower ? "text-green-600 dark:text-green-400" : ""}`}>
                                                        {hasLower ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />} Lowercase
                                                    </div>
                                                    <div className={`flex items-center gap-1 ${hasNum ? "text-green-600 dark:text-green-400" : ""}`}>
                                                        {hasNum ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />} Number
                                                    </div>
                                                    <div className={`flex items-center gap-1 ${hasSpecial ? "text-green-600 dark:text-green-400" : ""}`}>
                                                        {hasSpecial ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />} Special Char
                                                    </div>
                                                </div>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )
                                }}
                            />

                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                                        </>
                                    ) : (
                                        "Create Employee"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    )
}
