
-- First, let's check what the current app_role enum contains and update it to match our needs
DO $$ 
BEGIN
    -- Drop the existing enum if it exists and recreate it with the correct values
    DROP TYPE IF EXISTS public.app_role CASCADE;
    
    CREATE TYPE public.app_role AS ENUM (
        'admin',
        'kepala_sekolah', 
        'tppk',
        'arps',
        'p4gn',
        'koordinator_ekstrakurikuler',
        'wali_kelas',
        'guru_bk',
        'waka_kesiswaan',
        'pelatih_ekstrakurikuler',
        'siswa',
        'orang_tua',
        'penanggung_jawab_sarpras',
        'osis'
    );
END $$;

-- Recreate the user_roles table with the updated enum
DROP TABLE IF EXISTS public.user_roles CASCADE;

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    assigned_by uuid REFERENCES auth.users(id),
    assigned_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true NOT NULL,
    UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY "Admins can manage all user roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin' 
            AND ur.is_active = true
        )
    );

CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());
