
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { NotificationTemplateManager } from '@/components/notifications/NotificationTemplateManager';
import { NotificationChannelManager } from '@/components/notifications/NotificationChannelManager';
import { UserNotificationPreferences } from '@/components/notifications/UserNotificationPreferences';
import { useAuth } from '@/hooks/useAuth';

const NotificationManagement = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  return (
    <AppLayout>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Notifikasi</h1>
            <p className="text-muted-foreground">
              Kelola sistem notifikasi terpusat dengan template dan channel
            </p>
          </div>

          <Tabs defaultValue={isAdmin ? "templates" : "preferences"} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {isAdmin && <TabsTrigger value="templates">Template</TabsTrigger>}
              {isAdmin && <TabsTrigger value="channels">Channel</TabsTrigger>}
              <TabsTrigger value="preferences">Preferensi</TabsTrigger>
            </TabsList>

            {isAdmin && (
              <TabsContent value="templates" className="space-y-4">
                <NotificationTemplateManager />
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value="channels" className="space-y-4">
                <NotificationChannelManager />
              </TabsContent>
            )}

            <TabsContent value="preferences" className="space-y-4">
              <UserNotificationPreferences />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AppLayout>
  );
};

export default NotificationManagement;
