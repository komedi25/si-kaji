-- Create simple global schedule settings that don't require manual setup
-- This simplifies the attendance system by using global defaults

INSERT INTO attendance_global_settings (setting_name, setting_value, is_active) VALUES 
('default_schedule', '{
  "check_in_start": "06:30",
  "check_in_end": "07:30", 
  "check_out_start": "14:00",
  "check_out_end": "15:00",
  "late_threshold_minutes": 15,
  "applies_to_workdays": true
}', true)
ON CONFLICT (setting_name) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
updated_at = now();

-- Enable pg_cron extension for automated absent detection
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily attendance check to run at 15:00 (3 PM) every day
SELECT cron.schedule(
  'daily-attendance-check',
  '0 15 * * *', -- Every day at 15:00
  $$SELECT public.daily_attendance_check();$$
);