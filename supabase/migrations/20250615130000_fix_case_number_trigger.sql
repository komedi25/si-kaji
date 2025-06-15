
-- Fix the ambiguous case_number reference in the trigger function
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  year_part TEXT;
  counter INTEGER;
  case_number TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO counter
  FROM public.student_cases
  WHERE student_cases.case_number LIKE 'CASE/' || year_part || '/%';
  
  case_number := 'CASE/' || year_part || '/' || LPAD(counter::TEXT, 4, '0');
  
  RETURN case_number;
END;
$function$;

-- Update the trigger function to be more explicit
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

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS set_case_number_trigger ON public.student_cases;
CREATE TRIGGER set_case_number_trigger
  BEFORE INSERT ON public.student_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_case_number();
