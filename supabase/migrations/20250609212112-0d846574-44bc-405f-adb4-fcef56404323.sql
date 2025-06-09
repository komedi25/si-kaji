
-- Create function to log activities
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_description TEXT,
  p_page_url TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, activity_type, description, page_url, metadata)
  VALUES (p_user_id, p_activity_type, p_description, p_page_url, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log errors
CREATE OR REPLACE FUNCTION public.log_error(
  p_user_id UUID,
  p_error_type TEXT,
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.error_logs (user_id, error_type, error_message, error_stack, page_url, metadata)
  VALUES (p_user_id, p_error_type, p_error_message, p_error_stack, p_page_url, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get activity logs
CREATE OR REPLACE FUNCTION public.get_activity_logs(
  since_date TIMESTAMP WITH TIME ZONE,
  limit_count INTEGER DEFAULT 100
) RETURNS TABLE(
  id UUID,
  user_id UUID,
  activity_type TEXT,
  description TEXT,
  page_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    al.activity_type,
    al.description,
    al.page_url,
    al.metadata,
    al.created_at,
    COALESCE(p.full_name, 'Unknown User') as user_name
  FROM public.activity_logs al
  LEFT JOIN public.profiles p ON p.id = al.user_id
  WHERE al.created_at >= since_date
  ORDER BY al.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get error logs
CREATE OR REPLACE FUNCTION public.get_error_logs(
  since_date TIMESTAMP WITH TIME ZONE,
  limit_count INTEGER DEFAULT 100
) RETURNS TABLE(
  id UUID,
  user_id UUID,
  error_type TEXT,
  error_message TEXT,
  error_stack TEXT,
  page_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.id,
    el.user_id,
    el.error_type,
    el.error_message,
    el.error_stack,
    el.page_url,
    el.metadata,
    el.created_at,
    COALESCE(p.full_name, 'Unknown User') as user_name
  FROM public.error_logs el
  LEFT JOIN public.profiles p ON p.id = el.user_id
  WHERE el.created_at >= since_date
  ORDER BY el.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
