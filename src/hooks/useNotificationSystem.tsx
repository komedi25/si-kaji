
import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: any;
}

export function useNotificationSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    // Set up real-time subscription for notifications
    const channel = supabase
      .channel(`notifications:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as NotificationData;
          
          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant: newNotification.type === 'error' ? 'destructive' : 'default',
          });

          // Invalidate notifications query to refresh the list
          queryClient.invalidateQueries({ 
            queryKey: ['notifications', user.id] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast, queryClient]);

  // Function to create a notification
  const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    data?: any
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          data,
          read: false
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  };

  // Function to send notifications to multiple users by role
  const notifyByRole = async (
    role: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    data?: any
  ) => {
    try {
      // Get users with the specified role
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', role)
        .eq('is_active', true);

      if (error) throw error;

      if (userRoles && userRoles.length > 0) {
        // Create notifications for all users with the role
        const notifications = userRoles.map(ur => ({
          user_id: ur.user_id,
          title,
          message,
          type,
          data,
          read: false
        }));

        const { error: insertError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error('Error sending notifications by role:', error);
      return false;
    }
  };

  return {
    createNotification,
    notifyByRole
  };
}
