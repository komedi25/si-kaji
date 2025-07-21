-- Add missing RLS policies for attendance_locations table
-- Currently only has SELECT policies, need INSERT, UPDATE, DELETE for admins

-- Admin can manage attendance locations
CREATE POLICY "Admin can manage attendance locations" ON public.attendance_locations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY(ARRAY['admin'::app_role, 'waka_kesiswaan'::app_role, 'tppk'::app_role])
    AND user_roles.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY(ARRAY['admin'::app_role, 'waka_kesiswaan'::app_role, 'tppk'::app_role])
    AND user_roles.is_active = true
  )
);