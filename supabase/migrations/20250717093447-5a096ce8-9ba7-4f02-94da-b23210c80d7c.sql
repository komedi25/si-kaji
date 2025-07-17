-- Create unified attendance system with correct column mapping

-- Step 1: Create unified attendance table
CREATE TABLE IF NOT EXISTS public.unified_attendances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  attendance_date DATE NOT NULL,
  check_in_time TIME WITHOUT TIME ZONE,
  check_out_time TIME WITHOUT TIME ZONE,
  status TEXT NOT NULL DEFAULT 'present',
  late_minutes INTEGER DEFAULT 0,
  early_leave_minutes INTEGER DEFAULT 0,
  check_in_location_id UUID,
  check_out_location_id UUID,
  check_in_latitude NUMERIC,
  check_in_longitude NUMERIC,
  check_out_latitude NUMERIC,
  check_out_longitude NUMERIC,
  check_in_method TEXT DEFAULT 'manual',
  check_out_method TEXT DEFAULT 'manual',
  recorded_by UUID,
  notes TEXT,
  violation_created BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(student_id, attendance_date)
);

-- Step 2: Migrate data from student_self_attendances
INSERT INTO public.unified_attendances (
  student_id, attendance_date, check_in_time, check_out_time,
  status, check_in_location_id, check_out_location_id,
  check_in_latitude, check_in_longitude, check_out_latitude, check_out_longitude,
  check_in_method, check_out_method, notes, violation_created,
  created_at, updated_at
)
SELECT 
  student_id, attendance_date, check_in_time, check_out_time,
  status, check_in_location_id, check_out_location_id,
  check_in_latitude, check_in_longitude, check_out_latitude, check_out_longitude,
  'self'::TEXT as check_in_method, 
  'self'::TEXT as check_out_method,
  notes, 
  COALESCE(violation_created, false) as violation_created,
  created_at, updated_at
FROM public.student_self_attendances
ON CONFLICT (student_id, attendance_date) DO NOTHING;

-- Step 3: Migrate data from student_attendances (manual entries)
INSERT INTO public.unified_attendances (
  student_id, attendance_date, status, recorded_by, 
  check_in_method, check_out_method, notes,
  created_at, updated_at
)
SELECT 
  student_id, attendance_date, status, recorded_by,
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

-- Insert default global schedule
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

-- Step 7: Create trigger for calculating late minutes
CREATE OR REPLACE FUNCTION public.calculate_late_minutes()
RETURNS TRIGGER AS $$
DECLARE
  schedule_record RECORD;
  late_mins INTEGER := 0;
BEGIN
  IF NEW.check_in_time IS NOT NULL THEN
    -- Find schedule for today
    SELECT * INTO schedule_record
    FROM attendance_schedules
    WHERE day_of_week = EXTRACT(DOW FROM NEW.attendance_date)
    AND is_active = true
    LIMIT 1;
    
    IF FOUND AND NEW.check_in_time > schedule_record.check_in_end THEN
      -- Calculate how many minutes late
      late_mins := EXTRACT(EPOCH FROM (NEW.check_in_time - schedule_record.check_in_end)) / 60;
      NEW.late_minutes := late_mins;
      
      IF late_mins >= schedule_record.late_threshold_minutes THEN
        NEW.status := 'late';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for unified attendance
CREATE TRIGGER trigger_calculate_late_minutes
  BEFORE INSERT OR UPDATE ON public.unified_attendances
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_late_minutes();