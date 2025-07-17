-- Merge attendance tables and create unified attendance system
-- This migration consolidates student_attendances and student_self_attendances into a single table

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

-- Step 2: Migrate data from student_self_attendances
INSERT INTO public.unified_attendances (
  student_id, attendance_date, check_in_time, check_out_time,
  status, late_minutes, early_leave_minutes,
  check_in_location_id, check_out_location_id,
  check_in_method, check_out_method, notes, violation_created,
  created_at, updated_at
)
SELECT 
  student_id, attendance_date, check_in_time, check_out_time,
  status, late_minutes, early_leave_minutes,
  check_in_location_id, check_out_location_id,
  'self'::TEXT as check_in_method, 
  'self'::TEXT as check_out_method,
  notes, violation_created,
  created_at, updated_at
FROM public.student_self_attendances
ON CONFLICT (student_id, attendance_date) DO NOTHING;

-- Step 3: Migrate data from student_attendances  
INSERT INTO public.unified_attendances (
  student_id, attendance_date, check_in_time, check_out_time,
  status, late_minutes, early_leave_minutes, recorded_by,
  check_in_method, check_out_method, notes,
  created_at, updated_at
)
SELECT 
  student_id, attendance_date, 
  CASE WHEN status = 'present' THEN '07:00:00+07'::TIME WITH TIME ZONE ELSE NULL END,
  CASE WHEN status = 'present' THEN '14:00:00+07'::TIME WITH TIME ZONE ELSE NULL END,
  status, late_minutes, early_leave_minutes, recorded_by,
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

-- Step 6: Create trigger for automatic late violation detection
CREATE OR REPLACE FUNCTION public.create_late_violation_unified()
RETURNS TRIGGER AS $$
DECLARE
  schedule_record RECORD;
  violation_type_id UUID;
  late_minutes INTEGER;
BEGIN
  -- Only process when check_in_time is newly set
  IF OLD.check_in_time IS NULL AND NEW.check_in_time IS NOT NULL THEN
    
    -- Find schedule for today
    SELECT * INTO schedule_record
    FROM attendance_schedules
    WHERE day_of_week = EXTRACT(DOW FROM NEW.attendance_date)
    AND is_active = true
    LIMIT 1;
    
    IF FOUND AND NEW.check_in_time > schedule_record.check_in_end THEN
      -- Calculate how many minutes late
      late_minutes := EXTRACT(EPOCH FROM (NEW.check_in_time - schedule_record.check_in_end)) / 60;
      
      IF late_minutes >= schedule_record.late_threshold_minutes THEN
        -- Find violation type for lateness
        SELECT id INTO violation_type_id
        FROM violation_types
        WHERE name ILIKE '%terlambat%' OR name ILIKE '%telat%'
        AND is_active = true
        LIMIT 1;
        
        -- If not found, create default violation type
        IF NOT FOUND THEN
          INSERT INTO violation_types (name, description, category, point_deduction)
          VALUES ('Terlambat Masuk Sekolah', 'Siswa terlambat masuk sekolah lebih dari batas toleransi', 'ringan', 5)
          RETURNING id INTO violation_type_id;
        END IF;
        
        -- Create violation record
        INSERT INTO student_violations (
          student_id,
          violation_type_id,
          violation_date,
          description,
          point_deduction,
          reported_by,
          status
        ) VALUES (
          NEW.student_id,
          violation_type_id,
          NEW.attendance_date,
          'Terlambat masuk sekolah ' || late_minutes || ' menit',
          5,
          NEW.recorded_by,
          'active'
        );
        
        -- Mark that violation has been created
        NEW.violation_created := true;
        NEW.status := 'late';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for unified attendance
CREATE TRIGGER trigger_create_late_violation_unified
  BEFORE UPDATE ON public.unified_attendances
  FOR EACH ROW
  EXECUTE FUNCTION public.create_late_violation_unified();

-- Step 7: Update attendance_schedules to support global settings
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

-- Step 8: Insert default holidays
INSERT INTO public.attendance_holidays (holiday_name, holiday_date, holiday_type, is_active) VALUES 
('Tahun Baru Masehi', '2025-01-01', 'national', true),
('Isra Miraj', '2025-01-27', 'religious', true),
('Tahun Baru Imlek', '2025-01-29', 'religious', true),
('Hari Raya Nyepi', '2025-03-29', 'religious', true),
('Wafat Isa Almasih', '2025-04-18', 'religious', true),
('Hari Buruh', '2025-05-01', 'national', true),
('Kenaikan Isa Almasih', '2025-05-29', 'religious', true),
('Hari Lahir Pancasila', '2025-06-01', 'national', true),
('Idul Fitri', '2025-03-31', 'religious', true),
('Idul Fitri', '2025-04-01', 'religious', true),
('Hari Kemerdekaan RI', '2025-08-17', 'national', true),
('Idul Adha', '2025-06-07', 'religious', true),
('Tahun Baru Hijriah', '2025-06-27', 'religious', true),
('Maulid Nabi Muhammad', '2025-09-05', 'religious', true),
('Hari Natal', '2025-12-25', 'religious', true)
ON CONFLICT DO NOTHING;

-- Step 9: Insert global attendance settings
INSERT INTO public.attendance_global_settings (setting_name, setting_value, is_active) VALUES 
(
  'weekend_policy', 
  '{
    "saturday_off": true,
    "sunday_off": true,
    "auto_mark_weekend": true,
    "allow_weekend_override": false
  }'::jsonb,
  true
),
(
  'location_validation',
  '{
    "require_location": true,
    "allow_manual_override": true,
    "strict_mode": false,
    "fallback_to_manual": true
  }'::jsonb,
  true
),
(
  'notification_settings',
  '{
    "notify_parents_absent": true,
    "notify_parents_late": true,
    "daily_summary": true,
    "weekly_report": false
  }'::jsonb,
  true
)
ON CONFLICT (setting_name) DO NOTHING;