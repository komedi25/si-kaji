
-- 1. Hapus referensi admin_kesiswaan dari enum app_role (jika ada)
-- Cek dan update enum untuk memastikan konsistensi
DO $$ 
BEGIN
    -- Tidak perlu menghapus karena admin_kesiswaan memang tidak ada di enum
    -- Enum sudah benar sesuai dengan REKAP ROLE SYSTEM
    NULL;
END $$;

-- 2. Tambahkan kolom pencatat_id ke tabel student_violations untuk audit trail
ALTER TABLE public.student_violations 
ADD COLUMN IF NOT EXISTS recorded_by uuid REFERENCES auth.users(id);

-- Update existing violations to have recorded_by as system (nullable for existing data)
-- Existing data will remain with NULL recorded_by to indicate system/legacy entries

-- 3. Buat tabel penugasan pelatih ekstrakurikuler untuk mendukung pembatasan akses
CREATE TABLE IF NOT EXISTS public.extracurricular_coaches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    extracurricular_id uuid REFERENCES public.extracurriculars(id) ON DELETE CASCADE NOT NULL,
    coach_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by uuid REFERENCES auth.users(id),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(extracurricular_id, coach_id)
);

-- Enable RLS untuk tabel baru
ALTER TABLE public.extracurricular_coaches ENABLE ROW LEVEL SECURITY;

-- RLS Policy untuk extracurricular_coaches
CREATE POLICY "Coaches can view their assignments" ON public.extracurricular_coaches
    FOR SELECT USING (
        coach_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'koordinator_ekstrakurikuler', 'waka_kesiswaan') 
            AND is_active = true
        )
    );

CREATE POLICY "Coordinators can manage coach assignments" ON public.extracurricular_coaches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'koordinator_ekstrakurikuler', 'waka_kesiswaan') 
            AND is_active = true
        )
    );

-- 4. Update RLS policies untuk attendance management
-- Drop existing policies yang mungkin masih merujuk guru_piket
DROP POLICY IF EXISTS "Teachers can record attendance" ON public.student_attendances;

-- Buat policy baru untuk TPPK (akses semua siswa) dan wali_kelas (hanya siswa perwalian)
CREATE POLICY "TPPK can manage all student attendances" ON public.student_attendances
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'tppk' 
            AND is_active = true
        )
    );

CREATE POLICY "Homeroom teachers can manage their students attendances" ON public.student_attendances
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.classes c ON c.homeroom_teacher_id = auth.uid()
            JOIN public.student_enrollments se ON se.class_id = c.id AND se.status = 'active'
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'wali_kelas' 
            AND ur.is_active = true
            AND se.student_id = student_attendances.student_id
        )
    );

-- 5. Update RLS policies untuk violations dengan audit trail
-- Drop existing policies
DROP POLICY IF EXISTS "Teachers can record violations" ON public.student_violations;

-- Buat policy baru yang lebih spesifik
CREATE POLICY "TPPK and homeroom teachers can record violations" ON public.student_violations
    FOR INSERT WITH CHECK (
        recorded_by = auth.uid() AND (
            -- TPPK dapat mencatat pelanggaran semua siswa
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'tppk' 
                AND is_active = true
            )
            OR
            -- Wali kelas hanya untuk siswa perwaliannya
            EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.classes c ON c.homeroom_teacher_id = auth.uid()
                JOIN public.student_enrollments se ON se.class_id = c.id AND se.status = 'active'
                WHERE ur.user_id = auth.uid() 
                AND ur.role = 'wali_kelas' 
                AND ur.is_active = true
                AND se.student_id = student_violations.student_id
            )
        )
    );

CREATE POLICY "Users can view violations they recorded or manage" ON public.student_violations
    FOR SELECT USING (
        recorded_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'waka_kesiswaan', 'tppk') 
            AND is_active = true
        ) OR
        -- Wali kelas dapat melihat pelanggaran siswa perwaliannya
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.classes c ON c.homeroom_teacher_id = auth.uid()
            JOIN public.student_enrollments se ON se.class_id = c.id AND se.status = 'active'
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'wali_kelas' 
            AND ur.is_active = true
            AND se.student_id = student_violations.student_id
        )
    );

-- 6. Update RLS policies untuk ekstrakurikuler dengan pembatasan pelatih
-- Update existing policy untuk extracurriculars
DROP POLICY IF EXISTS "Coaches can view their extracurriculars" ON public.extracurriculars;

CREATE POLICY "Coaches can view assigned extracurriculars" ON public.extracurriculars
    FOR SELECT USING (
        -- Koordinator dapat melihat semua
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'koordinator_ekstrakurikuler', 'waka_kesiswaan') 
            AND is_active = true
        ) OR
        -- Pelatih hanya yang ditugaskan
        EXISTS (
            SELECT 1 FROM public.extracurricular_coaches ec
            JOIN public.user_roles ur ON ur.user_id = auth.uid()
            WHERE ec.extracurricular_id = extracurriculars.id 
            AND ec.coach_id = auth.uid()
            AND ec.is_active = true
            AND ur.role = 'pelatih_ekstrakurikuler'
            AND ur.is_active = true
        ) OR
        -- Siswa dapat melihat yang aktif
        (is_active = true AND EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'siswa' 
            AND is_active = true
        ))
    );

-- 7. RLS untuk coach_activity_logs dengan pembatasan pelatih
DROP POLICY IF EXISTS "Coaches can manage their activity logs" ON public.coach_activity_logs;
DROP POLICY IF EXISTS "Coaches can manage their own activity logs" ON public.coach_activity_logs;

CREATE POLICY "Coaches can manage logs for assigned extracurriculars" ON public.coach_activity_logs
    FOR ALL USING (
        -- Admin dan koordinator dapat mengelola semua
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'koordinator_ekstrakurikuler', 'waka_kesiswaan') 
            AND is_active = true
        ) OR
        -- Pelatih hanya untuk ekstrakurikuler yang ditugaskan
        (coach_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.extracurricular_coaches ec
            JOIN public.user_roles ur ON ur.user_id = auth.uid()
            WHERE ec.extracurricular_id = coach_activity_logs.extracurricular_id 
            AND ec.coach_id = auth.uid()
            AND ec.is_active = true
            AND ur.role = 'pelatih_ekstrakurikuler'
            AND ur.is_active = true
        ))
    );

-- 8. RLS untuk coach_attendances dengan pembatasan pelatih
DROP POLICY IF EXISTS "Coaches can manage their attendance" ON public.coach_attendances;
DROP POLICY IF EXISTS "Coaches can manage their own attendances" ON public.coach_attendances;

CREATE POLICY "Coaches can manage attendances for assigned extracurriculars" ON public.coach_attendances
    FOR ALL USING (
        -- Admin dan koordinator dapat mengelola semua  
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'koordinator_ekstrakurikuler', 'waka_kesiswaan') 
            AND is_active = true
        ) OR
        -- Pelatih hanya untuk ekstrakurikuler yang ditugaskan
        (coach_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.extracurricular_coaches ec
            JOIN public.user_roles ur ON ur.user_id = auth.uid()
            WHERE ec.extracurricular_id = coach_attendances.extracurricular_id 
            AND ec.coach_id = auth.uid()
            AND ec.is_active = true
            AND ur.role = 'pelatih_ekstrakurikuler'
            AND ur.is_active = true
        ))
    );
