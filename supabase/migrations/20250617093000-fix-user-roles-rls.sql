
-- Fix the infinite recursion issue in user_roles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create safer RLS policies that don't cause recursion
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Create a simpler admin policy that doesn't reference the same table
CREATE POLICY "Service role can manage all user roles" ON public.user_roles
    FOR ALL USING (
        -- Allow service role or direct user access
        auth.role() = 'service_role' OR 
        user_id = auth.uid()
    );

-- Ensure the admin user has the admin role
INSERT INTO public.user_roles (user_id, role, assigned_by, is_active)
SELECT 
    '5f52a676-a947-42f8-a20e-40b766c11e72'::uuid,
    'admin'::app_role,
    '5f52a676-a947-42f8-a20e-40b766c11e72'::uuid,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = '5f52a676-a947-42f8-a20e-40b766c11e72'::uuid 
    AND role = 'admin'
);
