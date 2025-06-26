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

  const menuItems = [
    // General items
    {
      title: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      roles: ['admin', 'wali_kelas', 'guru_bk', 'siswa', 'koordinator_ekstrakurikuler', 'tppk', 'waka_kesiswaan'],
    },
    {
      title: 'Dashboard Siswa',
      icon: BarChart3,
      href: '/student-dashboard',
      roles: ['siswa'],
    },
    {
      title: 'Dashboard Wali Kelas',
      icon: Users,
      href: '/homeroom-dashboard', 
      roles: ['wali_kelas'],
    },
    {
      title: 'Presensi',
      icon: Calendar,
      href: '/attendance/self',
      roles: ['siswa'],
    },
    {
      title: 'Manajemen Presensi',
      icon: ListChecks,
      href: '/attendance/record',
      roles: ['admin', 'wali_kelas', 'guru_bk', 'tppk'],
    },
    {
      title: 'Ekstrakurikuler',
      icon: BookOpen,
      href: '/extracurricular',
      roles: ['admin', 'siswa', 'koordinator_ekstrakurikuler'],
    },
    {
      title: 'Pengajuan Surat',
      icon: PlusSquare,
      href: '/permits',
      roles: ['admin', 'siswa', 'wali_kelas'],
    },
    {
      title: 'Pelanggaran',
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
      title: 'Laporan Kasus',
      icon: FileText,
      href: '/cases/reports',
      roles: ['siswa'],
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
    return item.roles.some(role => hasRole(role));
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r py-4">
      <div className="px-4 mb-4">
        <img src="/logo.png" alt="Logo" className="h-8" />
      </div>
      <div className="space-y-1 flex-1">
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200 ${
                isActive ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
              }`
            }
          >
            <item.icon className="h-4 w-4 mr-2" />
            {item.title}
          </NavLink>
        ))}
      </div>
    </div>
  );
};
