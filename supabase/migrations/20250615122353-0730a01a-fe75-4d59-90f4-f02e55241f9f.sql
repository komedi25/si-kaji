
-- Fix the case number generation trigger to avoid ambiguous column reference
DROP TRIGGER IF EXISTS set_case_number_trigger ON public.student_cases;

-- Update the function to be more explicit about column references
CREATE OR REPLACE FUNCTION public.set_case_number()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.case_number IS NULL OR NEW.case_number = '' THEN
    NEW.case_number := public.generate_case_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER set_case_number_trigger
  BEFORE INSERT ON public.student_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_case_number();
