import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json()

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
        }

        // Initialize Supabase Service Client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Verify OTP
        const { data: verification, error } = await supabase
            .from('email_verifications')
            .select('*')
            .eq('email', email)
            .eq('otp', otp)
            .gte('expires_at', new Date().toISOString())
            .eq('verified', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (error || !verification) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
        }

        // Mark as verified
        const { error: updateError } = await supabase
            .from('email_verifications')
            .update({ verified: true })
            .eq('id', verification.id)

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Verification error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
