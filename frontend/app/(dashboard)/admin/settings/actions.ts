'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const settingsSchema = z.object({
    company: z.object({
        name: z.string().min(1, 'Company name is required'),
        logo_url: z.string().optional(),
        timezone: z.string(),
        currency: z.string(),
    }).optional(),
    leave: z.object({
        default_annual_days: z.number().min(0).max(365),
        public_holidays: z.array(z.string()).optional(),
        working_days: z.array(z.string()).optional(),
        grace_minutes: z.number().min(0).max(60),
    }).optional(),
    password: z.object({
        min_length: z.number().min(6).max(128),
        require_uppercase: z.boolean(),
        require_lowercase: z.boolean(),
        require_number: z.boolean(),
        require_special: z.boolean(),
        expiry_days: z.number().min(0),
    }).optional(),
    notifications: z.object({
        email_enabled: z.boolean(),
        leave_approval_emails: z.boolean(),
        new_employee_emails: z.boolean(),
        system_alerts: z.boolean(),
    }).optional(),
    security: z.object({
        enforce_2fa_admins: z.boolean(),
        session_timeout_minutes: z.number().min(5).max(1440),
        ip_whitelist: z.array(z.string()).optional(),
    }).optional(),
    system: z.object({
        log_retention_days: z.number().min(1).max(365),
        auto_backup: z.boolean(),
        theme: z.enum(['light', 'dark', 'system']),
    }).optional(),
})

export async function getSettings() {
    try {
        const supabase = await createClient()

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            throw new Error('Only admins can access settings')
        }

        // Get settings
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single()

        if (error && error.code !== 'PGRST116') { // Not found error is ok
            console.error('[getSettings] Error:', error)
            throw error
        }

        return data?.config || {}
    } catch (error: any) {
        console.error('[getSettings] Error:', error)
        throw error
    }
}

export async function updateSettings(section: string, values: any) {
    try {
        const supabase = await createClient()

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return { error: 'Only admins can update settings' }
        }

        // Validate input
        const validatedData = settingsSchema.partial().safeParse({ [section]: values })
        if (!validatedData.success) {
            return { error: 'Invalid settings data', errors: validatedData.error.flatten().fieldErrors }
        }

        // Get current settings
        const { data: currentSettings } = await supabase
            .from('settings')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single()

        const currentConfig = (currentSettings?.config as Record<string, any>) || {}
        const newConfig = {
            ...currentConfig,
            [section]: values
        }

        // Update or insert
        if (currentSettings) {
            const { error: updateError } = await supabase
                .from('settings')
                .update({
                    config: newConfig,
                    updated_at: new Date().toISOString(),
                    updated_by: user.id
                })
                .eq('id', currentSettings.id)

            if (updateError) {
                console.error('[updateSettings] Update error:', updateError)
                return { error: 'Failed to update settings' }
            }
        } else {
            const { error: insertError } = await supabase
                .from('settings')
                .insert({
                    config: newConfig,
                    updated_by: user.id
                })

            if (insertError) {
                console.error('[updateSettings] Insert error:', insertError)
                return { error: 'Failed to create settings' }
            }
        }

        revalidatePath('/admin/settings')

        return { success: true, message: 'Settings updated successfully' }
    } catch (error: any) {
        console.error('[updateSettings] Error:', error)
        return { error: error.message || 'Failed to update settings' }
    }
}
