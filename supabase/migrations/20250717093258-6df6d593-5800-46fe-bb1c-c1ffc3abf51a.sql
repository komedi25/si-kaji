-- Fix migration: Handle missing columns in source tables and create unified attendance system

-- Step 1: Create unified attendance table
CREATE TABLE IF NOT EXISTS public.unified_attendances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  attendance_date DATE NOT NULL,
  check_in_time TIME WITH TIME ZONE,
  check_out_time TIME WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'present',
  late_minutes INTEGER DEFAULT 0,
  early_leave_minutes INTEGER DEFAULT 0,
  check_in_location_id UUID,
  check_out_location_id UUID,
  check_in_method TEXT DEFAULT 'manual',
  check_out_method TEXT DEFAULT 'manual',
  recorded_by UUID,
  notes TEXT,
  violation_created BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(student_id, attendance_date)
);

-- Step 2: Migrate data from student_self_attendances (has all required columns)
INSERT INTO public.unified_attendances (
  student_id, attendance_date, check_in_time, check_out_time,
  status, late_minutes, early_leave_minutes,
  check_in_location_id, check_out_location_id,
  check_in_method, check_out_method, notes, violation_created,
  created_at, updated_at
)
SELECT 
  student_id, attendance_date, check_in_time, check_out_time,
  status, 
  COALESCE(late_minutes, 0) as late_minutes,
  COALESCE(early_leave_minutes, 0) as early_leave_minutes,
  check_in_location_id, check_out_location_id,
  'self'::TEXT as check_in_method, 
  'self'::TEXT as check_out_method,
  notes, 
  COALESCE(violation_created, false) as violation_created,
  created_at, updated_at
FROM public.student_self_attendances
ON CONFLICT (student_id, attendance_date) DO NOTHING;

-- Step 3: Migrate data from student_attendances (only has basic columns)
INSERT INTO public.unified_attendances (
  student_id, attendance_date, check_in_time, check_out_time,
  status, recorded_by, check_in_method, check_out_method, notes,
  created_at, updated_at
)
SELECT 
  student_id, attendance_date, 
  CASE WHEN status = 'present' THEN '07:00:00+07'::TIME WITH TIME ZONE ELSE NULL END,
  CASE WHEN status = 'present' THEN '14:00:00+07'::TIME WITH TIME ZONE ELSE NULL END,
  status, recorded_by,
  'manual'::TEXT as check_in_method,
  'manual'::TEXT as check_out_method,
  notes,
  created_at, updated_at
FROM public.student_attendances
ON CONFLICT (student_id, attendance_date) DO UPDATE SET
  recorded_by = EXCLUDED.recorded_by,
  check_in_method = EXCLUDED.check_in_method,
  check_out_method = EXCLUDED.check_out_method,
  notes = COALESCE(EXCLUDED.notes, unified_attendances.notes);

-- Step 4: Enable RLS on unified_attendances
ALTER TABLE public.unified_attendances ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for unified_attendances
CREATE POLICY "Students can manage their own attendance"
ON public.unified_attendances
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.id = unified_attendances.student_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Staff can manage all attendance"
ON public.unified_attendances
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['admin'::app_role, 'wali_kelas'::app_role, 'guru_bk'::app_role, 'tppk'::app_role, 'waka_kesiswaan'::app_role])
    AND is_active = true
  )
);

-- Step 6: Update attendance_schedules to support global settings
ALTER TABLE public.attendance_schedules 
ADD COLUMN IF NOT EXISTS applies_to_all_classes BOOLEAN DEFAULT false;

-- Insert default global schedule if not exists
INSERT INTO public.attendance_schedules (
  name, day_of_week, check_in_start, check_in_end, 
  check_out_start, check_out_end, late_threshold_minutes,
  applies_to_all_classes, is_active
) VALUES 
('Senin Global', 1, '06:30:00', '07:30:00', '14:00:00', '15:00:00', 15, true, true),
('Selasa Global', 2, '06:30:00', '07:30:00', '14:00:00', '15:00:00', 15, true, true),
('Rabu Global', 3, '06:30:00', '07:30:00', '14:00:00', '15:00:00', 15, true, true),
('Kamis Global', 4, '06:30:00', '07:30:00', '14:00:00', '15:00:00', 15, true, true),
('Jumat Global', 5, '06:30:00', '07:30:00', '13:00:00', '14:00:00', 15, true, true)
ON CONFLICT DO NOTHING;