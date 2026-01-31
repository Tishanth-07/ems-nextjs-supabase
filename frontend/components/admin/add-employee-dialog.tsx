"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Loader2, Copy, Check, Eye, EyeOff, Mail, ArrowLeft, ArrowRight } from "lucide-react"
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
import { sendVerificationCodeAction, verifyEmailCodeAction } from "@/app/(dashboard)/admin/employees/verification-actions"

// Step 1: Email verification
const emailSchema = z.object({
    email: z.string().email("Invalid email address"),
})

// Step 3: Full employee form (after verification)
const employeeSchema = z.object({
    fullName: z.string().min(2, "Name is required"),
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

type Step = 1 | 2 | 3

export function AddEmployeeDialog() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<Step>(1)
    const [email, setEmail] = useState("")
    const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    // Step 1 states
    const [sendingCode, setSendingCode] = useState(false)

    // Step 2 states
    const [code, setCode] = useState("")
    const [verifying, setVerifying] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const [expiryTime, setExpiryTime] = useState(10 * 60) // 10 minutes

    // Step 3 states
    const [isLoading, setIsLoading] = useState(false)
    const [tempPassword, setTempPassword] = useState<string | null>(null)
    const [employeeCode, setEmployeeCode] = useState<string | null>(null)
    const [hasCopied, setHasCopied] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const employeeForm = useForm<z.infer<typeof employeeSchema>>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            fullName: "",
            role: "employee",
            department: "",
            position: "",
            password: "",
        },
    })

    // Step 1: Send verification code
    async function handleSendCode() {
        if (!email || !z.string().email().safeParse(email).success) {
            toast.error("Please enter a valid email address")
            return
        }

        setSendingCode(true)
        const result = await sendVerificationCodeAction('temp-user-id', email, 'Pending Employee')
        setSendingCode(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success(`Verification code sent to ${email}`)
            setStep(2)
            setExpiryTime(10 * 60) // Reset timer

            // For development
            if (process.env.NODE_ENV === 'development' && result.devCode) {
                console.log(`[DEV] Verification code: ${result.devCode}`)
                toast.info(`[DEV] Code: ${result.devCode}`, { duration: 5000 })
            }
        }
    }

    // Step 2: Verify code
    async function handleVerifyCode() {
        if (code.length !== 6) {
            toast.error("Please enter a 6-digit code")
            return
        }

        setVerifying(true)
        const result = await verifyEmailCodeAction('temp-user-id', code)
        setVerifying(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Email verified! Please complete employee details")
            setVerifiedEmail(email)
            setStep(3)
        }
    }

    // Step 2: Resend code
    async function handleResend() {
        const result = await sendVerificationCodeAction('temp-user-id', email, 'Pending Employee')

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("New verification code sent")
            setResendCooldown(60)
            setExpiryTime(10 * 60)
            setCode('')

            if (process.env.NODE_ENV === 'development' && result.devCode) {
                console.log(`[DEV] New code: ${result.devCode}`)
                toast.info(`[DEV] Code: ${result.devCode}`, { duration: 5000 })
            }
        }
    }

    // Step 3: Create employee
    async function onSubmit(values: z.infer<typeof employeeSchema>) {
        if (!verifiedEmail) {
            toast.error("Email not verified")
            return
        }

        setIsLoading(true)
        setTempPassword(null)
        setEmployeeCode(null)

        const formData = new FormData()
        formData.append('email', verifiedEmail)
        formData.append('fullName', values.fullName)
        formData.append('role', values.role)
        formData.append('department', values.department)
        formData.append('position', values.position)
        formData.append('password', values.password)
        formData.append('emailVerified', 'true') // Mark as pre-verified

        const result = await createEmployeeAction(null, formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else if (result?.success) {
            const message = result.employeeCode
                ? `Employee created with code: ${result.employeeCode}`
                : "Employee created successfully"
            toast.success(message + " - Employee can login now!")
            setTempPassword(result.tempPassword)
            setEmployeeCode(result.employeeCode || null)
            employeeForm.reset()
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
        setStep(1)
        setEmail("")
        setVerifiedEmail(null)
        setCode("")
        setTempPassword(null)
        setEmployeeCode(null)
        employeeForm.reset()
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Employee
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {step === 1 && "Add New Employee - Step 1: Verify Email"}
                        {step === 2 && "Add New Employee - Step 2: Enter Code"}
                        {step === 3 && "Add New Employee - Step 3: Employee Details"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1 && "Enter the employee's email to send a verification code"}
                        {step === 2 && `Verification code sent to ${email}`}
                        {step === 3 && "Complete the employee information"}
                    </DialogDescription>
                </DialogHeader>

                {tempPassword ? (
                    // Success state - show password
                    <div className="space-y-4 py-4">
                        {employeeCode && (
                            <div className="rounded-md bg-primary/10 p-4 border border-primary/20">
                                <div className="text-sm font-medium text-muted-foreground mb-1">
                                    Employee Code
                                </div>
                                <div className="text-2xl font-bold text-primary">
                                    {employeeCode}
                                </div>
                            </div>
                        )}

                        <div className="rounded-md bg-green-50 dark:bg-green-950 p-4 border border-green-200 dark:border-green-800">
                            <div className="text-sm font-medium text-muted-foreground mb-2">
                                Temporary Password
                            </div>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-lg font-mono bg-white dark:bg-gray-900 px-3 py-2 rounded border">
                                    {tempPassword}
                                </code>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={copyToClipboard}
                                >
                                    {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                ✅ Employee can login immediately with this password
                            </p>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleClose} className="w-full">
                                Done
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <>
                        {/* Step 1: Email Input */}
                        {step === 1 && (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">
                                        Employee Email <span className="text-destructive">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="employee@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSendCode()
                                            }}
                                        />
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        onClick={handleSendCode}
                                        disabled={sendingCode || !email}
                                        className="w-full"
                                    >
                                        {sendingCode ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sending Code...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="mr-2 h-4 w-4" />
                                                Send Verification Code
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}

                        {/* Step 2: Code Verification */}
                        {step === 2 && (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label htmlFor="code" className="text-sm font-medium">
                                        Verification Code
                                    </label>
                                    <Input
                                        id="code"
                                        placeholder="000000"
                                        value={code}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                                            setCode(value)
                                        }}
                                        maxLength={6}
                                        className="text-center text-2xl font-mono tracking-widest"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && code.length === 6) {
                                                handleVerifyCode()
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter the 6-digit code sent to {email}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className={expiryTime <= 60 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                                        Code active
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResend}
                                        disabled={resendCooldown > 0}
                                        className="h-auto p-0"
                                    >
                                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                                    </Button>
                                </div>

                                <DialogFooter className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setStep(1)
                                            setCode('')
                                        }}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleVerifyCode}
                                        disabled={verifying || code.length !== 6}
                                        className="flex-1"
                                    >
                                        {verifying ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                Verify Code
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}

                        {/* Step 3: Employee Form */}
                        {step === 3 && (
                            <Form {...employeeForm}>
                                <form onSubmit={employeeForm.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                    <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 border border-green-200 dark:border-green-800">
                                        <p className="text-sm flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <span className="font-medium">Email verified:</span> {verifiedEmail}
                                        </p>
                                    </div>

                                    <FormField
                                        control={employeeForm.control}
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
                                        control={employeeForm.control}
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
                                        control={employeeForm.control}
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

                                    <FormField
                                        control={employeeForm.control}
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
                                        control={employeeForm.control}
                                        name="password"
                                        render={({ field }) => {
                                            const password = field.value || ''
                                            const hasMin = password.length >= 8
                                            const hasUpper = /[A-Z]/.test(password)
                                            const hasLower = /[a-z]/.test(password)
                                            const hasNum = /[0-9]/.test(password)
                                            const hasSpecial = /[!@#$%^&*]/.test(password)

                                            return (
                                                <FormItem>
                                                    <FormLabel>Temporary Password</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                type={showPassword ? "text" : "password"}
                                                                placeholder="••••••••"
                                                                {...field}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="absolute right-0 top-0 h-full px-3"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                            >
                                                                {showPassword ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </FormControl>
                                                    {password && (
                                                        <div className="text-xs space-y-1 mt-2 p-2 bg-muted rounded">
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
                                                    )}
                                                    <FormMessage />
                                                </FormItem>
                                            )
                                        }}
                                    />

                                    <DialogFooter className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setStep(2)}
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Back
                                        </Button>
                                        <Button type="submit" disabled={isLoading} className="flex-1">
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
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
