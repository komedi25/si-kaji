
-- Fix RLS policies for attendance_schedules table
-- Drop existing policies first
DROP POLICY IF EXISTS "Everyone can view active schedules" ON attendance_schedules;
DROP POLICY IF EXISTS "Admins can manage schedules" ON attendance_schedules;

-- Create more comprehensive policies
-- Allow everyone to view active schedules
CREATE POLICY "Everyone can view active schedules" ON attendance_schedules
  FOR SELECT USING (is_active = true);

-- Allow admins and relevant roles to manage schedules
CREATE POLICY "Admins and managers can manage schedules" ON attendance_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'waka_kesiswaan', 'tppk') 
      AND is_active = true
    )
  );

-- Additional policy for insert operations (more permissive for creation)
CREATE POLICY "Admins can insert schedules" ON attendance_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'waka_kesiswaan', 'tppk') 
      AND is_active = true
    )
  );

-- Additional policy for update operations
CREATE POLICY "Admins can update schedules" ON attendance_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'waka_kesiswaan', 'tppk') 
      AND is_active = true
    )
  );

-- Additional policy for delete operations
CREATE POLICY "Admins can delete schedules" ON attendance_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'waka_kesiswaan', 'tppk') 
      AND is_active = true
    )
  );

-- Ensure the table has proper RLS setup
ALTER TABLE attendance_schedules ENABLE ROW LEVEL SECURITY;

-- Add some debugging info - create a function to check user permissions
CREATE OR REPLACE FUNCTION debug_user_schedule_permissions()
RETURNS TABLE (
  user_id UUID,
  user_roles TEXT[],
  can_manage_schedules BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    ARRAY_AGG(ur.role::TEXT) as user_roles,
    bool_or(ur.role IN ('admin', 'waka_kesiswaan', 'tppk') AND ur.is_active = true) as can_manage_schedules
  FROM user_roles ur
  WHERE ur.user_id = auth.uid()
  GROUP BY auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
