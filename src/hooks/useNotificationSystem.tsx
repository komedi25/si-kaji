
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
  config: EmailConfig | WhatsAppConfig | SMSConfig | PushConfig;
  is_active: boolean;
}

interface EmailConfig {
  smtp_host?: string;
  smtp_port?: number;
  use_tls?: boolean;
}

interface WhatsAppConfig {
  api_url?: string;
  business_number?: string;
}

interface SMSConfig {
  provider?: string;
  api_key?: string;
}

interface PushConfig {
  fcm_server_key?: string;
  vapid_public_key?: string;
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
      
      const typedTemplates: NotificationTemplate[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        title_template: item.title_template,
        message_template: item.message_template,
        type: item.type as 'info' | 'success' | 'warning' | 'error',
        channels: item.channels,
        variables: Array.isArray(item.variables) ? item.variables : [],
        is_active: item.is_active
      }));
      
      setTemplates(typedTemplates);
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
      
      const typedChannels: NotificationChannel[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        type: item.type as 'email' | 'whatsapp' | 'sms' | 'push',
        config: item.config as any,
        is_active: item.is_active
      }));
      
      setChannels(typedChannels);
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
        .insert({
          name: template.name,
          title_template: template.title_template,
          message_template: template.message_template,
          type: template.type,
          channels: template.channels,
          variables: template.variables,
          is_active: template.is_active
        });

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
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.title_template !== undefined) updateData.title_template = updates.title_template;
      if (updates.message_template !== undefined) updateData.message_template = updates.message_template;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.channels !== undefined) updateData.channels = updates.channels;
      if (updates.variables !== undefined) updateData.variables = updates.variables;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

      const { error } = await supabase
        .from('notification_templates')
        .update(updateData)
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
      const channelData = {
        name: channel.name,
        type: channel.type,
        config: channel.config as any,
        is_active: channel.is_active
      };

      if (channel.id) {
        const { error } = await supabase
          .from('notification_channels')
          .update(channelData)
          .eq('id', channel.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_channels')
          .insert(channelData);
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
