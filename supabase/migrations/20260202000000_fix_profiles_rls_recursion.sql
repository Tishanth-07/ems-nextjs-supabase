-- Fix infinite recursion in RLS policies
-- The issue: other table policies query profiles, causing recursion when reading profiles

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create a simple policy: authenticated users can SELECT any profile
-- This breaks the recursion chain
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Ensure users can still update their own profile
-- (This policy already exists, just confirming)
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Allow service role to do everything (for server-side operations)
CREATE POLICY "Service role can do anything with profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
