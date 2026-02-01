-- Manager RLS Policies Migration
-- Enables managers to view and manage their team members, attendance, and leave requests

-- ===========================================
-- 1. MANAGER POLICIES FOR PROFILES TABLE
-- ===========================================

-- Managers can view their team members
CREATE POLICY "Managers can view their team"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Manager viewing their direct reports
  manager_id = auth.uid()
  OR
  -- Include view of their own manager
  id IN (SELECT manager_id FROM profiles WHERE id = auth.uid())
);

-- Managers can update their team members (limited fields)
CREATE POLICY "Managers can update team members"
ON profiles FOR UPDATE
TO authenticated
USING (
  -- Can only update direct reports
  manager_id = auth.uid()
);

-- ===========================================
-- 2. MANAGER POLICIES FOR ATTENDANCE LOGS
-- ===========================================

-- Managers can view their team's attendance
CREATE POLICY "Managers can view team attendance"
ON attendance_logs FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM profiles WHERE manager_id = auth.uid()
  )
);

-- Employees can view own attendance
CREATE POLICY "Users can view own attendance"
ON attendance_logs FOR SELECT
TO authenticated
USING (employee_id = auth.uid());

-- ===========================================
-- 3. MANAGER POLICIES FOR LEAVES TABLE
-- ===========================================

-- Managers can view their team's leave requests
CREATE POLICY "Managers can view team leaves"
ON leaves FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM profiles WHERE manager_id = auth.uid()
  )
);

-- Managers can approve/reject their team's leaves
CREATE POLICY "Managers can update team leaves"
ON leaves FOR UPDATE
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM profiles WHERE manager_id = auth.uid()
  )
)
WITH CHECK (
  -- Ensure approved_by is set to manager's ID
  approved_by = auth.uid()
);

-- Employees can view own leaves
CREATE POLICY "Users can view own leaves"
ON leaves FOR SELECT
TO authenticated
USING (employee_id = auth.uid());

-- Employees can create leave requests
CREATE POLICY "Users can create own leaves"
ON leaves FOR INSERT
TO authenticated
WITH CHECK (employee_id = auth.uid());

-- ===========================================
-- 4. ENABLE REALTIME SUBSCRIPTIONS
-- ===========================================

-- Enable Realtime on profiles for team updates
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Enable Realtime on attendance_logs for live attendance tracking
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs;

-- Enable Realtime on leaves for real-time leave requests
ALTER PUBLICATION supabase_realtime ADD TABLE leaves;

-- ===========================================
-- 5. PERFORMANCE INDEXES
-- ===========================================

-- Index for manager team queries
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id 
ON profiles(manager_id) WHERE manager_id IS NOT NULL;

-- Index for attendance employee lookup
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date 
ON attendance_logs(employee_id, date DESC);

-- Index for leave requests by employee
CREATE INDEX IF NOT EXISTS idx_leaves_employee_status 
ON leaves(employee_id, status) WHERE status = 'pending';

-- Index for leaves by approval status
CREATE INDEX IF NOT EXISTS idx_leaves_status_created 
ON leaves(status, created_at DESC) WHERE status = 'pending';

-- ===========================================
-- COMMENTS FOR DOCUMENTATION
-- ===========================================

COMMENT ON POLICY "Managers can view their team" ON profiles IS 
'Allows managers to view profiles of their direct reports (where manager_id = current user)';

COMMENT ON POLICY "Managers can update team members" ON profiles IS 
'Allows managers to update their team member profiles. Application must enforce field restrictions.';

COMMENT ON POLICY "Managers can view team attendance" ON attendance_logs IS 
'Allows managers to view attendance logs of their team members';

COMMENT ON POLICY "Managers can view team leaves" ON leaves IS 
'Allows managers to view leave requests from their team members';

COMMENT ON POLICY "Managers can update team leaves" ON leaves IS 
'Allows managers to approve/reject leave requests from their team. Enforces approved_by = manager ID';
