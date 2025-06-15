
-- Enable RLS on student_cases table (if not already enabled)
ALTER TABLE public.student_cases ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own cases
CREATE POLICY "Users can create their own cases" ON public.student_cases
  FOR INSERT 
  WITH CHECK (
    auth.uid() = reported_by OR 
    reported_by IS NULL OR 
    is_anonymous = true
  );

-- Allow anonymous case reporting (for public case submission)
CREATE POLICY "Allow anonymous case reporting" ON public.student_cases
  FOR INSERT 
  WITH CHECK (
    reported_by IS NULL OR 
    is_anonymous = true OR
    auth.uid() = reported_by
  );

-- Allow users to view their own submitted cases
CREATE POLICY "Users can view their own cases" ON public.student_cases
  FOR SELECT 
  USING (
    auth.uid() = reported_by OR
    is_anonymous = false
  );

-- Allow staff roles to view and manage all cases
CREATE POLICY "Staff can manage all cases" ON public.student_cases
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'guru_bk', 'tppk', 'arps', 'p4gn', 'waka_kesiswaan')
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'guru_bk', 'tppk', 'arps', 'p4gn', 'waka_kesiswaan')
      AND is_active = true
    )
  );
