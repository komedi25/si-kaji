
-- Enable RLS untuk case_activities jika belum aktif
ALTER TABLE public.case_activities ENABLE ROW LEVEL SECURITY;

-- Hapus policy yang mungkin sudah ada
DROP POLICY IF EXISTS "Allow case activity creation" ON public.case_activities;
DROP POLICY IF EXISTS "Staff can view case activities" ON public.case_activities;
DROP POLICY IF EXISTS "Users can view case activities" ON public.case_activities;

-- Policy untuk INSERT - izinkan sistem membuat log aktivitas
CREATE POLICY "Allow case activity creation" ON public.case_activities
  FOR INSERT 
  WITH CHECK (true);

-- Policy untuk SELECT - staff dapat melihat semua aktivitas kasus
CREATE POLICY "Staff can view case activities" ON public.case_activities
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'guru_bk', 'tppk', 'arps', 'p4gn', 'waka_kesiswaan')
      AND is_active = true
    )
    OR
    -- User dapat melihat aktivitas kasus mereka sendiri yang non-anonim
    EXISTS (
      SELECT 1 FROM public.student_cases sc
      WHERE sc.id = case_activities.case_id
      AND sc.reported_by = auth.uid()
      AND sc.is_anonymous = false
    )
  );

-- Policy untuk UPDATE - hanya staff yang dapat mengupdate aktivitas
CREATE POLICY "Staff can update case activities" ON public.case_activities
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'guru_bk', 'tppk', 'arps', 'p4gn', 'waka_kesiswaan')
      AND is_active = true
    )
  );

-- Policy untuk DELETE - hanya admin yang dapat menghapus aktivitas
CREATE POLICY "Admin can delete case activities" ON public.case_activities
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND is_active = true
    )
  );
