-- Create settings table for storing company-wide configurations
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON settings(updated_at DESC);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only admins can view settings
CREATE POLICY "Admins can view settings"
    ON settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings"
    ON settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
    ON settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Insert default settings
INSERT INTO settings (config) VALUES (
    '{
        "company": {
            "name": "My Company",
            "timezone": "UTC",
            "currency": "USD"
        },
        "leave": {
            "default_annual_days": 20,
            "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "grace_minutes": 15
        },
        "password": {
            "min_length": 8,
            "require_uppercase": true,
            "require_lowercase": true,
            "require_number": true,
            "require_special": true,
            "expiry_days": 90
        },
        "notifications": {
            "email_enabled": true,
            "leave_approval_emails": true,
            "new_employee_emails": true,
            "system_alerts": true
        },
        "security": {
            "enforce_2fa_admins": false,
            "session_timeout_minutes": 60
        },
        "system": {
            "log_retention_days": 90,
            "auto_backup": true,
            "theme": "system"
        }
    }'::jsonb
) ON CONFLICT DO NOTHING;
