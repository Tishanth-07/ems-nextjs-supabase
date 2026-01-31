-- Create settings table for admin configuration
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can read/update settings
CREATE POLICY "Admins can view settings"
    ON public.settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update settings"
    ON public.settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert settings"
    ON public.settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insert default settings if table is empty
INSERT INTO public.settings (config, updated_by)
SELECT 
    jsonb_build_object(
        'company', jsonb_build_object(
            'name', 'My Company',
            'logo_url', '',
            'timezone', 'UTC',
            'currency', 'USD'
        ),
        'leave', jsonb_build_object(
            'default_annual_days', 20,
            'public_holidays', '[]'::jsonb,
            'working_days', '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb,
            'grace_minutes', 15
        ),
        'password', jsonb_build_object(
            'min_length', 8,
            'require_uppercase', true,
            'require_lowercase', true,
            'require_number', true,
            'require_special', true,
            'expiry_days', 90
        ),
        'notifications', jsonb_build_object(
            'email_enabled', true,
            'leave_approval_emails', true,
            'new_employee_emails', true,
            'system_alerts', true
        ),
        'security', jsonb_build_object(
            'enforce_2fa_admins', false,
            'session_timeout_minutes', 60,
            'ip_whitelist', '[]'::jsonb
        ),
        'system', jsonb_build_object(
            'log_retention_days', 90,
            'auto_backup', false,
            'theme', 'system'
        )
    ),
    (SELECT id FROM auth.users LIMIT 1) -- First user as default
WHERE NOT EXISTS (SELECT 1 FROM public.settings);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON public.settings(updated_at DESC);
