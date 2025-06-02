
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, School, BookOpen, Shield } from 'lucide-react';

export const DashboardHome = () => {
  const { user } = useAuth();

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'admin_sistem': 'Admin Sistem',
      'admin_kesiswaan': 'Admin Kesiswaan',
      'kepala_sekolah': 'Kepala Sekolah',
      'tppk': 'TPPK',
      'arps': 'ARPS',
      'p4gn': 'P4GN',
      'koordinator_ekstrakurikuler': 'Koordinator Ekstrakurikuler',
      'wali_kelas': 'Wali Kelas',
      'guru_bk': 'Guru BK',
      'waka_kesiswaan': 'Waka Kesiswaan',
      'pelatih_ekstrakurikuler': 'Pelatih Ekstrakurikuler',
      'siswa': 'Siswa',
      'orang_tua': 'Orang Tua',
      'penanggung_jawab_sarpras': 'Penanggung Jawab Sarpras'
    };
    return roleNames[role] || role;
  };

  const getWelcomeMessage = () => {
    if (!user?.roles || user.roles.length === 0) {
      return "Selamat datang di Sistem Kesiswaan SMK Negeri 1 Kendal";
    }

    const primaryRole = user.roles[0];
    const roleDisplayName = getRoleDisplayName(primaryRole);
    
    return `Selamat datang, ${roleDisplayName}`;
  };

  const getQuickActions = () => {
    if (!user?.roles || user.roles.length === 0) return [];

    const actions = [];
    const roles = user.roles;

    // Admin actions
    if (roles.includes('admin_sistem')) {
      actions.push(
        { title: 'Manajemen Pengguna', description: 'Kelola user dan role', icon: Users },
        { title: 'Master Data', description: 'Kelola data master sistem', icon: School }
      );
    }

    // Kesiswaan actions
    if (roles.includes('admin_kesiswaan') || roles.includes('waka_kesiswaan')) {
      actions.push(
        { title: 'Data Siswa', description: 'Kelola data siswa', icon: Users },
        { title: 'Presensi', description: 'Kelola presensi siswa', icon: BookOpen }
      );
    }

    // Ekstrakurikuler actions
    if (roles.includes('koordinator_ekstrakurikuler') || roles.includes('pelatih_ekstrakurikuler')) {
      actions.push(
        { title: 'Ekstrakurikuler', description: 'Kelola kegiatan ekstrakurikuler', icon: BookOpen }
      );
    }

    // TPPK/Security actions
    if (roles.includes('tppk') || roles.includes('arps') || roles.includes('p4gn')) {
      actions.push(
        { title: 'Kasus & Pelanggaran', description: 'Kelola kasus siswa', icon: Shield }
      );
    }

    return actions;
  };

  const quickActions = getQuickActions();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {getWelcomeMessage()}
          </h1>
          <p className="text-gray-600">
            Sistem Informasi Kesiswaan SMK Negeri 1 Kendal - Phase 1: Foundation & Infrastructure
          </p>
          
          {user?.profile && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900">Informasi Akun</h3>
              <div className="mt-2 text-sm text-blue-800">
                <p>Nama: {user.profile.full_name}</p>
                <p>Email: {user.email}</p>
                {user.profile.nip && <p>NIP: {user.profile.nip}</p>}
                {user.profile.nis && <p>NIS: {user.profile.nis}</p>}
                {user.roles && user.roles.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Role:</p>
                    <ul className="list-disc list-inside ml-2">
                      {user.roles.map((role, index) => (
                        <li key={index}>{getRoleDisplayName(role)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <action.icon className="h-6 w-6 text-blue-600" />
                  <CardTitle className="ml-3 text-base">{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{action.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status Sistem</CardTitle>
          <CardDescription>Phase 1: Foundation & Infrastructure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Authentication System</span>
              <span className="text-green-600 text-sm">✓ Aktif</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Role-Based Access Control</span>
              <span className="text-green-600 text-sm">✓ Aktif</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database Integration</span>
              <span className="text-green-600 text-sm">✓ Aktif</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User Management</span>
              <span className="text-yellow-600 text-sm">⚠ Dalam Pengembangan</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
