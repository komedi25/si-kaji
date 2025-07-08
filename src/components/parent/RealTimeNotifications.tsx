import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, BellRing, CheckCircle, AlertTriangle, Award, 
  Calendar, MessageCircle, TrendingUp, X
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ParentNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  priority: string;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  metadata: any;
  created_at: string;
  student_id: string;
}

interface RealTimeNotificationsProps {
  isWidget?: boolean;
  maxHeight?: string;
}

export const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  isWidget = false,
  maxHeight = "400px"
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('parent_notifications')
        .select('*')
        .eq('parent_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(isWidget ? 5 : 50);

      if (error) throw error;

      const notifications = data || [];
      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!user?.id) return;

    const channel = supabase
      .channel('parent-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'parent_notifications',
          filter: `parent_user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as ParentNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('parent_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('parent_user_id', user?.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('parent_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('parent_user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);

      toast({
        title: "Berhasil",
        description: "Semua notifikasi telah ditandai sebagai dibaca"
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'violation':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'achievement':
        return <Award className="h-4 w-4 text-yellow-500" />;
      case 'attendance':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'communication':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'grade':
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'outline' as const,
      medium: 'secondary' as const,
      high: 'default' as const,
      urgent: 'destructive' as const
    };
    
    const labels = {
      low: 'Rendah',
      medium: 'Sedang', 
      high: 'Tinggi',
      urgent: 'Mendesak'
    };

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>
        {labels[priority as keyof typeof labels] || priority}
      </Badge>
    );
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels = {
      violation: 'Pelanggaran',
      achievement: 'Prestasi',
      attendance: 'Kehadiran',
      communication: 'Komunikasi',
      grade: 'Nilai'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <div className="space-y-4">
      {!isWidget && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            <span className="font-semibold">
              Notifikasi Real-time
            </span>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Tandai Semua Dibaca
            </Button>
          )}
        </div>
      )}

      <ScrollArea style={{ maxHeight }}>
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada notifikasi</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 transition-all ${
                  notification.is_read ? 'bg-muted/30' : 'bg-card'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getNotificationTypeLabel(notification.notification_type)}
                          </Badge>
                          {getPriorityBadge(notification.priority)}
                        </div>
                      </div>
                      
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(notification.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                      </span>
                      
                      {notification.action_url && (
                        <Button variant="outline" size="sm">
                          Lihat Detail
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (isWidget) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BellRing className="h-4 w-4" />
            Notifikasi Terbaru
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifikasi Real-time</CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};