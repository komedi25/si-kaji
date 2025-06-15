
-- Drop existing policies to recreate them with correct logic
DROP POLICY IF EXISTS "Users can create their own cases" ON public.student_cases;
DROP POLICY IF EXISTS "Allow anonymous case reporting" ON public.student_cases;
DROP POLICY IF EXISTS "Users can view their own cases" ON public.student_cases;
DROP POLICY IF EXISTS "Staff can manage all cases" ON public.student_cases;

-- Create a simplified and correct policy for case insertion
-- This allows anyone (authenticated or not) to insert cases
CREATE POLICY "Anyone can report cases" ON public.student_cases
  FOR INSERT 
  WITH CHECK (true);

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

-- Allow users to view their own submitted cases (only non-anonymous ones)
CREATE POLICY "Users can view their own non-anonymous cases" ON public.student_cases
  FOR SELECT 
  USING (
    auth.uid() = reported_by AND is_anonymous = false
  );
