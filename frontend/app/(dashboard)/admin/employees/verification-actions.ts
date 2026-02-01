'use server'

import nodemailer from 'nodemailer'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Create Gmail transporter
 */
function createGmailTransporter() {
    const gmailUser = process.env.GMAIL_USER
    const gmailPassword = process.env.GMAIL_APP_PASSWORD

    if (!gmailUser || !gmailPassword) {
        return null
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: gmailUser,
            pass: gmailPassword,
        },
    })
}

/**
 * Send verification code to employee email via Gmail SMTP
 * This ensures only real, deliverable emails can be verified
 */
export async function sendVerificationCodeAction(email: string) {
    try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return { error: 'Invalid email format' }
        }

        const supabaseAdmin = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Generate 6-digit code
        const code = generateVerificationCode()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Store verification code in database
        const { error: insertError } = await supabaseAdmin
            .from('email_verifications')
            .insert({
                user_id: null,
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

        // Create Gmail transporter
        const transporter = createGmailTransporter()

        if (!transporter) {
            console.error('[sendVerificationCodeAction] Gmail not configured')

            // Clean up database entry
            await supabaseAdmin
                .from('email_verifications')
                .delete()
                .eq('email', email)
                .eq('code', code)

            return {
                error: 'Email service not configured. Please add GMAIL_USER and GMAIL_APP_PASSWORD to your environment variables.'
            }
        }

        // Send email via Gmail
        try {
            const mailOptions = {
                from: `"Employee Management System" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: 'Email Verification Code - Employee Management System',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">Email Verification</h1>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                            <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
                            
                            <p style="font-size: 16px; margin-bottom: 20px;">
                                You have been invited to join the Employee Management System. 
                                Please share this verification code with your admin to complete the registration process.
                            </p>
                            
                            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                                <p style="font-size: 14px; color: #6b7280; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                                <p style="font-size: 36px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                    ${code}
                                </p>
                            </div>
                            
                            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; font-size: 14px; color: #92400e;">
                                    ⏱️ This code expires in <strong>10 minutes</strong>
                                </p>
                            </div>
                            
                            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                                If you didn't expect this email, you can safely ignore it.
                            </p>
                        </div>
                        
                        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                            <p style="margin: 0;">© ${new Date().getFullYear()} Employee Management System. All rights reserved.</p>
                        </div>
                    </body>
                    </html>
                `
            }

            await transporter.sendMail(mailOptions)

            console.log(`[sendVerificationCodeAction] Email sent successfully to ${email}`)

            return {
                success: true,
                message: 'Verification code sent to email. Please ask the employee to check their inbox.',
            }
        } catch (emailError: any) {
            console.error('[sendVerificationCodeAction] Email send error:', emailError)

            // Clean up the database entry
            await supabaseAdmin
                .from('email_verifications')
                .delete()
                .eq('email', email)
                .eq('code', code)

            return { error: 'Failed to send email. Please verify your email service configuration.' }
        }
    } catch (error: any) {
        console.error('[sendVerificationCodeAction] Error:', error)
        return { error: error.message || 'Failed to send verification code' }
    }
}

/**
 * Verify email code
 */
export async function verifyEmailCodeAction(email: string, code: string) {
    try {
        const supabaseAdmin = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Find verification record
        const { data: verification, error: fetchError } = await supabaseAdmin
            .from('email_verifications')
            .select('*')
            .eq('email', email)
            .eq('code', code)
            .is('user_id', null)
            .eq('verified', false)
            .order('created_at', { ascending: false })
            .limit(1)
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

        console.log(`[verifyEmailCodeAction] Email verified successfully: ${email}`)

        return {
            success: true,
            message: 'Email verified successfully',
            verifiedEmail: email
        }
    } catch (error: any) {
        console.error('[verifyEmailCodeAction] Error:', error)
        return { error: error.message || 'Failed to verify code' }
    }
}

/**
 * Resend verification code
 */
export async function resendVerificationCodeAction(email: string) {
    // Invalidate old codes first
    try {
        const supabaseAdmin = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        await supabaseAdmin
            .from('email_verifications')
            .delete()
            .eq('email', email)
            .is('user_id', null)
            .eq('verified', false)
    } catch (error) {
        console.error('[resendVerificationCodeAction] Cleanup error:', error)
    }

    return sendVerificationCodeAction(email)
}
