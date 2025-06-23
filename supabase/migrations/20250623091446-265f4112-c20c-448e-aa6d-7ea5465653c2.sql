
-- Fix RLS policies for master data tables with correct roles
-- Add policies for violation_types table
ALTER TABLE public.violation_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage violation types" ON public.violation_types;
DROP POLICY IF EXISTS "Users can view violation types" ON public.violation_types;

CREATE POLICY "Admin can manage violation types"
ON public.violation_types
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

CREATE POLICY "Users can view violation types"
ON public.violation_types
FOR SELECT
TO authenticated
USING (is_active = true);

-- Add policies for majors table
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage majors" ON public.majors;
DROP POLICY IF EXISTS "Users can view majors" ON public.majors;

CREATE POLICY "Admin can manage majors"
ON public.majors
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

CREATE POLICY "Users can view majors"
ON public.majors
FOR SELECT
TO authenticated
USING (is_active = true);

-- Add policies for achievement_types table
ALTER TABLE public.achievement_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage achievement types" ON public.achievement_types;
DROP POLICY IF EXISTS "Users can view achievement types" ON public.achievement_types;

CREATE POLICY "Admin can manage achievement types"
ON public.achievement_types
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

CREATE POLICY "Users can view achievement types"
ON public.achievement_types
FOR SELECT
TO authenticated
USING (is_active = true);

-- Add policies for school_facilities table
ALTER TABLE public.school_facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage facilities" ON public.school_facilities;
DROP POLICY IF EXISTS "Users can view facilities" ON public.school_facilities;

CREATE POLICY "Admin can manage facilities"
ON public.school_facilities
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'waka_kesiswaan', 'penanggung_jawab_sarpras') 
    AND is_active = true
  )
);

CREATE POLICY "Users can view facilities"
ON public.school_facilities
FOR SELECT
TO authenticated
USING (is_active = true);

-- Update policies for extracurriculars
DROP POLICY IF EXISTS "Admin can manage extracurriculars" ON public.extracurriculars;

CREATE POLICY "Admin can manage extracurriculars"
ON public.extracurriculars
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'waka_kesiswaan', 'koordinator_ekstrakurikuler') 
    AND is_active = true
  )
);

-- Add policies for academic_years
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage academic years" ON public.academic_years;
DROP POLICY IF EXISTS "Users can view academic years" ON public.academic_years;

CREATE POLICY "Admin can manage academic years"
ON public.academic_years
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

CREATE POLICY "Users can view academic years"
ON public.academic_years
FOR SELECT
TO authenticated
USING (true);

-- Add policies for semesters
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage semesters" ON public.semesters;
DROP POLICY IF EXISTS "Users can view semesters" ON public.semesters;

CREATE POLICY "Admin can manage semesters"
ON public.semesters
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

CREATE POLICY "Users can view semesters"
ON public.semesters
FOR SELECT
TO authenticated
USING (true);

-- Add policies for classes table
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Users can view classes" ON public.classes;

CREATE POLICY "Admin can manage classes"
ON public.classes
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

CREATE POLICY "Users can view classes"
ON public.classes
FOR SELECT
TO authenticated
USING (is_active = true);
