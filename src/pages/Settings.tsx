
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationChannelManager } from '@/components/notifications/NotificationChannelManager';
import { NotificationTemplateManager } from '@/components/notifications/NotificationTemplateManager';
import { UserNotificationPreferences } from '@/components/notifications/UserNotificationPreferences';
import { AdvancedAnalytics } from '@/components/analytics/AdvancedAnalytics';
import { ActivityLogs } from '@/components/analytics/ActivityLogs';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { ExportSystem } from '@/components/export/ExportSystem';
import { GeneralPreferences } from '@/components/settings/GeneralPreferences';
import { APIKeyManager } from '@/components/ai/APIKeyManager';
import { AIConfiguration } from '@/components/ai/AIConfiguration';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function Settings() {
  const { hasRole } = useAuth();
  const location = useLocation();
  const { logActivity } = useActivityLogger();

  // Log settings page access
  useEffect(() => {
    logActivity({
      activity_type: 'settings_access',
      description: `User accessed settings page: ${location.pathname}`,
      metadata: { section: location.pathname.split('/').pop() || 'main' }
    });
  }, [location.pathname]);

  // Determine which tab to show based on URL path
  const currentPath = location.pathname;
  
  const renderContent = () => {
    if (currentPath === '/settings/notifications') {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pengaturan Notifikasi</h1>
            <p className="text-gray-600">Kelola sistem notifikasi dan preferensi pengguna</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hasRole('admin') && (
              <>
                <NotificationChannelManager />
                <NotificationTemplateManager />
              </>
            )}
            <UserNotificationPreferences />
          </div>
        </div>
      );
    }

    if (currentPath === '/settings/analytics') {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Logs</h1>
            <p className="text-gray-600">Analisis sistem dan monitoring aktivitas</p>
          </div>
          {hasRole('admin') ? (
            <>
              <AdvancedAnalytics />
              <ActivityLogs />
            </>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Akses terbatas untuk administrator</p>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    if (currentPath === '/settings/search') {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Global Search</h1>
            <p className="text-gray-600">Pencarian data di seluruh sistem</p>
          </div>
          <GlobalSearch />
        </div>
      );
    }

    if (currentPath === '/settings/export') {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Export System</h1>
            <p className="text-gray-600">Ekspor data dan laporan</p>
          </div>
          <ExportSystem />
        </div>
      );
    }

    if (currentPath === '/settings/preferences') {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Preferensi</h1>
            <p className="text-gray-600">Pengaturan preferensi pengguna dan sistem</p>
          </div>
          <GeneralPreferences />
        </div>
      );
    }

    if (currentPath === '/settings/ai-keys') {
      if (!hasRole('admin')) {
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API Keys AI</h1>
              <p className="text-gray-600">Akses terbatas untuk administrator</p>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Hanya administrator yang dapat mengakses pengaturan API keys</p>
              </CardContent>
            </Card>
          </div>
        );
      }
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Keys AI</h1>
            <p className="text-gray-600">Kelola API keys untuk layanan AI (Khusus Admin)</p>
          </div>
          <APIKeyManager />
        </div>
      );
    }

    if (currentPath === '/settings/ai-config') {
      if (!hasRole('admin')) {
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Konfigurasi AI</h1>
              <p className="text-gray-600">Akses terbatas untuk administrator</p>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Hanya administrator yang dapat mengakses konfigurasi AI</p>
              </CardContent>
            </Card>
          </div>
        );
      }
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Konfigurasi AI</h1>
            <p className="text-gray-600">Pengaturan provider dan model AI (Khusus Admin)</p>
          </div>
          <AIConfiguration />
        </div>
      );
    }

    // Default settings page
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
          <p className="text-gray-600">Konfigurasi dan pengaturan aplikasi</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hasRole('admin') && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Notifikasi</CardTitle>
                  <CardDescription>Kelola sistem notifikasi</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Atur kanal notifikasi dan template pesan</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics & Logs</CardTitle>
                  <CardDescription>Analisis dan monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Lihat analisis sistem dan log aktivitas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Global Search</CardTitle>
                  <CardDescription>Pencarian menyeluruh</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Cari data di seluruh sistem</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export System</CardTitle>
                  <CardDescription>Ekspor data</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Ekspor laporan dan data sistem</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Keys AI</CardTitle>
                  <CardDescription>Manajemen API keys</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Kelola API keys untuk layanan AI</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Konfigurasi AI</CardTitle>
                  <CardDescription>Pengaturan AI</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Konfigurasi provider dan model AI</p>
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Preferensi</CardTitle>
              <CardDescription>Pengaturan personal</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Atur preferensi aplikasi dan profil</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return <AppLayout>{renderContent()}</AppLayout>;
}
