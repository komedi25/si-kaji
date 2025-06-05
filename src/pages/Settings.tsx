
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationTemplateManager } from '@/components/notifications/NotificationTemplateManager';
import { NotificationChannelManager } from '@/components/notifications/NotificationChannelManager';
import { UserNotificationPreferences } from '@/components/notifications/UserNotificationPreferences';
import { AdvancedAnalytics } from '@/components/analytics/AdvancedAnalytics';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { ExportSystem } from '@/components/export/ExportSystem';

const Settings = () => {
  const location = useLocation();
  
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path === '/settings/notifications') return 'notifications';
    if (path === '/settings/analytics') return 'analytics';
    if (path === '/settings/search') return 'search';
    if (path === '/settings/export') return 'export';
    if (path === '/settings/preferences') return 'preferences';
    return 'overview';
  };

  const currentSection = getCurrentSection();

  const renderContent = () => {
    switch (currentSection) {
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pengaturan Notifikasi</h1>
              <p className="text-muted-foreground">
                Kelola template notifikasi dan channel komunikasi
              </p>
            </div>
            <div className="grid gap-6">
              <NotificationTemplateManager />
              <NotificationChannelManager />
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics & Laporan</h1>
              <p className="text-muted-foreground">
                Analisis data dan laporan sistem yang mendalam
              </p>
            </div>
            <AdvancedAnalytics />
          </div>
        );

      case 'search':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Global Search</h1>
              <p className="text-muted-foreground">
                Pengaturan dan konfigurasi pencarian global
              </p>
            </div>
            <GlobalSearch />
          </div>
        );

      case 'export':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Export System</h1>
              <p className="text-muted-foreground">
                Kelola export data dan laporan sistem
              </p>
            </div>
            <ExportSystem />
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Preferensi Pengguna</h1>
              <p className="text-muted-foreground">
                Pengaturan preferensi notifikasi dan tampilan
              </p>
            </div>
            <UserNotificationPreferences />
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h1>
              <p className="text-muted-foreground">
                Kelola konfigurasi dan pengaturan sistem SIAKAD
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Notifikasi</CardTitle>
                  <CardDescription>
                    Kelola template dan channel notifikasi sistem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Konfigurasi email, SMS, dan notifikasi push untuk berbagai kegiatan sistem.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>
                    Analisis data dan laporan sistem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Dashboard analytics untuk monitoring dan evaluasi performa sistem.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Global Search</CardTitle>
                  <CardDescription>
                    Konfigurasi pencarian global sistem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Pengaturan indexing dan konfigurasi pencarian di seluruh modul.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export System</CardTitle>
                  <CardDescription>
                    Kelola export data dan laporan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Konfigurasi format export, jadwal otomatis, dan template laporan.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <AppLayout>
      {renderContent()}
    </AppLayout>
  );
};

export default Settings;
