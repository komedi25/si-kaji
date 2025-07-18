
import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useNotificationSystem } from './useNotificationSystem';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
  sendNotification: (templateName: string, userId: string, variables?: Record<string, any>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth();
  const { sendNotificationFromTemplate } = useNotificationSystem();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const typedData: Notification[] = (data || []).map(item => ({
        ...item,
        type: item.type as 'info' | 'success' | 'warning' | 'error'
      }));
      
      setNotifications(typedData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const sendNotification = async (templateName: string, userId: string, variables: Record<string, any> = {}) => {
    try {
      await sendNotificationFromTemplate(templateName, userId, variables);
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Prevent multiple subscriptions
      if (isSubscribedRef.current || channelRef.current) {
        return;
      }

      // Subscribe to real-time notifications
      const channel = supabase
        .channel(`use-notifications-${user.id}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('useNotifications received new notification:', payload);
            const newNotification = payload.new as any;
            const typedNotification: Notification = {
              ...newNotification,
              type: newNotification.type as 'info' | 'success' | 'warning' | 'error'
            };
            setNotifications(prev => [typedNotification, ...prev]);
            
            // Show toast notification
            toast(newNotification.title, {
              description: newNotification.message,
              duration: 5000,
            });
          }
        );

      channelRef.current = channel;
      isSubscribedRef.current = true;

      channel.subscribe((status) => {
        console.log('useNotifications subscription status:', status);
        if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          isSubscribedRef.current = false;
        }
      });

      return () => {
        console.log('useNotifications cleanup triggered');
        if (channelRef.current && isSubscribedRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
          isSubscribedRef.current = false;
        }
      };
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
    sendNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
