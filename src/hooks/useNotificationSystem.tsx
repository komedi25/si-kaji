
import { useEffect, useState, useRef } from 'react';
import { useAuth } from './useAuth';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: any;
}

interface NotificationTemplate {
  id: string;
  name: string;
  title_template: string;
  message_template: string;
  type: 'info' | 'success' | 'warning' | 'error';
  channels: string[];
  variables: any[];
  is_active: boolean;
  created_by?: string;
}

interface NotificationChannel {
  id: string;
  name: string;
  type: string;
  config: any;
  is_active: boolean;
}

interface UserPreference {
  id: string;
  user_id: string;
  notification_type: string;
  channels: string[];
  is_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export function useNotificationSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  // Get notification templates
  const { data: templates = [] } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as NotificationTemplate[];
    },
  });

  // Get notification channels
  const { data: channels = [] } = useQuery({
    queryKey: ['notification-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_channels')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as NotificationChannel[];
    },
  });

  // Get user preferences
  const { data: preferences = [] } = useQuery({
    queryKey: ['user-notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserPreference[];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id || isSubscribedRef.current || channelRef.current) {
      return;
    }

    // Set up real-time subscription for notifications
    const channel = supabase
      .channel(`notification-system-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('useNotificationSystem received new notification:', payload);
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
      );

    channelRef.current = channel;
    isSubscribedRef.current = true;

    channel.subscribe((status) => {
      console.log('useNotificationSystem subscription status:', status);
      if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
        isSubscribedRef.current = false;
      }
    });

    return () => {
      console.log('useNotificationSystem cleanup triggered');
      if (channelRef.current && isSubscribedRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
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
        .eq('role', role as any)
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

  const createTemplate = async (template: Omit<NotificationTemplate, 'id'>) => {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .insert({
          ...template,
          created_by: user?.id
        });

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      return true;
    } catch (error) {
      console.error('Error creating template:', error);
      return false;
    }
  };

  const updateTemplate = async (id: string, template: Partial<NotificationTemplate>) => {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .update(template)
        .eq('id', id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      return true;
    } catch (error) {
      console.error('Error updating template:', error);
      return false;
    }
  };

  const createOrUpdateChannel = async (channelData: Partial<NotificationChannel> & { id?: string }) => {
    try {
      if (!channelData.name || !channelData.type) {
        throw new Error('Channel name and type are required');
      }

      const channelPayload = {
        name: channelData.name,
        type: channelData.type,
        config: channelData.config || {},
        is_active: channelData.is_active !== undefined ? channelData.is_active : true
      };

      if (channelData.id) {
        const { error } = await supabase
          .from('notification_channels')
          .update(channelPayload)
          .eq('id', channelData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_channels')
          .insert(channelPayload);

        if (error) throw error;
      }
      
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
      return true;
    } catch (error) {
      console.error('Error creating/updating channel:', error);
      return false;
    }
  };

  const updatePreference = async (
    notificationType: string,
    channels: string[],
    isEnabled: boolean,
    quietHoursStart?: string,
    quietHoursEnd?: string
  ) => {
    try {
      if (!user?.id) return false;

      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          notification_type: notificationType,
          channels,
          is_enabled: isEnabled,
          quiet_hours_start: quietHoursStart,
          quiet_hours_end: quietHoursEnd
        }, {
          onConflict: 'user_id,notification_type'
        });

      if (error) throw error;
      
      queryClient.invalidateQueries({ 
        queryKey: ['user-notification-preferences', user.id] 
      });
      return true;
    } catch (error) {
      console.error('Error updating preference:', error);
      return false;
    }
  };

  const sendNotificationFromTemplate = async (
    templateName: string,
    userId: string,
    variables: Record<string, any> = {}
  ) => {
    try {
      const template = templates.find(t => t.name === templateName);
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      let title = template.title_template;
      let message = template.message_template;

      // Replace variables in template
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        title = title.replace(new RegExp(placeholder, 'g'), String(value));
        message = message.replace(new RegExp(placeholder, 'g'), String(value));
      });

      return await createNotification(userId, title, message, template.type);
    } catch (error) {
      console.error('Error sending notification from template:', error);
      return false;
    }
  };

  return {
    templates,
    channels,
    preferences,
    createNotification,
    notifyByRole,
    createTemplate,
    updateTemplate,
    createOrUpdateChannel,
    updatePreference,
    sendNotificationFromTemplate
  };
}
