
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GeneralPreferences } from '@/components/settings/GeneralPreferences';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database } from 'lucide-react';

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

  const currentPath = location.pathname;
  
  // Default settings page with overview
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
          <p className="text-gray-600">Kelola preferensi dan konfigurasi aplikasi</p>
        </div>

        {/* User Preferences Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Preferensi Pengguna</h2>
          </div>
          <GeneralPreferences />
        </div>

        {/* System Settings Overview for Admins */}
        {hasRole('admin') && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <SettingsIcon className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Pengaturan Sistem (Admin)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifikasi
                  </CardTitle>
                  <CardDescription>
                    Kelola sistem notifikasi dan template pesan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Atur kanal notifikasi, template pesan, dan preferensi pengiriman notifikasi
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Master Data
                  </CardTitle>
                  <CardDescription>
                    Kelola data referensi sistem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Atur tahun ajaran, kelas, jurusan, jenis pelanggaran, dan data master lainnya
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Keamanan
                  </CardTitle>
                  <CardDescription>
                    Pengaturan keamanan dan akses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Kelola pengguna, role, dan hak akses sistem
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Informasi Sistem</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Versi:</span> 1.0.0
                </div>
                <div>
                  <span className="font-medium">Database:</span> PostgreSQL
                </div>
                <div>
                  <span className="font-medium">Status:</span> 
                  <span className="text-green-600 ml-1">Aktif</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
