
import { useAuth } from '@/hooks/useAuth';
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
    <div className="space-y-4 md:space-y-6">
      {/* Simplified Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-3 md:px-6 md:py-4 text-white">
          <h1 className="text-lg md:text-xl font-bold mb-1">
            {getWelcomeMessage()}
          </h1>
          <p className="text-blue-100 text-xs md:text-sm">
            SMK Negeri 1 Kendal
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div>
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Statistik Dashboard</h2>
        <RoleBasedStats />
      </div>

      {/* Charts Section */}
      <div>
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Analisis Data</h2>
        <DashboardCharts />
      </div>
    </div>
  );
};
