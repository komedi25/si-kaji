
-- 1. Membuat tabel profiles sebagai jembatan antara auth.users dan data aplikasi
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  teacher_id UUID, -- Untuk implementasi role guru di masa depan
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Mengaktifkan Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Membuat RLS policies untuk tabel profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles  
  FOR UPDATE USING (auth.uid() = id);

-- 4. Admins can view and manage all profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.is_active = true
    )
  );

-- 5. Membuat fungsi yang akan dijalankan oleh trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Masukkan baris baru ke tabel profiles
  INSERT INTO public.profiles (id, role, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'siswa'), -- Default ke 'siswa' jika tidak ada role
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Membuat trigger yang memanggil fungsi di atas setelah user baru dibuat
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Membuat fungsi untuk menghubungkan profil dengan data siswa berdasarkan email atau NIS
CREATE OR REPLACE FUNCTION public.link_profile_to_student(profile_id UUID, student_identifier TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  found_student_id UUID;
BEGIN
  -- Cari siswa berdasarkan email atau NIS
  SELECT id INTO found_student_id 
  FROM public.students 
  WHERE email = student_identifier OR nis = student_identifier
  LIMIT 1;
  
  IF found_student_id IS NOT NULL THEN
    -- Update profil dengan student_id yang ditemukan
    UPDATE public.profiles 
    SET student_id = found_student_id, updated_at = NOW()
    WHERE id = profile_id;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
