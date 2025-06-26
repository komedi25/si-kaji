
import React from 'react';
import {
  Home,
  Users,
  Clock,
  BarChart3,
  Trophy,
  MessageSquare,
  PlusSquare,
  ClipboardList,
  FileText,
  ListChecks,
  ShieldAlert,
  BookOpen,
  GraduationCap,
  Database,
  MapPin,
  CalendarClock,
  UserPlus,
  FolderOpen,
  Archive,
  Activity,
  HardDrive,
  Settings,
  Monitor,
  TrendingUp,
  Download,
  Upload,
  Search,
  CheckCircle,
  Target,
  User,
  LogOut,
  Bell,
  Zap
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface MenuItem {
  title: string;
  icon: React.ComponentType<any>;
  href: string;
  roles: string[];
}

export const Sidebar = () => {
  const { hasRole } = useAuth();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    // Dashboard items - pisahkan berdasarkan role
    {
      title: 'Dashboard Admin',
      icon: Home,
      href: '/admin-dashboard',
      roles: ['admin', 'waka_kesiswaan'],
    },
    {
      title: 'Dashboard Siswa',
      icon: Home,
      href: '/student-dashboard',
      roles: ['siswa'],
    },
    {
      title: 'Dashboard Wali Kelas',
      icon: Users,
      href: '/homeroom-dashboard', 
      roles: ['wali_kelas'],
    },
    
    // Student specific entries
    {
      title: 'Presensi Harian',
      icon: Clock,
      href: '/attendance/self',
      roles: ['siswa'],
    },
    {
      title: 'Rekap Presensi',
      icon: BarChart3,
      href: '/attendance/recap',
      roles: ['siswa'],
    },
    {
      title: 'Tambah Prestasi',
      icon: Trophy,
      href: '/achievements/submit',
      roles: ['siswa'],
    },
    {
      title: 'Laporan Kasus',
      icon: MessageSquare,
      href: '/cases/reports',
      roles: ['siswa'],
    },
    {
      title: 'Permohonan Izin',
      icon: PlusSquare,
      href: '/permits',
      roles: ['siswa'],
    },
    {
      title: 'Proposal Kegiatan',
      icon: ClipboardList,
      href: '/proposals',
      roles: ['siswa'],
    },
    {
      title: 'Pengajuan Surat',
      icon: FileText,
      href: '/documents',
      roles: ['siswa'],
    },
    
    // General management activities
    {
      title: 'Manajemen Presensi',
      icon: ListChecks,
      href: '/attendance/record',
      roles: ['admin', 'wali_kelas', 'guru_bk', 'tppk'],
    },
    {
      title: 'Permohonan Izin',
      icon: PlusSquare,
      href: '/permits',
      roles: ['admin', 'wali_kelas'],
    },
    
    // Management modules for admin
    {
      title: 'Manajemen Siswa',
      icon: Users,
      href: '/student-management',
      roles: ['admin', 'wali_kelas', 'guru_bk'],
    },
    {
      title: 'Manajemen Pelanggaran',
      icon: ShieldAlert,
      href: '/violations',
      roles: ['admin', 'tppk', 'guru_bk', 'wali_kelas'],
    },
    {
      title: 'Manajemen Prestasi',
      icon: Trophy,
      href: '/achievements',
      roles: ['admin', 'wali_kelas', 'guru_bk'],
    },
    {
      title: 'Manajemen Kasus',
      icon: MessageSquare,
      href: '/cases',
      roles: ['admin', 'tppk', 'arps', 'p4gn', 'guru_bk'],
    },
    {
      title: 'Ekstrakurikuler',
      icon: BookOpen,
      href: '/extracurricular',
      roles: ['admin', 'siswa', 'koordinator_ekstrakurikuler'],
    },
    {
      title: 'Jurnal Perwalian',
      icon: FileText,
      href: '/homeroom',
      roles: ['admin', 'wali_kelas'],
    },
    {
      title: 'Konseling BK',
      icon: GraduationCap,
      href: '/counseling',
      roles: ['admin', 'siswa', 'guru_bk'],
    },
    {
      title: 'Proposal Kegiatan',
      icon: ClipboardList,
      href: '/proposals',
      roles: ['admin', 'waka_kesiswaan', 'koordinator_ekstrakurikuler'],
    },
    {
      title: 'Laporan & Analitik',
      icon: BarChart3,
      href: '/reports',
      roles: ['admin', 'waka_kesiswaan', 'kepala_sekolah'],
    },
    {
      title: 'AI Management',
      icon: Zap,
      href: '/ai-management',
      roles: ['admin'],
    },
    {
      title: 'Sistem Notifikasi',
      icon: Bell,
      href: '/notifications',
      roles: ['admin', 'waka_kesiswaan'],
    },
    
    // Admin specific - lengkapi semua menu admin
    {
      title: 'Master Data',
      icon: Database,
      href: '/master-data',
      roles: ['admin'],
    },
    {
      title: 'Kelola Lokasi Presensi',
      icon: MapPin,
      href: '/attendance/location',
      roles: ['admin'],
    },
    {
      title: 'Pengaturan Jadwal Presensi',
      icon: CalendarClock,
      href: '/attendance/schedule',
      roles: ['admin'],
    },
    {
      title: 'Manajemen Pengguna',
      icon: UserPlus,
      href: '/user-management',
      roles: ['admin'],
    },
    {
      title: 'Manajemen Dokumen',
      icon: FolderOpen,
      href: '/document-management',
      roles: ['admin'],
    },
    {
      title: 'Repository Dokumen',
      icon: Archive,
      href: '/document-repository',
      roles: ['admin'],
    },
    {
      title: 'Audit Trail & Log',
      icon: Activity,
      href: '/audit-logs',
      roles: ['admin'],
    },
    {
      title: 'Backup & Maintenance',
      icon: HardDrive,
      href: '/backup-maintenance',
      roles: ['admin'],
    },
    {
      title: 'Konfigurasi Sistem',
      icon: Settings,
      href: '/system-config',
      roles: ['admin'],
    },
    {
      title: 'Template Manager',
      icon: FileText,
      href: '/template-manager',
      roles: ['admin'],
    },
    {
      title: 'Status Sistem',
      icon: Monitor,
      href: '/system-status',
      roles: ['admin'],
    },
    {
      title: 'Analitik Lanjutan',
      icon: TrendingUp,
      href: '/advanced-analytics',
      roles: ['admin', 'kepala_sekolah'],
    },
    {
      title: 'Export Data',
      icon: Download,
      href: '/export-data',
      roles: ['admin'],
    },
    {
      title: 'Import Data',
      icon: Upload,
      href: '/import-data',
      roles: ['admin'],
    },
    {
      title: 'Pencarian Global',
      icon: Search,
      href: '/global-search',
      roles: ['admin'],
    },
    {
      title: 'Verifikasi Prestasi',
      icon: CheckCircle,
      href: '/achievement-verification',
      roles: ['admin', 'wali_kelas', 'guru_bk'],
    },
    {
      title: 'Poin Disiplin',
      icon: Target,
      href: '/discipline-points',
      roles: ['admin', 'wali_kelas', 'guru_bk', 'tppk'],
    },
    
    // Settings
    {
      title: 'Profil Saya',
      icon: User,
      href: '/profile',
      roles: ['admin', 'wali_kelas', 'guru_bk', 'siswa', 'koordinator_ekstrakurikuler', 'tppk', 'waka_kesiswaan'],
    },
    {
      title: 'Pengaturan',
      icon: Settings,
      href: '/settings',
      roles: ['admin'],
    },
    {
      title: 'Keluar',
      icon: LogOut,
      href: '/logout',
      roles: ['admin', 'wali_kelas', 'guru_bk', 'siswa', 'koordinator_ekstrakurikuler', 'tppk', 'waka_kesiswaan'],
    },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.href === '/logout') {
      return true;
    }
    return item.roles.some(role => hasRole(role as any));
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-50 to-indigo-50 border-r border-blue-200 py-4">
      <div className="px-4 mb-6">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/b258db0b-54a9-4826-a0ce-5850c64b6fc7.png" 
            alt="Logo SMKN 1 Kendal" 
            className="h-10 w-10 rounded-full shadow-md"
          />
          <div>
            <h2 className="font-bold text-blue-900 text-lg">Si-Kaji</h2>
            <p className="text-xs text-blue-600 font-medium">SMK N 1 Kendal</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-1 flex-1 px-2">
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group hover:bg-blue-100 hover:text-blue-700 ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105' 
                  : 'text-gray-700 hover:scale-102'
              }`
            }
          >
            <item.icon className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" />
            <span className="truncate">{item.title}</span>
          </NavLink>
        ))}
      </div>
      
      <div className="px-4 pt-4 border-t border-blue-200">
        <p className="text-xs text-blue-600 text-center font-medium">
          Sistem Kesiswaan Terpadu
        </p>
      </div>
    </div>
  );
};
