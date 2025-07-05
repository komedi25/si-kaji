
-- Drop the old trigger and function if they exist, to be safe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- Ensure the 'profiles' table has the correct columns.
-- This adds columns if they don't exist.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS teacher_id UUID,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Re-create the function to handle new users correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'siswa'),
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger on the auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add the missing 'link_profile_to_student' function
CREATE OR REPLACE FUNCTION public.link_profile_to_student(profile_id UUID, student_identifier TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  found_student_id UUID;
BEGIN
  -- Find the student_id based on email or NIS
  SELECT id INTO found_student_id 
  FROM public.students 
  WHERE email = student_identifier OR nis = student_identifier
  LIMIT 1;
  
  IF found_student_id IS NOT NULL THEN
    -- Update the profile with the found student_id
    UPDATE public.profiles 
    SET student_id = found_student_id, updated_at = NOW()
    WHERE id = profile_id;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
