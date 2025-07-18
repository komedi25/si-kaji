-- Create function to auto-generate absent records for students who didn't check in
CREATE OR REPLACE FUNCTION auto_generate_absent_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_date_local DATE := CURRENT_DATE;
  day_of_week INTEGER := EXTRACT(DOW FROM current_date_local);
  student_record RECORD;
  schedule_exists BOOLEAN;
BEGIN
  -- Skip weekends (Saturday = 6, Sunday = 0)
  IF day_of_week = 0 OR day_of_week = 6 THEN
    RETURN;
  END IF;
  
  -- Skip holidays
  IF EXISTS (
    SELECT 1 FROM attendance_holidays 
    WHERE holiday_date = current_date_local AND is_active = true
  ) THEN
    RETURN;
  END IF;
  
  -- Check if there's an active global schedule for today
  SELECT EXISTS (
    SELECT 1 FROM attendance_schedules 
    WHERE day_of_week = day_of_week 
    AND applies_to_all_classes = true 
    AND is_active = true
  ) INTO schedule_exists;
  
  -- Only proceed if there's a global schedule
  IF NOT schedule_exists THEN
    RETURN;
  END IF;
  
  -- Generate absent records for students who haven't checked in
  FOR student_record IN
    SELECT DISTINCT s.id as student_id, se.class_id
    FROM students s
    JOIN student_enrollments se ON se.student_id = s.id 
    WHERE se.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM unified_attendances ua
      WHERE ua.student_id = s.id 
      AND ua.attendance_date = current_date_local
    )
  LOOP
    INSERT INTO unified_attendances (
      student_id, 
      attendance_date, 
      status, 
      class_id,
      check_in_method,
      notes
    ) VALUES (
      student_record.student_id,
      current_date_local,
      'absent',
      student_record.class_id,
      'auto_generated',
      'Auto-generated: Tidak ada presensi tercatat'
    );
  END LOOP;
END;
$$;

-- Create a function to be called daily to check and generate absent records
CREATE OR REPLACE FUNCTION daily_attendance_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only run after 15:00 (3 PM) to ensure all check-ins are recorded
  IF EXTRACT(HOUR FROM NOW()) >= 15 THEN
    PERFORM auto_generate_absent_records();
  END IF;
END;
$$;