
-- Drop existing problematic policies on user_roles
DROP POLICY IF EXISTS "Service role can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Allow admins to manage all user roles (insert, update, delete)
CREATE POLICY "Admins can manage all user roles" ON public.user_roles
    FOR ALL USING (
        -- Allow if user is admin
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin' 
            AND ur.is_active = true
        ) OR
        -- Allow service role for system operations
        auth.role() = 'service_role'
    )
    WITH CHECK (
        -- Same check for insert/update operations
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin' 
            AND ur.is_active = true
        ) OR
        auth.role() = 'service_role'
    );
