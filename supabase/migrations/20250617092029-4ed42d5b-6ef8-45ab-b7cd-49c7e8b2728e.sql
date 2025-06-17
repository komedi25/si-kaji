
-- Fix RLS policies to allow admin to see all users and profiles
-- Drop existing problematic policies on profiles
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create simple and effective policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role to do everything (for system operations)
CREATE POLICY "Service role full access" ON public.profiles
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Special policy for admin user ID to see everything
CREATE POLICY "Admin user can see all profiles" ON public.profiles
  FOR SELECT 
  USING (
    auth.uid() = '5f52a676-a947-42f8-a20e-40b766c11e72'::uuid OR
    auth.uid() = id
  );

-- Allow admin user to update all profiles  
CREATE POLICY "Admin user can update all profiles" ON public.profiles
  FOR UPDATE 
  USING (
    auth.uid() = '5f52a676-a947-42f8-a20e-40b766c11e72'::uuid OR
    auth.uid() = id
  )
  WITH CHECK (
    auth.uid() = '5f52a676-a947-42f8-a20e-40b766c11e72'::uuid OR
    auth.uid() = id
  );

-- Allow admin user to insert profiles
CREATE POLICY "Admin user can insert profiles" ON public.profiles
  FOR INSERT 
  WITH CHECK (
    auth.uid() = '5f52a676-a947-42f8-a20e-40b766c11e72'::uuid OR
    auth.role() = 'service_role'
  );
