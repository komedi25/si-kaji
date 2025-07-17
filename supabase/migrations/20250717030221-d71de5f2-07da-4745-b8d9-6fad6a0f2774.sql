-- Add QR attendance support to student_attendances table
-- Add notes column if it doesn't exist for late arrival tracking
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_attendances' 
                   AND column_name = 'notes') THEN
        ALTER TABLE public.student_attendances ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Update RLS policies to allow TPPK to insert attendance records
CREATE POLICY "TPPK can insert attendance records" 
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

-- Allow TPPK to view attendance records
CREATE POLICY "TPPK can view attendance records" 
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