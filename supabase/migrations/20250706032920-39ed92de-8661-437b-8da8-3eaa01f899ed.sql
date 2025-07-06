
-- Create a simple RPC function to find student by email
CREATE OR REPLACE FUNCTION find_student_by_email(email_param TEXT)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  nis TEXT,
  full_name TEXT,
  email TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    s.id,
    s.user_id,
    s.nis,
    s.full_name,
    s.email,
    s.status,
    s.created_at
  FROM students s
  WHERE s.email = email_param
  LIMIT 1;
$$;
