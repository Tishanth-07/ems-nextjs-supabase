-- Create email_verifications table for storing verification codes
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_code ON email_verifications(code);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);

-- RLS policies
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own verification records
CREATE POLICY "Users can view their own verifications"
    ON email_verifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow service role to insert verification records
CREATE POLICY "Service role can insert verifications"
    ON email_verifications
    FOR INSERT
    WITH CHECK (true);

-- Allow service role to update verification records
CREATE POLICY "Service role can update verifications"
    ON email_verifications
    FOR UPDATE
    USING (true);

-- Function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
    DELETE FROM email_verifications
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (optional - can be run via cron job)
COMMENT ON FUNCTION cleanup_expired_verifications IS 'Removes verification codes older than 1 day. Run periodically via cron or pg_cron.';
