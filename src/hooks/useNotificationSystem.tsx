
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface NotificationTemplate {
  id: string;
  name: string;
  title_template: string;
  message_template: string;
  type: 'info' | 'success' | 'warning' | 'error';
  channels: string[];
  variables: any[];
  is_active: boolean;
}

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'sms' | 'push';
  config: any;
  is_active: boolean;
}

interface UserNotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  channels: string[];
  is_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export const useNotificationSystem = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [preferences, setPreferences] = useState<UserNotificationPreference[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch notification templates
  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // Fetch notification channels
  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_channels')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  // Fetch user preferences
  const fetchPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setPreferences(data || []);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  // Send notification using template
  const sendNotificationFromTemplate = async (
    templateName: string,
    userId: string,
    variables: Record<string, any> = {},
    customChannels?: string[]
  ) => {
    try {
      const template = templates.find(t => t.name === templateName);
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      // Replace variables in title and message
      let title = template.title_template;
      let message = template.message_template;
      
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        title = title.replace(new RegExp(placeholder, 'g'), value);
        message = message.replace(new RegExp(placeholder, 'g'), value);
      });

      const channelsToUse = customChannels || template.channels;

      // Call the database function to send multi-channel notification
      const { data, error } = await supabase.rpc('send_multi_channel_notification', {
        _user_id: userId,
        _title: title,
        _message: message,
        _type: template.type,
        _data: { template_name: templateName, variables },
        _channels: channelsToUse
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  };

  // Update user preferences
  const updatePreference = async (
    notificationType: string,
    channels: string[],
    isEnabled: boolean = true,
    quietHoursStart?: string,
    quietHoursEnd?: string
  ) => {
    if (!user) return;

    try {
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
      
      toast.success('Preferensi notifikasi berhasil diperbarui');
      fetchPreferences();
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Gagal memperbarui preferensi notifikasi');
    }
  };

  // Create new template (admin only)
  const createTemplate = async (template: Omit<NotificationTemplate, 'id'>) => {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .insert(template);

      if (error) throw error;
      
      toast.success('Template notifikasi berhasil dibuat');
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Gagal membuat template notifikasi');
    }
  };

  // Update template (admin only)
  const updateTemplate = async (id: string, updates: Partial<NotificationTemplate>) => {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Template notifikasi berhasil diperbarui');
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Gagal memperbarui template notifikasi');
    }
  };

  // Create/update channel (admin only)
  const createOrUpdateChannel = async (channel: Omit<NotificationChannel, 'id'> & { id?: string }) => {
    try {
      if (channel.id) {
        const { error } = await supabase
          .from('notification_channels')
          .update(channel)
          .eq('id', channel.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_channels')
          .insert(channel);
        if (error) throw error;
      }
      
      toast.success(`Channel notifikasi berhasil ${channel.id ? 'diperbarui' : 'dibuat'}`);
      fetchChannels();
    } catch (error) {
      console.error('Error saving channel:', error);
      toast.error('Gagal menyimpan channel notifikasi');
    }
  };

  useEffect(() => {
    if (user) {
      fetchTemplates();
      fetchChannels();
      fetchPreferences();
    }
  }, [user]);

  return {
    templates,
    channels,
    preferences,
    loading,
    sendNotificationFromTemplate,
    updatePreference,
    createTemplate,
    updateTemplate,
    createOrUpdateChannel,
    fetchTemplates,
    fetchChannels,
    fetchPreferences
  };
};
