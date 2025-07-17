-- Add foreign key constraints to unified_attendances
ALTER TABLE public.unified_attendances 
ADD CONSTRAINT fk_unified_attendances_student 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_unified_attendances_student_id ON public.unified_attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_unified_attendances_date ON public.unified_attendances(attendance_date);
CREATE INDEX IF NOT EXISTS idx_unified_attendances_status ON public.unified_attendances(status);