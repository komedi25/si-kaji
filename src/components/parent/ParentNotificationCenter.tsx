
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, AlertCircle, Info, CheckCircle, X, Calendar, Award, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ParentNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  created_at: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'academic' | 'discipline' | 'attendance' | 'achievement' | 'general';
}

export const ParentNotificationCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    
    // Setup real-time notifications
    const channel = supabase
      .channel('parent-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        const newNotification = payload.new as ParentNotification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast for urgent notifications
        if (newNotification.priority === 'urgent') {
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant: newNotification.type === 'error' ? 'destructive' : 'default'
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedNotifications = data.map(notification => ({
        ...notification,
        priority: notification.data?.priority || 'medium',
        category: notification.data?.category || 'general'
      })) as ParentNotification[];

      setNotifications(typedNotifications);
      setUnreadCount(typedNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      urgent: { label: 'Mendesak', variant: 'destructive' as const },
      high: { label: 'Tinggi', variant: 'secondary' as const },
      medium: { label: 'Sedang', variant: 'outline' as const },
      low: { label: 'Rendah', variant: 'outline' as const }
    };
    return <Badge variant={config[priority as keyof typeof config]?.variant}>{config[priority as keyof typeof config]?.label}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return <Calendar className="w-4 h-4" />;
      case 'achievement': return <Award className="w-4 h-4" />;
      case 'discipline': return <AlertTriangle className="w-4 h-4" />;
      case 'attendance': return <Bell className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const filterNotifications = (category?: string) => {
    if (!category) return notifications;
    return notifications.filter(n => n.category === category);
  };

  if (loading) {
    return <div>Memuat notifikasi...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Pusat Notifikasi
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} baru
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Tandai Semua Dibaca
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="academic">Akademik</TabsTrigger>
            <TabsTrigger value="discipline">Disiplin</TabsTrigger>
            <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
            <TabsTrigger value="achievement">Prestasi</TabsTrigger>
            <TabsTrigger value="general">Umum</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada notifikasi
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg ${!notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            {getCategoryIcon(notification.category)}
                            {getPriorityBadge(notification.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {['academic', 'discipline', 'attendance', 'achievement', 'general'].map((category) => (
            <TabsContent key={category} value={category} className="space-y-4 mt-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filterNotifications(category).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg ${!notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            {getPriorityBadge(notification.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
