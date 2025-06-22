
-- Add RLS policies for extracurriculars table
ALTER TABLE public.extracurriculars ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Admin can manage extracurriculars" ON public.extracurriculars;
DROP POLICY IF EXISTS "Coaches can view their extracurriculars" ON public.extracurriculars;
DROP POLICY IF EXISTS "Students can view active extracurriculars" ON public.extracurriculars;

-- Policy untuk admin dapat melakukan semua operasi
CREATE POLICY "Admin can manage extracurriculars"
ON public.extracurriculars
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'waka_kesiswaan') 
    AND is_active = true
  )
);

-- Policy untuk pelatih dapat melihat ekstrakurikuler yang mereka handle
CREATE POLICY "Coaches can view their extracurriculars"
ON public.extracurriculars
FOR SELECT
TO authenticated
USING (
  coach_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'waka_kesiswaan', 'pelatih_ekstrakurikuler') 
    AND is_active = true
  )
);

-- Policy untuk siswa dapat melihat ekstrakurikuler aktif
CREATE POLICY "Students can view active extracurriculars"
ON public.extracurriculars
FOR SELECT
TO authenticated
USING (
  is_active = true AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'siswa' 
    AND is_active = true
  )
);

-- Add column for registration status
ALTER TABLE public.extracurriculars 
ADD COLUMN IF NOT EXISTS registration_open boolean DEFAULT true;

-- Add RLS policies for student_achievements table
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Students can add their own achievements" ON public.student_achievements;
DROP POLICY IF EXISTS "Students can view their own achievements" ON public.student_achievements;
DROP POLICY IF EXISTS "Teachers can verify achievements" ON public.student_achievements;

-- Policy untuk siswa dapat menambahkan prestasi mereka sendiri
CREATE POLICY "Students can add their own achievements"
ON public.student_achievements
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.user_roles ur ON ur.user_id = s.user_id
    WHERE s.id = student_id 
    AND ur.user_id = auth.uid()
    AND ur.role = 'siswa'
    AND ur.is_active = true
  )
);

-- Policy untuk siswa dapat melihat prestasi mereka sendiri
CREATE POLICY "Students can view their own achievements"
ON public.student_achievements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.user_roles ur ON ur.user_id = s.user_id
    WHERE s.id = student_id 
    AND ur.user_id = auth.uid()
    AND ur.role = 'siswa'
    AND ur.is_active = true
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'wali_kelas', 'guru_bk', 'waka_kesiswaan') 
    AND is_active = true
  )
);

-- Policy untuk wali kelas dan admin dapat memverifikasi prestasi
CREATE POLICY "Teachers can verify achievements"
ON public.student_achievements
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'wali_kelas', 'waka_kesiswaan') 
    AND is_active = true
  )
);

-- Add RLS policies for student_permits table
ALTER TABLE public.student_permits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Students can add their own permits" ON public.student_permits;
DROP POLICY IF EXISTS "Students can view their own permits" ON public.student_permits;
DROP POLICY IF EXISTS "Teachers can manage permits" ON public.student_permits;

-- Policy untuk siswa dapat menambahkan izin mereka sendiri
CREATE POLICY "Students can add their own permits"
ON public.student_permits
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.user_roles ur ON ur.user_id = s.user_id
    WHERE s.id = student_id 
    AND ur.user_id = auth.uid()
    AND ur.role = 'siswa'
    AND ur.is_active = true
  )
);

-- Policy untuk siswa dapat melihat izin mereka sendiri
CREATE POLICY "Students can view their own permits"
ON public.student_permits
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.user_roles ur ON ur.user_id = s.user_id
    WHERE s.id = student_id 
    AND ur.user_id = auth.uid()
    AND ur.role = 'siswa'
    AND ur.is_active = true
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'wali_kelas', 'waka_kesiswaan', 'tppk') 
    AND is_active = true
  )
);

-- Policy untuk wali kelas dan admin dapat mengelola izin
CREATE POLICY "Teachers can manage permits"
ON public.student_permits
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'wali_kelas', 'waka_kesiswaan', 'tppk') 
    AND is_active = true
  )
);

-- Add RLS policies for letter_requests table
ALTER TABLE public.letter_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Students can add their own letter requests" ON public.letter_requests;
DROP POLICY IF EXISTS "Students can view their own letter requests" ON public.letter_requests;
DROP POLICY IF EXISTS "Admin can manage letter requests" ON public.letter_requests;

-- Policy untuk siswa dapat menambahkan permohonan surat mereka sendiri
CREATE POLICY "Students can add their own letter requests"
ON public.letter_requests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.user_roles ur ON ur.user_id = s.user_id
    WHERE s.id = student_id 
    AND ur.user_id = auth.uid()
    AND ur.role = 'siswa'
    AND ur.is_active = true
  )
);

-- Policy untuk siswa dapat melihat permohonan surat mereka sendiri
CREATE POLICY "Students can view their own letter requests"
ON public.letter_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.user_roles ur ON ur.user_id = s.user_id
    WHERE s.id = student_id 
    AND ur.user_id = auth.uid()
    AND ur.role = 'siswa'
    AND ur.is_active = true
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'waka_kesiswaan') 
    AND is_active = true
  )
);

-- Policy untuk admin dapat mengelola permohonan surat
CREATE POLICY "Admin can manage letter requests"
ON public.letter_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'waka_kesiswaan') 
    AND is_active = true
  )
);

-- Add RLS policies for coach_attendances table
ALTER TABLE public.coach_attendances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Coaches can manage their own attendances" ON public.coach_attendances;

-- Policy untuk pelatih dapat mengelola presensi mereka sendiri
CREATE POLICY "Coaches can manage their own attendances"
ON public.coach_attendances
FOR ALL
TO authenticated
USING (
  coach_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'waka_kesiswaan') 
    AND is_active = true
  )
);

-- Add RLS policies for coach_activity_logs table
ALTER TABLE public.coach_activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Coaches can manage their own activity logs" ON public.coach_activity_logs;

-- Policy untuk pelatih dapat mengelola jurnal mereka sendiri
CREATE POLICY "Coaches can manage their own activity logs"
ON public.coach_activity_logs
FOR ALL
TO authenticated
USING (
  coach_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'waka_kesiswaan') 
    AND is_active = true
  )
);

-- Create table for student extracurricular attendances
CREATE TABLE IF NOT EXISTS public.student_extracurricular_attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  extracurricular_id uuid NOT NULL REFERENCES public.extracurriculars(id),
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present',
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(student_id, extracurricular_id, attendance_date)
);

-- Add RLS for student extracurricular attendances
ALTER TABLE public.student_extracurricular_attendances ENABLE ROW LEVEL SECURITY;

-- Policy untuk pelatih dapat mengelola presensi peserta ekstrakurikuler mereka
CREATE POLICY "Coaches can manage their extracurricular student attendances"
ON public.student_extracurricular_attendances
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.extracurriculars e
    WHERE e.id = extracurricular_id 
    AND e.coach_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'waka_kesiswaan') 
    AND is_active = true
  )
);

-- Add period tracking options to homeroom journals
ALTER TABLE public.homeroom_journals 
ADD COLUMN IF NOT EXISTS period_type text DEFAULT 'daily';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_extracurriculars_coach ON public.extracurriculars(coach_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_student ON public.student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_student_permits_student ON public.student_permits(student_id);
CREATE INDEX IF NOT EXISTS idx_letter_requests_student ON public.letter_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_coach_attendances_coach ON public.coach_attendances(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_activity_logs_coach ON public.coach_activity_logs(coach_id);
