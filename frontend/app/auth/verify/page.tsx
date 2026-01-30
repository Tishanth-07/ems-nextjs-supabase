'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { verifyOtpAction } from '../actions'

function VerifyContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email')

    const [otp, setOtp] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [timeLeft, setTimeLeft] = useState(0) // 0 means can resend

    // Auto-focus logic handled by InputOTP usually, or we can add logic if needed.

    // Timer logic
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [timeLeft])

    async function handleVerify() {
        if (otp.length !== 6) return

        setIsLoading(true)
        if (!email) {
            toast.error("Email missing")
            setIsLoading(false)
            return
        }

        const result = await verifyOtpAction(email, otp)

        if (result?.error) {
            toast.error(result.error)
            setIsLoading(false)
            setOtp('') // clear on error
        } else if (result?.success) {
            toast.success("Email verified successfully!")
            router.push('/login')
        }
    }

    return (
        <Card className="border-t-4 border-t-green-500 shadow-xl w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 bg-green-100 dark:bg-green-900/30 p-3 rounded-full w-fit">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
                <CardDescription>
                    We sent a 6-digit code to <br />
                    <span className="font-medium text-foreground">{email}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex flex-col items-center">
                <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(val) => setOtp(val)}
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

                <Button
                    className="w-full"
                    onClick={handleVerify}
                    disabled={isLoading || otp.length !== 6}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Email"}
                </Button>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 text-center text-sm">
                <div className="text-muted-foreground">
                    Didn't receive the code?
                </div>
                <Button
                    variant="link"
                    className="text-primary"
                    disabled={timeLeft > 0}
                    onClick={() => {
                        toast.info("Resend logic strictly implemented in next step")
                        setTimeLeft(60)
                    }}
                >
                    {timeLeft > 0 ? (
                        `Resend in ${timeLeft}s`
                    ) : (
                        <>
                            Click to resend
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function VerifyPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <Suspense fallback={<div>Loading...</div>}>
                    <VerifyContent />
                </Suspense>
            </motion.div>
        </div>
    )
}
