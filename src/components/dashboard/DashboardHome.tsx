import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, School, BookOpen, Shield, BarChart3, CheckCircle, Clock, AlertTriangle, Calendar, Trophy, FileText } from 'lucide-react';

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
        { title: 'Manajemen Pengguna', description: 'Kelola user dan role', icon: Users, href: '/user-management' },
        { title: 'Master Data', description: 'Kelola data master sistem', icon: School, href: '/master-data' }
      );
    }

    // Kesiswaan actions
    if (roles.includes('admin_kesiswaan') || roles.includes('waka_kesiswaan')) {
      actions.push(
        { title: 'Data Siswa', description: 'Kelola data siswa', icon: Users, href: '/student-management' },
        { title: 'Laporan', description: 'Lihat laporan kesiswaan', icon: BarChart3, href: '/reports' }
      );
    }

    // Ekstrakurikuler actions
    if (roles.includes('koordinator_ekstrakurikuler') || roles.includes('pelatih_ekstrakurikuler')) {
      actions.push(
        { title: 'Ekstrakurikuler', description: 'Kelola kegiatan ekstrakurikuler', icon: BookOpen, href: '/extracurricular-management' }
      );
    }

    // TPPK/Security actions
    if (roles.includes('tppk') || roles.includes('arps') || roles.includes('p4gn') || roles.includes('guru_bk')) {
      actions.push(
        { title: 'Kasus & BK', description: 'Kelola kasus dan konseling', icon: Shield, href: '/case-management' }
      );
    }

    // Wali Kelas actions
    if (roles.includes('wali_kelas')) {
      actions.push(
        { title: 'Presensi Kelas', description: 'Input dan monitor presensi', icon: Calendar, href: '/attendance-management' },
        { title: 'Pelanggaran', description: 'Catat pelanggaran siswa', icon: AlertTriangle, href: '/violation-management' },
        { title: 'Prestasi', description: 'Catat prestasi siswa', icon: Trophy, href: '/achievement-management' }
      );
    }

    // PJ Sarpras actions
    if (roles.includes('penanggung_jawab_sarpras')) {
      actions.push(
        { title: 'Kelola Fasilitas', description: 'Manajemen peminjaman fasilitas', icon: School, href: '/facility-management' }
      );
    }

    // Siswa actions
    if (roles.includes('siswa')) {
      actions.push(
        { title: 'Ajukan Izin', description: 'Buat permohonan izin', icon: FileText, href: '/permit-management' },
        { title: 'Konseling BK', description: 'Jadwalkan sesi konseling', icon: Shield, href: '/counseling-management' }
      );
    }

    return actions;
  };

  const getDashboardStats = () => {
    if (!user?.roles || user.roles.length === 0) return [];

    const roles = user.roles;
    const stats = [];

    // Admin sistem stats
    if (roles.includes('admin_sistem')) {
      stats.push(
        { title: 'Total Pengguna', value: '-', icon: Users, description: 'Akan tersedia setelah implementasi lengkap' },
        { title: 'Sistem Aktif', value: '✓', icon: CheckCircle, description: 'Semua modul berjalan normal' }
      );
    }

    // Kesiswaan stats  
    if (roles.includes('admin_kesiswaan') || roles.includes('waka_kesiswaan')) {
      stats.push(
        { title: 'Siswa Aktif', value: '-', icon: School, description: 'Data siswa dalam pengembangan' },
        { title: 'Kasus Pending', value: '-', icon: AlertTriangle, description: 'Kasus menunggu penanganan' }
      );
    }

    // Wali kelas stats
    if (roles.includes('wali_kelas')) {
      stats.push(
        { title: 'Siswa Perwalian', value: '-', icon: Users, description: 'Total siswa dalam kelas' },
        { title: 'Hadir Hari Ini', value: '-', icon: Calendar, description: 'Presensi hari ini' }
      );
    }

    // TPPK/BK stats
    if (roles.includes('tppk') || roles.includes('guru_bk') || roles.includes('arps') || roles.includes('p4gn')) {
      stats.push(
        { title: 'Kasus Aktif', value: '-', icon: Shield, description: 'Kasus dalam penanganan' },
        { title: 'Sesi Konseling', value: '-', icon: Shield, description: 'Jadwal konseling minggu ini' }
      );
    }

    // Koordinator eskul stats
    if (roles.includes('koordinator_ekstrakurikuler')) {
      stats.push(
        { title: 'Ekstrakurikuler', value: '-', icon: BookOpen, description: 'Total kegiatan ekstrakurikuler' },
        { title: 'Peserta Aktif', value: '-', icon: Users, description: 'Siswa yang mengikuti eskul' }
      );
    }

    return stats;
  };

  const quickActions = getQuickActions();
  const dashboardStats = getDashboardStats();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden shadow rounded-lg">
        <div className="px-6 py-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            {getWelcomeMessage()}
          </h1>
          <p className="text-blue-100 text-lg">
            Sistem Informasi Kesiswaan SMK Negeri 1 Kendal
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-500 bg-opacity-20">
            <CheckCircle className="h-4 w-4 mr-2" />
            Phase 1: Foundation & Infrastructure - Aktif
          </div>
        </div>
      </div>

      {/* Role-specific Stats Cards */}
      {dashboardStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                <p className="text-sm">{user.email}</p>
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

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Akses cepat ke fitur-fitur utama berdasarkan role Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <a 
                  key={index} 
                  href={action.href}
                  className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <action.icon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status Sistem Phase 1</CardTitle>
          <CardDescription>Foundation & Infrastructure - Progress Implementation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium">Authentication System</span>
              </div>
              <span className="text-green-600 text-sm font-medium">✓ Selesai</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium">Role-Based Access Control</span>
              </div>
              <span className="text-green-600 text-sm font-medium">✓ Selesai</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium">Database Integration</span>
              </div>
              <span className="text-green-600 text-sm font-medium">✓ Selesai</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium">User Management</span>
              </div>
              <span className="text-green-600 text-sm font-medium">✓ Selesai</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium">Navigation & Layout</span>
              </div>
              <span className="text-green-600 text-sm font-medium">✓ Selesai</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium">Permission Matrix & RLS</span>
              </div>
              <span className="text-green-600 text-sm font-medium">✓ Selesai</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium">Data Modules (Siswa, Ekstrakurikuler, BK)</span>
              </div>
              <span className="text-yellow-600 text-sm font-medium">⚠ Phase 2</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium">Reporting & Analytics</span>
              </div>
              <span className="text-yellow-600 text-sm font-medium">⚠ Phase 3</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
