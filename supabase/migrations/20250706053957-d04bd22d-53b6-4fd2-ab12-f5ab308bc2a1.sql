
-- Update counseling_sessions table to add missing fields and improve structure
ALTER TABLE public.counseling_sessions 
ADD COLUMN IF NOT EXISTS booking_status text DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS student_phone text,
ADD COLUMN IF NOT EXISTS parent_notification_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS session_location text DEFAULT 'Ruang BK',
ADD COLUMN IF NOT EXISTS is_emergency boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS referred_from text,
ADD COLUMN IF NOT EXISTS session_outcome text,
ADD COLUMN IF NOT EXISTS next_session_scheduled boolean DEFAULT false;

-- Create counseling_schedules table for managing BK teacher availability
CREATE TABLE IF NOT EXISTS public.counseling_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  counselor_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  max_sessions_per_slot integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(counselor_id, day_of_week, start_time)
);

-- Create counseling_bookings table for better booking management
CREATE TABLE IF NOT EXISTS public.counseling_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id),
  counselor_id uuid NOT NULL,
  requested_date date NOT NULL,
  requested_time time NOT NULL,
  priority_level text DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
  booking_reason text NOT NULL,
  student_notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  confirmed_at timestamp with time zone,
  session_id uuid REFERENCES public.counseling_sessions(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create counseling_session_notes table for encrypted notes
CREATE TABLE IF NOT EXISTS public.counseling_session_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.counseling_sessions(id) ON DELETE CASCADE,
  note_type text NOT NULL CHECK (note_type IN ('assessment', 'intervention', 'progress', 'referral', 'follow_up')),
  encrypted_content text NOT NULL,
  encryption_key_hint text,
  created_by uuid NOT NULL,
  is_confidential boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create counseling_referrals table for integration with violations/achievements
CREATE TABLE IF NOT EXISTS public.counseling_referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id),
  referred_by uuid NOT NULL,
  referral_type text NOT NULL CHECK (referral_type IN ('violation', 'achievement', 'academic', 'behavioral', 'personal', 'family')),
  reference_id uuid, -- Links to violation_id, achievement_id, or case_id
  urgency_level text DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'critical')),
  referral_reason text NOT NULL,
  recommended_sessions integer DEFAULT 1,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'declined')),
  assigned_counselor uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies for counseling_schedules
ALTER TABLE public.counseling_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Counselors can manage their own schedules" 
ON public.counseling_schedules 
FOR ALL 
USING (counselor_id = auth.uid() OR EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'waka_kesiswaan', 'guru_bk') 
  AND is_active = true
));

CREATE POLICY "Students can view counselor schedules" 
ON public.counseling_schedules 
FOR SELECT 
USING (is_active = true AND EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role = 'siswa' 
  AND is_active = true
));

-- Add RLS policies for counseling_bookings
ALTER TABLE public.counseling_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own bookings" 
ON public.counseling_bookings 
FOR ALL 
USING (student_id IN (
  SELECT id FROM students WHERE user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'waka_kesiswaan', 'guru_bk') 
  AND is_active = true
));

CREATE POLICY "Counselors can view their assigned bookings" 
ON public.counseling_bookings 
FOR SELECT 
USING (counselor_id = auth.uid() OR EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'waka_kesiswaan', 'guru_bk') 
  AND is_active = true
));

-- Add RLS policies for counseling_session_notes
ALTER TABLE public.counseling_session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only counselors can access session notes" 
ON public.counseling_session_notes 
FOR ALL 
USING (created_by = auth.uid() OR EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'guru_bk') 
  AND is_active = true
));

-- Add RLS policies for counseling_referrals
ALTER TABLE public.counseling_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrals can be managed by authorized users" 
ON public.counseling_referrals 
FOR ALL 
USING (referred_by = auth.uid() OR assigned_counselor = auth.uid() OR EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'waka_kesiswaan', 'guru_bk', 'wali_kelas', 'tppk') 
  AND is_active = true
));

-- Create function to automatically create referrals from violations
CREATE OR REPLACE FUNCTION create_counseling_referral_from_violation()
RETURNS TRIGGER AS $$
DECLARE
  violation_count integer;
  counselor_id uuid;
BEGIN
  -- Count active violations for this student
  SELECT COUNT(*) INTO violation_count
  FROM student_violations 
  WHERE student_id = NEW.student_id AND status = 'active';
  
  -- Auto-refer if student has 3+ violations
  IF violation_count >= 3 THEN
    -- Find available BK counselor
    SELECT user_id INTO counselor_id
    FROM user_roles 
    WHERE role = 'guru_bk' AND is_active = true 
    LIMIT 1;
    
    -- Create referral
    INSERT INTO counseling_referrals (
      student_id, referred_by, referral_type, reference_id,
      urgency_level, referral_reason, assigned_counselor
    ) VALUES (
      NEW.student_id, COALESCE(NEW.recorded_by, auth.uid()), 'violation', NEW.id,
      CASE WHEN violation_count >= 5 THEN 'critical' ELSE 'high' END,
      'Siswa memiliki ' || violation_count || ' pelanggaran aktif dan memerlukan bimbingan konseling',
      counselor_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-referral
DROP TRIGGER IF EXISTS trigger_auto_referral_violation ON student_violations;
CREATE TRIGGER trigger_auto_referral_violation
  AFTER INSERT ON student_violations
  FOR EACH ROW EXECUTE FUNCTION create_counseling_referral_from_violation();

-- Update counseling_sessions RLS policies
DROP POLICY IF EXISTS "Counselors can manage their sessions" ON public.counseling_sessions;
DROP POLICY IF EXISTS "Students can view their sessions" ON public.counseling_sessions;

ALTER TABLE public.counseling_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Counselors can manage all counseling sessions" 
ON public.counseling_sessions 
FOR ALL 
USING (counselor_id = auth.uid() OR EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'waka_kesiswaan', 'guru_bk') 
  AND is_active = true
));

CREATE POLICY "Students can view their own counseling sessions" 
ON public.counseling_sessions 
FOR SELECT 
USING (student_id IN (
  SELECT id FROM students WHERE user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'waka_kesiswaan', 'guru_bk', 'wali_kelas') 
  AND is_active = true
));
