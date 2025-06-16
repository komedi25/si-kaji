
-- Create attendance locations table for setting coordinate points
CREATE TABLE IF NOT EXISTS attendance_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude NUMERIC(10,8) NOT NULL,
  longitude NUMERIC(11,8) NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance schedules table for setting time limits
CREATE TABLE IF NOT EXISTS attendance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  check_in_start TIME NOT NULL,
  check_in_end TIME NOT NULL,
  check_out_start TIME NOT NULL,
  check_out_end TIME NOT NULL,
  late_threshold_minutes INTEGER NOT NULL DEFAULT 15,
  class_id UUID REFERENCES classes(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student self attendance table
CREATE TABLE IF NOT EXISTS student_self_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIME,
  check_in_latitude NUMERIC(10,8),
  check_in_longitude NUMERIC(11,8),
  check_in_location_id UUID REFERENCES attendance_locations(id),
  check_out_time TIME,
  check_out_latitude NUMERIC(10,8),
  check_out_longitude NUMERIC(11,8),
  check_out_location_id UUID REFERENCES attendance_locations(id),
  status TEXT NOT NULL DEFAULT 'present',
  notes TEXT,
  violation_created BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, attendance_date)
);

-- Function to check if student is within location radius
CREATE OR REPLACE FUNCTION is_within_location_radius(
  student_lat NUMERIC,
  student_lng NUMERIC,
  location_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  location_record RECORD;
  distance_meters DECIMAL;
BEGIN
  -- Get location data
  SELECT latitude, longitude, radius_meters 
  INTO location_record
  FROM attendance_locations 
  WHERE id = location_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Calculate distance using Haversine formula (simplified)
  -- This is an approximation, for production use PostGIS
  distance_meters := (
    6371000 * acos(
      cos(radians(location_record.latitude)) * 
      cos(radians(student_lat)) * 
      cos(radians(student_lng) - radians(location_record.longitude)) + 
      sin(radians(location_record.latitude)) * 
      sin(radians(student_lat))
    )
  );
  
  RETURN distance_meters <= location_record.radius_meters;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create violation for late attendance
CREATE OR REPLACE FUNCTION create_late_violation_if_needed()
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
          'Terlambat masuk sekolah ' || late_minutes || ' menit (presensi mandiri)',
          5,
          NULL, -- System generated
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

-- Create trigger for automatic violation creation
DROP TRIGGER IF EXISTS trigger_create_late_violation ON student_self_attendances;
CREATE TRIGGER trigger_create_late_violation
  BEFORE UPDATE ON student_self_attendances
  FOR EACH ROW
  EXECUTE FUNCTION create_late_violation_if_needed();

-- Enable RLS on new tables
ALTER TABLE attendance_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_self_attendances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance_locations
CREATE POLICY "Everyone can view active locations" ON attendance_locations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage locations" ON attendance_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- RLS Policies for attendance_schedules
CREATE POLICY "Everyone can view active schedules" ON attendance_schedules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage schedules" ON attendance_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- RLS Policies for student_self_attendances
CREATE POLICY "Students can view their own attendance" ON student_self_attendances
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert their own attendance" ON student_self_attendances
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own attendance" ON student_self_attendances
  FOR UPDATE USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers and admins can view all attendance" ON student_self_attendances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'wali_kelas', 'guru_bk', 'tppk', 'arps') 
      AND is_active = true
    )
  );

-- Insert default location for SMKN 1 Kendal
INSERT INTO attendance_locations (name, latitude, longitude, radius_meters) 
VALUES ('SMKN 1 Kendal', -6.9174639, 110.2024914, 100);

-- Insert default schedule
INSERT INTO attendance_schedules (name, day_of_week, check_in_start, check_in_end, check_out_start, check_out_end, late_threshold_minutes)
VALUES 
('Senin - Kamis', 1, '06:30:00', '07:00:00', '15:00:00', '16:00:00', 15),
('Senin - Kamis', 2, '06:30:00', '07:00:00', '15:00:00', '16:00:00', 15),
('Senin - Kamis', 3, '06:30:00', '07:00:00', '15:00:00', '16:00:00', 15),
('Senin - Kamis', 4, '06:30:00', '07:00:00', '15:00:00', '16:00:00', 15),
('Jumat', 5, '06:30:00', '07:00:00', '11:00:00', '12:00:00', 15);
