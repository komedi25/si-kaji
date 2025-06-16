
-- Tabel untuk konfigurasi lokasi sekolah
CREATE TABLE public.attendance_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel untuk konfigurasi jam presensi
CREATE TABLE public.attendance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id),
  day_of_week INTEGER NOT NULL, -- 1=Senin, 2=Selasa, dst
  check_in_start TIME NOT NULL,
  check_in_end TIME NOT NULL,
  check_out_start TIME NOT NULL,
  check_out_end TIME NOT NULL,
  late_threshold_minutes INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel untuk presensi mandiri siswa
CREATE TABLE public.student_self_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id),
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIME,
  check_in_location_id UUID REFERENCES public.attendance_locations(id),
  check_in_latitude DECIMAL(10, 8),
  check_in_longitude DECIMAL(11, 8),
  check_out_time TIME,
  check_out_location_id UUID REFERENCES public.attendance_locations(id),
  check_out_latitude DECIMAL(10, 8),
  check_out_longitude DECIMAL(11, 8),
  status TEXT NOT NULL DEFAULT 'present', -- present, late, absent, early_leave
  notes TEXT,
  violation_created BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, attendance_date)
);

-- Insert data default lokasi SMKN 1 Kendal
INSERT INTO public.attendance_locations (name, latitude, longitude, radius_meters) 
VALUES ('SMKN 1 Kendal', -6.9225, 110.1983, 150);

-- Insert jadwal default untuk hari Senin-Jumat
INSERT INTO public.attendance_schedules (name, day_of_week, check_in_start, check_in_end, check_out_start, check_out_end, late_threshold_minutes)
VALUES 
  ('Jadwal Senin-Kamis', 1, '06:30:00', '07:00:00', '15:00:00', '16:00:00', 15),
  ('Jadwal Senin-Kamis', 2, '06:30:00', '07:00:00', '15:00:00', '16:00:00', 15),
  ('Jadwal Senin-Kamis', 3, '06:30:00', '07:00:00', '15:00:00', '16:00:00', 15),
  ('Jadwal Senin-Kamis', 4, '06:30:00', '07:00:00', '15:00:00', '16:00:00', 15),
  ('Jadwal Jumat', 5, '06:30:00', '07:00:00', '11:00:00', '12:00:00', 15);

-- Function untuk mengecek apakah student berada dalam radius lokasi
CREATE OR REPLACE FUNCTION public.is_within_location_radius(
  student_lat DECIMAL(10, 8),
  student_lng DECIMAL(11, 8),
  location_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  location_record RECORD;
  distance_meters DECIMAL;
BEGIN
  -- Get location data
  SELECT latitude, longitude, radius_meters 
  INTO location_record
  FROM public.attendance_locations 
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
$$;

-- Function untuk membuat pelanggaran otomatis jika terlambat
CREATE OR REPLACE FUNCTION public.create_late_violation_if_needed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  schedule_record RECORD;
  violation_type_id UUID;
  late_minutes INTEGER;
BEGIN
  -- Hanya proses jika check_in_time baru diset
  IF OLD.check_in_time IS NULL AND NEW.check_in_time IS NOT NULL THEN
    
    -- Cari jadwal untuk hari ini
    SELECT * INTO schedule_record
    FROM public.attendance_schedules
    WHERE day_of_week = EXTRACT(DOW FROM NEW.attendance_date)
    AND is_active = true
    LIMIT 1;
    
    IF FOUND AND NEW.check_in_time > schedule_record.check_in_end THEN
      -- Hitung berapa menit terlambat
      late_minutes := EXTRACT(EPOCH FROM (NEW.check_in_time - schedule_record.check_in_end)) / 60;
      
      IF late_minutes >= schedule_record.late_threshold_minutes THEN
        -- Cari violation type untuk keterlambatan
        SELECT id INTO violation_type_id
        FROM public.violation_types
        WHERE name ILIKE '%terlambat%' OR name ILIKE '%telat%'
        AND is_active = true
        LIMIT 1;
        
        -- Jika tidak ada, buat violation type default
        IF NOT FOUND THEN
          INSERT INTO public.violation_types (name, description, category, point_deduction)
          VALUES ('Terlambat Masuk Sekolah', 'Siswa terlambat masuk sekolah lebih dari batas toleransi', 'ringan', 5)
          RETURNING id INTO violation_type_id;
        END IF;
        
        -- Buat violation record
        INSERT INTO public.student_violations (
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
        
        -- Update flag bahwa violation sudah dibuat
        NEW.violation_created := true;
        NEW.status := 'late';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger untuk membuat pelanggaran otomatis
CREATE TRIGGER trigger_create_late_violation
  BEFORE UPDATE ON public.student_self_attendances
  FOR EACH ROW
  EXECUTE FUNCTION public.create_late_violation_if_needed();

-- Enable RLS
ALTER TABLE public.attendance_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_self_attendances ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk attendance_locations
CREATE POLICY "Everyone can view attendance locations" ON public.attendance_locations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage attendance locations" ON public.attendance_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND is_active = true
    )
  );

-- RLS Policies untuk attendance_schedules  
CREATE POLICY "Everyone can view attendance schedules" ON public.attendance_schedules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage attendance schedules" ON public.attendance_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND is_active = true
    )
  );

-- RLS Policies untuk student_self_attendances
CREATE POLICY "Students can view their own self attendance" ON public.student_self_attendances
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert their own self attendance" ON public.student_self_attendances
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own self attendance" ON public.student_self_attendances
  FOR UPDATE USING (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all self attendances" ON public.student_self_attendances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'guru_bk', 'tppk', 'arps', 'p4gn', 'waka_kesiswaan')
      AND is_active = true
    )
  );
