
-- Hapus semua policy yang ada untuk student_cases
DROP POLICY IF EXISTS "Users can create their own cases" ON public.student_cases;
DROP POLICY IF EXISTS "Allow anonymous case reporting" ON public.student_cases;
DROP POLICY IF EXISTS "Users can view their own cases" ON public.student_cases;
DROP POLICY IF EXISTS "Users can view their own non-anonymous cases" ON public.student_cases;
DROP POLICY IF EXISTS "Staff can manage all cases" ON public.student_cases;
DROP POLICY IF EXISTS "Anyone can report cases" ON public.student_cases;

-- Buat policy INSERT yang sangat sederhana - izinkan semua orang memasukkan data
CREATE POLICY "Allow all case insertions" ON public.student_cases
  FOR INSERT 
  WITH CHECK (true);

-- Buat policy SELECT yang memungkinkan staff melihat semua kasus
CREATE POLICY "Staff can view all cases" ON public.student_cases
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'guru_bk', 'tppk', 'arps', 'p4gn', 'waka_kesiswaan')
      AND is_active = true
    )
    OR 
    -- Izinkan user melihat kasus mereka sendiri yang non-anonim
    (auth.uid() = reported_by AND is_anonymous = false)
    OR
    -- Izinkan semua orang melihat kasus anonim (jika diperlukan untuk tracking)
    is_anonymous = true
  );

-- Policy UPDATE hanya untuk staff
CREATE POLICY "Staff can update cases" ON public.student_cases
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'guru_bk', 'tppk', 'arps', 'p4gn', 'waka_kesiswaan')
      AND is_active = true
    )
  );

-- Policy DELETE hanya untuk admin
CREATE POLICY "Admin can delete cases" ON public.student_cases
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND is_active = true
    )
  );
