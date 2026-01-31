'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, CheckCircle2 } from 'lucide-react'

// Define schema
const employeeSchema = z.object({
    email: z.string().email(),
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    position: z.string().min(2, "Position is required"),
    department: z.string().min(2, "Department is required"),
    role: z.enum(['employee', 'manager', 'admin']),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function AddEmployeePage() {
    const router = useRouter()
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [emailVerified, setEmailVerified] = useState(false)
    const [otpSent, setOtpSent] = useState(false)
    const [otp, setOtp] = useState('')

    const form = useForm<z.infer<typeof employeeSchema>>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            email: '',
            full_name: '',
            position: '',
            department: '',
            role: 'employee',
            password: '',
        },
    })

    const email = form.watch('email')

    const handleSendOtp = async () => {
        if (!email || form.getFieldState('email').invalid) {
            toast.error("Please enter a valid email first")
            return
        }

        try {
            setIsVerifying(true)
            const response = await fetch('/api/email/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send OTP')
            }

            setOtpSent(true)
            toast.success("Verification code sent to email")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsVerifying(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            toast.error("Please enter a valid 6-digit code")
            return
        }

        try {
            setIsVerifying(true)
            const response = await fetch('/api/email/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to verify OTP')
            }

            setEmailVerified(true)
            setOtpSent(false)
            toast.success("Email verified successfully")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsVerifying(false)
        }
    }

    const onSubmit = async (values: z.infer<typeof employeeSchema>) => {
        if (!emailVerified) {
            toast.error("Please verify email first")
            return
        }

        try {
            setIsLoading(true)

            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    data: {
                        full_name: values.full_name,
                        role: values.role,
                        department: values.department,
                    }
                }
            })

            if (authError) throw authError

            if (authData.user) {
                // Determine status based on role or default to active since verified manually
                const { error: empError } = await (supabase as any)
                    .from('employees')
                    .insert({
                        id: authData.user.id,
                        position: values.position,
                        status: 'active',
                        manager_id: null // Ideally select manager
                    })

                if (empError) throw empError
            }

            toast.success("Employee created successfully")
            router.push('/admin/employees')
            router.refresh()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Failed to create employee")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Add New Employee</h1>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Email & Verification */}
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input
                                                placeholder="employee@company.com"
                                                {...field}
                                                disabled={emailVerified || otpSent}
                                            />
                                        </FormControl>
                                        {!emailVerified ? (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={handleSendOtp}
                                                disabled={isVerifying || !field.value || otpSent}
                                            >
                                                {isVerifying && !otpSent ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                            </Button>
                                        ) : (
                                            <Button type="button" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50" disabled>
                                                <CheckCircle2 className="h-5 w-5 mr-1" /> Verified
                                            </Button>
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {otpSent && !emailVerified && (
                            <div className="flex gap-2 items-end animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2 flex-1">
                                    <FormLabel>Verification Code</FormLabel>
                                    <Input
                                        placeholder="Enter 6-digit code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={6}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    disabled={isVerifying}
                                >
                                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Code"}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="full_name"
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Temporary Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="******" {...field} />
                                </FormControl>
                                <FormDescription>Employee can change this later.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading || !emailVerified}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Employee"}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
