-- Fix unified_attendances table to have proper foreign keys
ALTER TABLE public.unified_attendances 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id);

-- Update existing records to have class_id
UPDATE public.unified_attendances 
SET class_id = se.class_id
FROM public.student_enrollments se
WHERE se.student_id = unified_attendances.student_id 
AND se.status = 'active'
AND unified_attendances.class_id IS NULL;