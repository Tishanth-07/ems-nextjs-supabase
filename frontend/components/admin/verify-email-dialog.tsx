'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { verifyEmailCodeAction, resendVerificationCodeAction } from '../app/(dashboard)/admin/employees/verification-actions'

interface VerifyEmailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
    email: string
    fullName: string
    onSuccess?: () => void
}

export function VerifyEmailDialog({
    open,
    onOpenChange,
    userId,
    email,
    fullName,
    onSuccess
}: VerifyEmailDialogProps) {
    const [code, setCode] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const [expiryTime, setExpiryTime] = useState(10 * 60) // 10 minutes in seconds

    // Countdown timer for code expiry
    useEffect(() => {
        if (!open || expiryTime <= 0) return

        const timer = setInterval(() => {
            setExpiryTime(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [open, expiryTime])

    // Cooldown timer for resend button
    useEffect(() => {
        if (resendCooldown <= 0) return

        const timer = setInterval(() => {
            setResendCooldown(prev => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [resendCooldown])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    async function handleVerify() {
        if (code.length !== 6) {
            toast.error('Please enter a 6-digit code')
            return
        }

        setIsVerifying(true)

        const result = await verifyEmailCodeAction(userId, code)

        setIsVerifying(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Email verified successfully!')
            setCode('')
            onOpenChange(false)
            onSuccess?.()
        }
    }

    async function handleResend() {
        setIsResending(true)

        const result = await resendVerificationCodeAction(userId, email, fullName)

        setIsResending(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Verification code sent to your email')
            setResendCooldown(60) // 60 second cooldown
            setExpiryTime(10 * 60) // Reset expiry to 10 minutes
            setCode('') // Clear existing code

            // For development, show the code in console
            if (process.env.NODE_ENV === 'development' && result.devCode) {
                console.log(`[DEV] New verification code: ${result.devCode}`)
                toast.info(`[DEV] Code: ${result.devCode}`)
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Verify Email Address
                    </DialogTitle>
                    <DialogDescription>
                        A 6-digit verification code has been sent to <strong>{email}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Verification Code</Label>
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
                                    handleVerify()
                                }
                            }}
                        />
                        <p className="text-sm text-muted-foreground">
                            Enter the 6-digit code from your email
                        </p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className={expiryTime <= 60 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                            {expiryTime > 0 ? `Expires in ${formatTime(expiryTime)}` : 'Code expired'}
                        </span>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResend}
                            disabled={isResending || resendCooldown > 0}
                            className="h-auto p-0"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Sending...
                                </>
                            ) : resendCooldown > 0 ? (
                                `Resend in ${resendCooldown}s`
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                    Resend Code
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setCode('')
                            onOpenChange(false)
                        }}
                        disabled={isVerifying}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleVerify}
                        disabled={isVerifying || code.length !== 6 || expiryTime <= 0}
                    >
                        {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify Email
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
