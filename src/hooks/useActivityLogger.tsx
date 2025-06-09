
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ActivityLog {
  user_id?: string;
  activity_type: string;
  description: string;
  page_url?: string;
  metadata?: Record<string, any>;
}

interface ErrorLog {
  user_id?: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  page_url?: string;
  metadata?: Record<string, any>;
}

export function useActivityLogger() {
  const { user } = useAuth();

  const logActivity = async (activity: Omit<ActivityLog, 'user_id'>) => {
    try {
      const { error } = await supabase.rpc('log_activity', {
        p_user_id: user?.id,
        p_activity_type: activity.activity_type,
        p_description: activity.description,
        p_page_url: activity.page_url || window.location.pathname,
        p_metadata: activity.metadata || {}
      });

      if (error) {
        console.error('Failed to log activity:', error);
      }
    } catch (error) {
      console.error('Activity logging error:', error);
    }
  };

  const logError = async (errorLog: Omit<ErrorLog, 'user_id'>) => {
    try {
      const { error } = await supabase.rpc('log_error', {
        p_user_id: user?.id,
        p_error_type: errorLog.error_type,
        p_error_message: errorLog.error_message,
        p_error_stack: errorLog.error_stack,
        p_page_url: errorLog.page_url || window.location.pathname,
        p_metadata: errorLog.metadata || {}
      });

      if (error) {
        console.error('Failed to log error:', error);
      }
    } catch (error) {
      console.error('Error logging error:', error);
    }
  };

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logError({
        error_type: 'javascript_error',
        error_message: event.message,
        error_stack: event.error?.stack,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logError({
        error_type: 'unhandled_promise_rejection',
        error_message: event.reason?.message || 'Unhandled promise rejection',
        error_stack: event.reason?.stack,
        metadata: {
          reason: event.reason
        }
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [user]);

  // Log page navigation
  useEffect(() => {
    logActivity({
      activity_type: 'page_visit',
      description: `User visited ${window.location.pathname}`,
      page_url: window.location.pathname
    });
  }, [window.location.pathname]);

  return {
    logActivity,
    logError
  };
}
