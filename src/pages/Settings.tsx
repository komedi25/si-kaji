
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationTemplateManager } from '@/components/notifications/NotificationTemplateManager';
import { NotificationChannelManager } from '@/components/notifications/NotificationChannelManager';
import { UserNotificationPreferences } from '@/components/notifications/UserNotificationPreferences';
import { AdvancedAnalytics } from '@/components/analytics/AdvancedAnalytics';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { ExportSystem } from '@/components/export/ExportSystem';

const Settings = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings & Advanced Features</h1>
          <p className="text-muted-foreground">
            Manage system settings, notifications, analytics, and advanced features
          </p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="search">Global Search</TabsTrigger>
            <TabsTrigger value="export">Export System</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            <div className="grid gap-6">
              <NotificationTemplateManager />
              <NotificationChannelManager />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <GlobalSearch />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <ExportSystem />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <UserNotificationPreferences />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
