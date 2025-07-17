-- Add polygon support for attendance locations
ALTER TABLE attendance_locations 
ADD COLUMN polygon_coordinates JSONB,
ADD COLUMN location_type TEXT DEFAULT 'radius' CHECK (location_type IN ('radius', 'polygon'));

-- Create attendance holidays table for managing school holidays
CREATE TABLE public.attendance_holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  holiday_date DATE NOT NULL UNIQUE,
  holiday_name TEXT NOT NULL,
  holiday_type TEXT NOT NULL DEFAULT 'national' CHECK (holiday_type IN ('national', 'religious', 'school', 'custom')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create global attendance settings table
CREATE TABLE public.attendance_global_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_name TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_global_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for holidays
CREATE POLICY "Everyone can view active holidays"
ON public.attendance_holidays FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin can manage holidays"
ON public.attendance_holidays FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

-- RLS Policies for global settings
CREATE POLICY "Everyone can view active settings"
ON public.attendance_global_settings FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin can manage settings"
ON public.attendance_global_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

-- Insert default global settings
INSERT INTO public.attendance_global_settings (setting_name, setting_value) VALUES
('default_schedule', '{
  "monday": {"check_in_start": "07:00", "check_in_end": "07:30", "check_out_start": "15:30", "check_out_end": "16:00", "late_threshold_minutes": 15},
  "tuesday": {"check_in_start": "07:00", "check_in_end": "07:30", "check_out_start": "15:30", "check_out_end": "16:00", "late_threshold_minutes": 15},
  "wednesday": {"check_in_start": "07:00", "check_in_end": "07:30", "check_out_start": "15:30", "check_out_end": "16:00", "late_threshold_minutes": 15},
  "thursday": {"check_in_start": "07:00", "check_in_end": "07:30", "check_out_start": "15:30", "check_out_end": "16:00", "late_threshold_minutes": 15},
  "friday": {"check_in_start": "07:00", "check_in_end": "07:30", "check_out_start": "15:30", "check_out_end": "16:00", "late_threshold_minutes": 15},
  "saturday": {"is_holiday": true},
  "sunday": {"is_holiday": true}
}'),
('weekend_settings', '{
  "saturday_holiday": true,
  "sunday_holiday": true,
  "auto_weekend_holiday": true
}');

-- Update attendance_locations to support both radius and polygon
COMMENT ON COLUMN attendance_locations.polygon_coordinates IS 'GeoJSON polygon coordinates for complex area shapes';
COMMENT ON COLUMN attendance_locations.location_type IS 'Type of location validation: radius or polygon';

-- Add sample national holidays for Indonesia
INSERT INTO public.attendance_holidays (holiday_date, holiday_name, holiday_type) VALUES
('2025-01-01', 'Tahun Baru Masehi', 'national'),
('2025-02-12', 'Tahun Baru Imlek', 'national'),
('2025-03-29', 'Hari Raya Nyepi', 'national'),
('2025-04-18', 'Wafat Isa Almasih', 'national'),
('2025-05-01', 'Hari Buruh', 'national'),
('2025-05-29', 'Kenaikan Isa Almasih', 'national'),
('2025-06-01', 'Hari Lahir Pancasila', 'national'),
('2025-08-17', 'Hari Kemerdekaan RI', 'national'),
('2025-12-25', 'Hari Raya Natal', 'national');