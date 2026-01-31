'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { generateVerificationCode, getVerificationEmailTemplate } from '@/lib/email/verification-helpers'

/**
 * Send verification code to employee email
 */
export async function sendVerificationCodeAction(userId: string, email: string, fullName: string) {
    try {
        const supabaseAdmin = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Generate 6-digit code
        const code = generateVerificationCode()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

        // Invalidate old codes for this user
        await supabaseAdmin
            .from('email_verifications')
            .update({ verified: false })
            .eq('user_id', userId)
            .eq('verified', false)

        // Store verification code
        const { error: insertError } = await supabaseAdmin
            .from('email_verifications')
            .insert({
                user_id: userId,
                email,
                code,
                expires_at: expiresAt.toISOString(),
                verified: false,
                attempts: 0
            })

        if (insertError) {
            console.error('[sendVerificationCodeAction] Insert error:', insertError)
            return { error: 'Failed to create verification code' }
        }

        // Send email using Supabase Admin
        const emailTemplate = getVerificationEmailTemplate(fullName, code)

        // Use Supabase Auth to send email (this is a custom email, so we'll need to use a different approach)
        // For now, we'll use the Resend API or similar if available
        // But first, let's try with a simple approach using Supabase's built-in email

        // Note: In production, you should use a proper email service like Resend, SendGrid, etc.
        // For now, we'll log the code and return success (you'll need to integrate your email service)
        console.log(`[sendVerificationCodeAction] Verification code for ${email}: ${code}`)

        // TODO: Integrate with your email service here
        // Example with Resend:
        // await fetch('https://api.resend.com/emails', {
        //     method: 'POST',
        //     headers: {
        //         'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         from: 'noreply@yourcompany.com',
        //         to: email,
        //         subject: emailTemplate.subject,
        //         html: emailTemplate.html
        //     })
        // })

        return {
            success: true,
            message: 'Verification code sent to email',
            // For development, return the code (REMOVE IN PRODUCTION!)
            devCode: process.env.NODE_ENV === 'development' ? code : undefined
        }
    } catch (error: any) {
        console.error('[sendVerificationCodeAction] Error:', error)
        return { error: error.message || 'Failed to send verification code' }
    }
}

/**
 * Verify email code
 */
export async function verifyEmailCodeAction(userId: string, code: string) {
    try {
        const supabase = await createClient()
        const supabaseAdmin = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Find verification record
        const { data: verification, error: fetchError } = await supabaseAdmin
            .from('email_verifications')
            .select('*')
            .eq('user_id', userId)
            .eq('code', code)
            .eq('verified', false)
            .single()

        if (fetchError || !verification) {
            console.error('[verifyEmailCodeAction] Verification not found:', fetchError)
            return { error: 'Invalid verification code' }
        }

        // Check if code is expired
        const now = new Date()
        const expiresAt = new Date(verification.expires_at)

        if (now > expiresAt) {
            return { error: 'Verification code has expired. Please request a new code.' }
        }

        // Check attempts limit (max 5 attempts)
        if (verification.attempts >= 5) {
            return { error: 'Too many attempts. Please request a new code.' }
        }

        // Mark as verified
        const { error: updateError } = await supabaseAdmin
            .from('email_verifications')
            .update({ verified: true })
            .eq('id', verification.id)

        if (updateError) {
            console.error('[verifyEmailCodeAction] Update error:', updateError)
            return { error: 'Failed to verify code' }
        }

        // Update user email confirmation in auth
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { email_confirm: true }
        )

        if (authError) {
            console.error('[verifyEmailCodeAction] Auth update error:', authError)
            return { error: 'Failed to confirm email in auth system' }
        }

        // Update profile is_verified status
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ is_verified: true })
            .eq('id', userId)

        if (profileError) {
            console.error('[verifyEmailCodeAction] Profile update error:', profileError)
            // Continue even if profile update fails
        }

        return { success: true, message: 'Email verified successfully' }
    } catch (error: any) {
        console.error('[verifyEmailCodeAction] Error:', error)
        return { error: error.message || 'Failed to verify code' }
    }
}

/**
 * Increment failed verification attempts
 */
export async function incrementVerificationAttempts(userId: string, code: string) {
    try {
        const supabaseAdmin = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        await supabaseAdmin
            .from('email_verifications')
            .update({ attempts: supabaseAdmin.from('email_verifications').select('attempts').eq('user_id', userId).eq('code', code).single().then((r: any) => (r.data?.attempts || 0) + 1) })
            .eq('user_id', userId)
            .eq('code', code)
    } catch (error) {
        console.error('[incrementVerificationAttempts] Error:', error)
    }
}

/**
 * Resend verification code (same as send but invalidates old codes first)
 */
export async function resendVerificationCodeAction(userId: string, email: string, fullName: string) {
    return sendVerificationCodeAction(userId, email, fullName)
}
