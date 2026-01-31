'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { generateAndStoreOTP, sendOTPEmail } from '@/app/auth/actions'
import { generateEmployeeCode } from '@/lib/utils/employee-code'
import { Database } from '@/types/supabase'

const createEmployeeSchema = z.object({
    fullName: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    role: z.enum(['admin', 'manager', 'employee']),
    department: z.string().min(2, "Department is required"),
    position: z.string().min(2, "Position is required"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[a-z]/, "Must contain at least one lowercase letter")
        .regex(/[0-9]/, "Must contain at least one number")
        .regex(/[!@#$%^&*]/, "Must contain at least one special character"),
})

export async function createEmployeeAction(prevState: any, formData: FormData) {
    try {
        const validatedFields = createEmployeeSchema.safeParse({
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            role: formData.get('role'),
            department: formData.get('department'),
            position: formData.get('position'),
            password: formData.get('password'),
        })

        if (!validatedFields.success) {
            return { error: 'Invalid fields', errors: validatedFields.error.flatten().fieldErrors }
        }

        const { fullName, email, role, department, position, password } = validatedFields.data

        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { data: currentUserProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (currentUserProfile?.role !== 'admin') {
            return { error: 'Unauthorized: Admin access required' }
        }

        const supabaseAdmin = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const finalPassword = password // Assuming generateRandomPassword is defined elsewhere or will be added
        console.log('[createEmployeeAction] Starting employee creation for:', email)

        // Get skip verification flag
        const skipEmailVerification = formData.get('skipEmailVerification') === 'true'
        const isVerified = skipEmailVerification // If admin skips verification, mark as verified

        // Step 1: Create Auth User
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: finalPassword,
            email_confirm: skipEmailVerification, // If skipping, auto-confirm email
            user_metadata: {
                full_name: fullName,
                role: role,
                department: department,
                is_verified: isVerified // Pass to trigger
            }
        })

        if (createError) {
            console.error('[createEmployeeAction] Auth user creation failed:', {
                code: createError.code,
                message: createError.message,
                status: createError.status,
                email: email
            })

            // Handle specific auth errors
            if (createError.message?.includes('already registered') || createError.status === 422) {
                return { error: 'Email already registered. Please use a different email.' }
            }

            return { error: `Failed to create user account: ${createError.message}` }
        }

        if (!newUser.user) {
            console.error('[createEmployeeAction] No user returned from createUser')
            return { error: 'Failed to create user' }
        }

        // Step 2: Update Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                department,
                role,
                full_name: fullName,
                is_verified: false
            })
            .eq('id', newUser.user.id)

        if (profileError) {
            console.error('[createEmployeeAction] Profile update error:', {
                code: profileError.code,
                message: profileError.message,
                details: profileError.details,
                hint: profileError.hint,
                userId: newUser.user.id
            })
            // Continue even if profile update fails - trigger should have created it
        }

        // Step 3: Generate Employee Code
        let employeeCode: string
        try {
            employeeCode = await generateEmployeeCode(supabaseAdmin as any)
            console.log('[createEmployeeAction] Generated employee code:', employeeCode)
        } catch (codeError: any) {
            console.error('[createEmployeeAction] Employee code generation failed:', codeError)
            return {
                error: `User created but employee code generation failed: ${codeError.message}`,
                tempPassword: finalPassword
            }
        }

        // Step 4: Insert into Employees table
        const { error: employeeError } = await (supabaseAdmin as any)
            .from('employees')
            .insert({
                profile_id: newUser.user.id,
                employee_code: employeeCode,
                position: position,
                status: 'active',
                hire_date: new Date().toISOString().split('T')[0]
            })

        if (employeeError) {
            console.error('[createEmployeeAction] Employee insert error:', {
                code: employeeError.code,
                message: employeeError.message,
                details: employeeError.details,
                hint: employeeError.hint,
                employeeCode: employeeCode,
                profileId: newUser.user.id
            })

            // Handle specific PostgreSQL errors
            let errorMessage = 'User created but employee record failed: '

            if (employeeError.code === '23505') {
                // Unique constraint violation
                errorMessage += 'Employee code already exists. Please try again.'
            } else if (employeeError.code === '23502') {
                // Not-null constraint violation
                errorMessage += `Missing required field: ${employeeError.message}`
            } else if (employeeError.code === '23503') {
                // Foreign key violation
                errorMessage += 'Profile reference is invalid.'
            } else {
                errorMessage += employeeError.message
            }

            return { error: errorMessage, tempPassword: finalPassword }
        }

        // Step 5: Send Verification Email (only if not skipped)
        if (!skipEmailVerification) {
            try {
                const otp = await generateAndStoreOTP(email)
                const emailRes = await sendOTPEmail(email, otp)
                if (emailRes.error) {
                    console.error('[createEmployeeAction] Failed to send verification email:', emailRes.error)
                    return {
                        success: true,
                        tempPassword: finalPassword,
                        employeeCode: employeeCode,
                        message: `Employee created (Code: ${employeeCode}), but verification email failed.`,
                        warning: true
                    }
                }
            } catch (e: any) {
                console.error('[createEmployeeAction] Error generating OTP:', e)
                return {
                    success: true,
                    tempPassword: finalPassword,
                    employeeCode: employeeCode,
                    message: `Employee created (Code: ${employeeCode}), but OTP logic failed.`,
                    warning: true
                }
            }
        }

        revalidatePath('/admin/employees')

        const message = skipEmailVerification
            ? `Employee created successfully! Code: ${employeeCode}. Email marked as verified.`
            : `Employee created successfully! Code: ${employeeCode}. Verification email sent.`

        return {
            success: true,
            tempPassword: finalPassword,
            employeeCode: employeeCode,
            message
        }
    } catch (error: any) {
        console.error('[createEmployeeAction] Unexpected error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code
        })
        return {
            error: `An unexpected error occurred: ${error.message}. Please contact support if this persists.`
        }
    }
}

