-- Allow email verification before user creation
-- Make user_id nullable and add email-based verification support

-- First, drop the existing foreign key constraint
ALTER TABLE email_verifications 
    ALTER COLUMN user_id DROP NOT NULL;

-- Update the comment to reflect the new behavior
COMMENT ON COLUMN email_verifications.user_id IS 'User ID - nullable to support pre-creation email verification';
COMMENT ON COLUMN email_verifications.email IS 'Email address - used as primary identifier for pre-creation verifications';

-- Update RLS policies to support both pre-creation and post-creation verifications
-- Drop the old user-based SELECT policy
DROP POLICY IF EXISTS "Users can view their own verifications" ON email_verifications;

-- Create a new SELECT policy that works with email OR user_id
CREATE POLICY "Users can view their own verifications"
    ON email_verifications
    FOR SELECT
    USING (
        -- Either the user_id matches (for existing users)
        auth.uid() = user_id 
        OR 
        -- Or it's a pre-creation verification (user_id is null) and we're using service role
        (user_id IS NULL AND auth.role() = 'service_role')
    );

-- Create index on email for faster lookups during pre-creation verification
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

-- Update cleanup function to handle both types of verifications
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
    DELETE FROM email_verifications
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
