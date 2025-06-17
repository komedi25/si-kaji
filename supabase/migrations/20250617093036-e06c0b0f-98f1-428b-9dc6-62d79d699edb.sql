
-- First, create a security definer function to check admin role safely
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 
    AND role = 'admin' 
    AND is_active = true
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create policies that use the security definer function
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user roles" ON public.user_roles
    FOR SELECT USING (
        public.is_admin(auth.uid()) OR 
        user_id = auth.uid() OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Admins can insert user roles" ON public.user_roles
    FOR INSERT WITH CHECK (
        public.is_admin(auth.uid()) OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Admins can update user roles" ON public.user_roles
    FOR UPDATE USING (
        public.is_admin(auth.uid()) OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Admins can delete user roles" ON public.user_roles
    FOR DELETE USING (
        public.is_admin(auth.uid()) OR
        auth.role() = 'service_role'
    );
