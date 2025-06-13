
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { RoleBasedStats } from './RoleBasedStats';
import { DashboardCharts } from './DashboardCharts';

export const DashboardHome = () => {
  const { user } = useAuth();

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'admin': 'Admin',
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
      return "Dashboard Kesiswaan";
    }

    const primaryRole = user.roles[0];
    const roleDisplayName = getRoleDisplayName(primaryRole);
    
    return `Dashboard ${roleDisplayName}`;
  };

  return (
    <div className="space-y-6">
      {/* Simplified Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-4 md:px-6 md:py-6 text-white">
          <h1 className="text-xl md:text-2xl font-bold mb-1">
            {getWelcomeMessage()}
          </h1>
          <p className="text-blue-100 text-sm md:text-base">
            SMK Negeri 1 Kendal
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Statistik Dashboard</h2>
        <RoleBasedStats />
      </div>

      {/* Charts Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Analisis Data</h2>
        <DashboardCharts />
      </div>

      {/* User Profile Info */}
      {user?.profile && (
        <Card>
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
            <CardDescription>Detail akun dan role Anda dalam sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nama Lengkap</label>
                <p className="text-sm">{user.profile.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm break-all">{user.email}</p>
              </div>
              {user.profile.nip && (
                <div>
                  <label className="text-sm font-medium text-gray-500">NIP</label>
                  <p className="text-sm">{user.profile.nip}</p>
                </div>
              )}
              {user.profile.nis && (
                <div>
                  <label className="text-sm font-medium text-gray-500">NIS</label>
                  <p className="text-sm">{user.profile.nis}</p>
                </div>
              )}
              {user.roles && user.roles.length > 0 && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {user.roles.map((role, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getRoleDisplayName(role)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
