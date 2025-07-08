import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, Search, Filter, CheckCircle, Circle, 
  Mail, MessageCircle, Smartphone, Monitor
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  data?: any;
}

interface QueuedNotification {
  id: string;
  notification_id: string;
  channel_type: string;
  recipient: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  notifications?: {
    title: string;
    message: string;
    type: string;
  };
}

export const NotificationHistory = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [queuedNotifications, setQueuedNotifications] = useState<QueuedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      fetchQueuedNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchQueuedNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select(`
          *,
          notifications:notification_id (
            title,
            message,
            type
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setQueuedNotifications(data || []);
    } catch (error) {
      console.error('Error fetching queued notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <Bell className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'whatsapp':
      case 'sms':
        return <MessageCircle className="h-4 w-4" />;
      case 'push':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesRead = filterRead === 'all' || 
                       (filterRead === 'read' && notification.read) ||
                       (filterRead === 'unread' && !notification.read);
    
    return matchesSearch && matchesType && matchesRead;
  });

  const filteredQueuedNotifications = queuedNotifications.filter(notification => {
    const matchesSearch = notification.notifications?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.notifications?.message?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Riwayat Notifikasi
          </CardTitle>
          <Button size="sm" onClick={markAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Tandai Semua Dibaca
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari notifikasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRead} onValueChange={setFilterRead}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="read">Dibaca</SelectItem>
              <SelectItem value="unread">Belum Dibaca</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">Notifikasi Diterima</TabsTrigger>
            <TabsTrigger value="sent">Status Pengiriman</TabsTrigger>
          </TabsList>
          
          <TabsContent value="received" className="space-y-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Tidak ada notifikasi ditemukan</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`border rounded-lg p-4 transition-all cursor-pointer ${
                        notification.read ? 'bg-muted/30' : 'bg-card'
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-sm">
                                {notification.title}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className={`text-xs mt-1 ${
                                  notification.type === 'success' ? 'border-green-500 text-green-700' :
                                  notification.type === 'warning' ? 'border-yellow-500 text-yellow-700' :
                                  notification.type === 'error' ? 'border-red-500 text-red-700' :
                                  'border-blue-500 text-blue-700'
                                }`}
                              >
                                {notification.type}
                              </Badge>
                            </div>
                            
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="sent" className="space-y-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredQueuedNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Tidak ada notifikasi terkirim</p>
                  </div>
                ) : (
                  filteredQueuedNotifications.map((queuedNotification) => (
                    <div key={queuedNotification.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getChannelIcon(queuedNotification.channel_type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-sm">
                                {queuedNotification.notifications?.title || 'Notifikasi'}
                              </h4>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {queuedNotification.channel_type}
                                </Badge>
                                <Badge className={`text-xs ${getStatusColor(queuedNotification.status)}`}>
                                  {queuedNotification.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            Ke: {queuedNotification.recipient}
                          </p>
                          
                          {queuedNotification.error_message && (
                            <p className="text-sm text-red-600 mb-2">
                              Error: {queuedNotification.error_message}
                            </p>
                          )}
                          
                          <span className="text-xs text-muted-foreground">
                            {queuedNotification.sent_at 
                              ? format(new Date(queuedNotification.sent_at), 'dd MMM yyyy HH:mm', { locale: id })
                              : format(new Date(queuedNotification.created_at), 'dd MMM yyyy HH:mm', { locale: id })
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};