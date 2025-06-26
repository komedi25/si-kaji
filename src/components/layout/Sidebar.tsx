
import React from 'react';
import {
  Home,
  Calendar,
  BookOpen,
  ListChecks,
  PlusSquare,
  Settings,
  Users,
  FileText,
  BarChart3,
  ShieldAlert,
  LogOut,
  Trophy,
  MessageSquare,
  User,
  GraduationCap,
  Clock,
  TrendingUp,
  ClipboardList,
  Database,
  MapPin,
  CalendarClock,
  UserPlus,
  FolderOpen,
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
      title: 'Dashboard Siswa',
      icon: Home,
      href: '/student-dashboard',
      roles: ['siswa'],
    },
    {
      title: 'Dashboard Admin',
      icon: Home,
      href: '/admin-dashboard',
      roles: ['admin', 'waka_kesiswaan'],
    },
    {
      title: 'Dashboard Wali Kelas',
      icon: Users,
      href: '/homeroom-dashboard', 
      roles: ['wali_kelas'],
    },
    
    // Student specific entries - ubah istilah absensi ke presensi
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
    
    // Management
    {
      title: 'Ekstrakurikuler',
      icon: BookOpen,
      href: '/extracurricular',
      roles: ['admin', 'siswa', 'koordinator_ekstrakurikuler'],
    },
    {
      title: 'Data Pelanggaran',
      icon: ShieldAlert,
      href: '/violations',
      roles: ['admin', 'tppk', 'guru_bk', 'wali_kelas'],
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
      roles: ['siswa', 'guru_bk'],
    },
    {
      title: 'Proposal Kegiatan',
      icon: ClipboardList,
      href: '/proposals',
      roles: ['admin', 'waka_kesiswaan', 'koordinator_ekstrakurikuler'],
    },
    
    // Admin specific - kembalikan menu yang hilang
    {
      title: 'Master Data',
      icon: Database,
      href: '/settings',
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
      href: '/documents',
      roles: ['admin'],
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
