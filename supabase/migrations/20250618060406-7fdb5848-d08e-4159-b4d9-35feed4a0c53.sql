
-- Enable RLS on classes table if not already enabled
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admin users to insert classes
CREATE POLICY "Admin can insert classes" ON public.classes
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

-- Create policy to allow admin users to select/view classes
CREATE POLICY "Admin can view classes" ON public.classes
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

-- Create policy to allow admin users to update classes
CREATE POLICY "Admin can update classes" ON public.classes
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

-- Create policy to allow admin users to delete classes
CREATE POLICY "Admin can delete classes" ON public.classes
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);
