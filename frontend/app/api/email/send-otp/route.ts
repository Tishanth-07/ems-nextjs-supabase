import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()

        // Initialize Supabase Service Client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Store OTP in database
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        const { error: dbError } = await supabase
            .from('email_verifications')
            .insert({
                email,
                otp,
                expires_at: expiresAt.toISOString(),
                verified: false
            })

        if (dbError) {
            console.error('Database error:', dbError)
            return NextResponse.json({ error: 'Failed to store OTP' }, { status: 500 })
        }

        // Send Email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        })

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Email Verification Code - Employee Management System',
            text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
            html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Email send error:', error)
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
}
