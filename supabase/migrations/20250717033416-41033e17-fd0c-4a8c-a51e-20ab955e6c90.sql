-- Fix RLS policies for TPPK role on student_attendances table

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "TPPK can insert attendance records" ON public.student_attendances;
DROP POLICY IF EXISTS "TPPK can view attendance records" ON public.student_attendances;

-- Allow TPPK to view all attendance records
CREATE POLICY "TPPK can view all attendance records" 
ON public.student_attendances 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'tppk'::app_role 
    AND is_active = true
  )
);

-- Allow TPPK to insert attendance records 
CREATE POLICY "TPPK can insert all attendance records" 
ON public.student_attendances 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'tppk'::app_role 
    AND is_active = true
  )
);

-- Allow TPPK to update attendance records
CREATE POLICY "TPPK can update attendance records" 
ON public.student_attendances 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'tppk'::app_role 
    AND is_active = true
  )
);