const updateEmployeeSchema = z.object({
    id: z.string().uuid(),
    position: z.string().min(2, "Position is required"),
    salary_rate: z.coerce.number().min(0, "Salary must be non-negative"),
    status: z.enum(['active', 'on_leave', 'terminated', 'resigned'])
})

export async function updateEmployee(formData: FormData) {
    const validatedFields = updateEmployeeSchema.safeParse({
        id: formData.get('id'),
        position: formData.get('position'),
        salary_rate: formData.get('salary_rate'),
        status: formData.get('status'),
    })

    if (!validatedFields.success) {
        return { error: 'Invalid fields', errors: validatedFields.error.flatten().fieldErrors }
    }

    const { id, position, salary_rate, status } = validatedFields.data
    const supabase = await createClient()

    // 1. Check Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    // 2. Update Employee
    const { error } = await (supabase as any)
        .from('employees')
        .update({ position, salary_rate, status })
        .eq('id', id)

    if (error) {
        return { error: 'Update failed: ' + error.message }
    }

    revalidatePath('/admin/employees')
    revalidatePath(`/admin/employees/${id}`)

    return { success: true }
}

export async function resendVerificationEmail(email: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Unauthorized' }
        }

        // Check if admin
        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!adminProfile || adminProfile.role !== 'admin') {
            return { error: 'Only admins can resend verification emails' }
        }

        // Create admin client
        const supabaseAdmin = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Send verification email using OTP system
        const otp = await generateAndStoreOTP(email)
        const emailRes = await sendOTPEmail(email, otp)

        if (emailRes.error) {
            console.error('[resendVerificationEmail] Failed to send email:', emailRes.error)
            return { error: 'Failed to send verification email' }
        }

        return { success: true, message: 'Verification email sent successfully' }
    } catch (error: any) {
        console.error('[resendVerificationEmail] Error:', error)
        return { error: error.message || 'Failed to resend verification email' }
    }
}
