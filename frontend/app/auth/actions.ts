'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'
import { z } from 'zod'

// --- Utility: Send Email ---
export async function sendOTPEmail(email: string, otp: string) {
    try {
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
            subject: 'Your Verification Code - Employee Management System',
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Verify your email</h2>
                    <p>Your verification code is:</p>
                    <h1 style="letter-spacing: 5px; background: #f4f4f4; padding: 10px; display: inline-block;">${otp}</h1>
                    <p>This code will expire in 10 minutes.</p>
                </div>
            `,
        })
        return { success: true }
    } catch (error: any) {
        console.error('Email send error:', error)
        return { error: 'Failed to send verification email' }
    }
}

// --- Utility: Generate & Store OTP ---
export async function generateAndStoreOTP(email: string) {
    const supabaseService = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 mins

    const { error } = await supabaseService
        .from('email_verifications')
        .insert({
            email,
            otp,
            expires_at: expiresAt.toISOString(),
            verified: false
        })

    if (error) throw new Error('Failed to generate OTP')
    return otp
}

// --- Action: Signup ---
const signupSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 chars"),
    email: z.string().email(),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
})

export async function signUpAction(prevState: any, formData: FormData) {
    try {
        const validatedFields = signupSchema.safeParse({
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
        })

        if (!validatedFields.success) {
            return { error: 'Invalid input fields', errors: validatedFields.error.flatten().fieldErrors }
        }

        const { username, email, password } = validatedFields.data
        const supabaseService = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Check Username Uniqueness
        const { data: existingUser } = await supabaseService
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle() // Use maybeSingle to avoid thrown error on no row

        if (existingUser) {
            return { error: 'Username already taken' }
        }

        // 2. Create Auth User (Admin Mode to bypass Supabase Rate Limits/Default Emails)
        // We handle email verification manually via OTP.
        const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
            email,
            password,
            email_confirm: false,
            user_metadata: { username, is_verified: false }
        })

        if (authError) return { error: authError.message }
        if (!authData.user) return { error: 'Something went wrong creating account' }

        // 3. Generate & Send OTP
        const otp = await generateAndStoreOTP(email)
        const emailResult = await sendOTPEmail(email, otp)
        if (emailResult.error) return { error: emailResult.error }

        // 4. Return success
        return { success: true, email: email }

    } catch (error: any) {
        console.error('Unexpected error in signUpAction:', error)
        return { error: 'An unexpected error occurred. Please try again.' }
    }
}

// --- Action: Verify OTP ---
export async function verifyOtpAction(email: string, otp: string) {
    const supabaseService = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check OTP
    const { data: verification } = await supabaseService
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .eq('otp', otp)
        .gte('expires_at', new Date().toISOString())
        .eq('verified', false)
        .single()

    if (!verification) return { error: 'Invalid or expired code' }

    // Mark Verified in DB
    await supabaseService
        .from('email_verifications')
        .update({ verified: true })
        .eq('id', verification.id)

    // Update Profile verified status
    const { data: profiles } = await supabaseService
        .from('profiles')
        .update({ is_verified: true })
        .eq('email', email)
        .select()

    const { data: { users }, error: listError } = await supabaseService.auth.admin.listUsers()
    const user = users.find(u => u.email === email)
    if (user) {
        await supabaseService.auth.admin.updateUserById(user.id, {
            email_confirm: true
        })
    }

    return { success: true }
}

// --- Action: Sign In ---
const startLoginSchema = z.object({
    identifier: z.string().min(1, "Username or Email is required"),
    password: z.string().min(1, "Password is required"),
})

export async function signInAction(prevState: any, formData: FormData) {
    const validatedFields = startLoginSchema.safeParse({
        identifier: formData.get('identifier'),
        password: formData.get('password'),
    })

    if (!validatedFields.success) {
        return { error: 'Invalid input fields', errors: validatedFields.error.flatten().fieldErrors }
    }

    const { identifier, password } = validatedFields.data
    const supabaseService = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Determine if identifier is email or username
    let email = identifier
    if (!identifier.includes('@')) {
        // Assume username, lookup email
        const { data: profile } = await supabaseService
            .from('profiles')
            .select('email')
            .eq('username', identifier)
            .single()

        if (!profile) return { error: 'Invalid credentials' }
        email = profile.email
    }

    // Check Verification Status & Role
    const { data: profile } = await supabaseService
        .from('profiles')
        .select('is_verified, role')
        .eq('email', email)
        .single()

    if (profile && !profile.is_verified) {
        return { error: 'Email not verified. Please verify your account.' }
    }

    // Perform Login
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')

    // Role-based Redirect
    const role = profile?.role || 'employee'
    let redirectUrl = '/employee'
    switch (role) {
        case 'admin':
            redirectUrl = '/admin'
            break
        case 'manager':
            redirectUrl = '/manager'
            break
        case 'employee':
        default:
            redirectUrl = '/employee'
            break
    }

    return { success: true, redirectUrl }
}

// --- Action: Forgot Password ---
const forgotPasswordSchema = z.object({
    email: z.string().email(),
})

export async function forgotPasswordAction(prevState: any, formData: FormData) {
    const validatedFields = forgotPasswordSchema.safeParse({
        email: formData.get('email'),
    })

    if (!validatedFields.success) {
        return { error: 'Invalid email' }
    }

    const { email } = validatedFields.data

    const supabaseService = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await supabaseService.from('profiles').select('id').eq('email', email).single()
    if (!profile) {
        return { error: 'No account found with this email' }
    }

    try {
        const otp = await generateAndStoreOTP(email)
        const emailResult = await sendOTPEmail(email, otp)
        if (emailResult.error) return { error: emailResult.error }
    } catch (e) {
        return { error: 'Failed to send reset code' }
    }

    return { success: true, email }
}

// --- Action: Reset Password ---
const resetPasswordSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
})

export async function resetPasswordAction(prevState: any, formData: FormData) {
    const validatedFields = resetPasswordSchema.safeParse({
        email: formData.get('email'),
        otp: formData.get('otp'),
        password: formData.get('password'),
    })

    if (!validatedFields.success) {
        return { error: 'Invalid fields' }
    }

    const { email, otp, password } = validatedFields.data
    const supabaseService = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Verify OTP
    const { data: verification } = await supabaseService
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .eq('otp', otp)
        .gte('expires_at', new Date().toISOString())
        .eq('verified', false)
        .single()

    if (!verification) return { error: 'Invalid or expired code' }

    // 2. Get User ID
    const { data: profile } = await supabaseService
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

    if (!profile) return { error: 'User not found' }

    // 3. Update Password
    const { error: updateError } = await supabaseService.auth.admin.updateUserById(
        profile.id,
        { password: password }
    )

    if (updateError) return { error: updateError.message }

    // 4. Mark OTP as used
    await supabaseService
        .from('email_verifications')
        .update({ verified: true })
        .eq('id', verification.id)

    return { success: true }
}

// --- Action: Sign Out ---
export async function signOutAction() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
}
