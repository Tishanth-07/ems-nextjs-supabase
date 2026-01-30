'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Loader2, Lock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { resetPasswordAction } from '../actions'
import { PasswordRequirements } from '@/components/auth/password-requirements'

const resetSchema = z.object({
    otp: z.string().length(6, "Code must be 6 digits"),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})
// ...
// This replacement block is getting tricky because ResetPasswordPage code is long.
// I will just supply the full file content from the Import block to the end of form fields or try to be precise.
// The file has imports at top.
// Then the form fields at bottom.
// I'll replace the top block (imports) and the bottom block (fields) in two valid chunks if possible, BUT replace_file_content is Single.
// I will use multi_replace for ResetPasswordPage to be safe.
// Wait, I am in replace_file_content mode.
// Actually, `resetPasswordAction` import is at line 36.
// The form fields start around line 150.
// I'll replace the IMPORTs first. Then I'll replace the fields. 
// BUT replace_file_content does not allow parallel calls.
// I will make ONE call to replace the IMPORTS, then another for FIELDS.
// Or I can just replace the whole file? No, that's expensive.
// I will replace imports.


export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email')

    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof resetSchema>>({
        resolver: zodResolver(resetSchema),
        defaultValues: {
            otp: '',
            password: '',
            confirmPassword: '',
        },
    })

    async function onSubmit(values: z.infer<typeof resetSchema>) {
        if (!email) {
            toast.error("Email missing")
            return
        }
        setIsLoading(true)
        const formData = new FormData()
        formData.append('email', email)
        formData.append('otp', values.otp)
        formData.append('password', values.password)

        const result = await resetPasswordAction(null, formData)

        if (result?.error) {
            toast.error(result.error)
            setIsLoading(false)
        } else if (result?.success) {
            toast.success('Password reset successfully! You can now sign in.')
            router.push('/auth/signin')
        }
    }

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                        <CardDescription>No email provided for reset.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild>
                            <Link href="/auth/forgot-password">Try Again</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <Card className="shadow-xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                        <CardDescription>
                            Enter the code sent to {email} and your new password
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="otp"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Verification Code</FormLabel>
                                            <FormControl>
                                                <div className="flex justify-center">
                                                    <InputOTP
                                                        maxLength={6}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                    >
                                                        <InputOTPGroup>
                                                            <InputOTPSlot index={0} />
                                                            <InputOTPSlot index={1} />
                                                            <InputOTPSlot index={2} />
                                                            <InputOTPSlot index={3} />
                                                            <InputOTPSlot index={4} />
                                                            <InputOTPSlot index={5} />
                                                        </InputOTPGroup>
                                                    </InputOTP>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                                                    <PasswordInput className="pl-9" placeholder="******" {...field} />
                                                </div>
                                            </FormControl>
                                            <PasswordRequirements password={field.value} />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm New Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                                                    <PasswordInput className="pl-9" placeholder="******" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
                                        </>
                                    ) : (
                                        <>
                                            Reset Password <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
