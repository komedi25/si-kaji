
DROP FUNCTION IF EXISTS public.get_recent_ai_activities(integer);

CREATE OR REPLACE FUNCTION public.get_recent_ai_activities(limit_count integer)
 RETURNS TABLE(id uuid, task_type text, created_at timestamp with time zone, user_name text, provider text, tokens_used integer)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT
    l.id,
    l.task_type,
    l.created_at,
    COALESCE(p.full_name, 'Unknown User') as user_name,
    l.provider,
    l.tokens_used
  FROM public.ai_usage_logs l
  LEFT JOIN public.profiles p ON p.id = l.user_id
  ORDER BY l.created_at DESC
  LIMIT limit_count;
$function$
