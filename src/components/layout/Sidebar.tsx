
import React, { useState } from 'react';
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
  Settings,
  User,
  LogOut,
  Bell,
  Zap,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface MenuItem {
  title: string;
  icon: React.ComponentType<any>;
  href?: string;
  roles: string[];
  children?: MenuItem[];
}

interface MenuGroupProps {
  item: MenuItem;
  level?: number;
}

const MenuGroup: React.FC<MenuGroupProps> = ({ item, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(level === 0);
  const { hasRole } = useAuth();

  // Check if user has access to this menu item
  const hasAccess = item.roles.some(role => hasRole(role as any));
  
  if (!hasAccess) return null;

  const paddingLeft = `${(level + 1) * 12}px`;

  if (item.children && item.children.length > 0) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-blue-100 hover:text-blue-700 text-gray-700"
          style={{ paddingLeft }}
        >
          <item.icon className="h-4 w-4 mr-3" />
          <span className="flex-1 text-left truncate">{item.title}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 ml-2" />
          ) : (
            <ChevronRight className="h-4 w-4 ml-2" />
          )}
        </button>
        
        {isOpen && (
          <div className="mt-1 space-y-1">
            {item.children.map((child, index) => (
              <MenuGroup key={index} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.href!}
      className={({ isActive }) =>
        `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group hover:bg-blue-100 hover:text-blue-700 ${
          isActive 
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105' 
            : 'text-gray-700 hover:scale-102'
        }`
      }
      style={{ paddingLeft }}
    >
      <item.icon className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" />
      <span className="truncate">{item.title}</span>
    </NavLink>
  );
};

export const Sidebar = () => {
  const { hasRole } = useAuth();

  const menuItems: MenuItem[] = [
    // Dashboard
    {
      title: 'Dashboard',
      icon: Home,
      roles: ['admin', 'waka_kesiswaan', 'siswa', 'wali_kelas'],
      children: [
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
      ]
    },

    // Manajemen Siswa
    {
      title: 'Manajemen Siswa',
      icon: Users,
      roles: ['admin', 'wali_kelas', 'guru_bk'],
      children: [
        {
          title: 'Data Siswa',
          icon: Users,
          href: '/student-management',
          roles: ['admin', 'wali_kelas', 'guru_bk'],
        },
        {
          title: 'Presensi',
          icon: Clock,
          roles: ['admin', 'wali_kelas', 'guru_bk', 'tppk', 'siswa'],
          children: [
            {
              title: 'Rekap Presensi',
              icon: BarChart3,
              href: '/attendance/recap',
              roles: ['admin', 'wali_kelas', 'guru_bk', 'siswa'],
            },
            {
              title: 'Input Presensi',
              icon: ListChecks,
              href: '/attendance/record',
              roles: ['admin', 'wali_kelas', 'guru_bk', 'tppk'],
            },
            {
              title: 'Presensi Mandiri',
              icon: Clock,
              href: '/attendance/self',
              roles: ['siswa'],
            },
          ]
        },
        {
          title: 'Pelanggaran',
          icon: ShieldAlert,
          href: '/violations',
          roles: ['admin', 'tppk', 'guru_bk', 'wali_kelas'],
        },
        {
          title: 'Prestasi',
          icon: Trophy,
          roles: ['admin', 'wali_kelas', 'guru_bk', 'siswa'],
          children: [
            {
              title: 'Data Prestasi',
              icon: Trophy,
              href: '/achievements',
              roles: ['admin', 'wali_kelas', 'guru_bk'],
            },
            {
              title: 'Input Prestasi',
              icon: Trophy,
              href: '/achievements/submit',
              roles: ['siswa'],
            },
          ]
        },
      ]
    },

    // Layanan Siswa
    {
      title: 'Layanan Siswa',
      icon: FileText,
      roles: ['admin', 'siswa', 'wali_kelas', 'guru_bk'],
      children: [
        {
          title: 'Perizinan',
          icon: PlusSquare,
          href: '/permits',
          roles: ['admin', 'wali_kelas', 'siswa'],
        },
        {
          title: 'Bimbingan Konseling',
          icon: GraduationCap,
          href: '/counseling',
          roles: ['admin', 'siswa', 'guru_bk'],
        },
        {
          title: 'Laporan Kasus',
          icon: MessageSquare,
          href: '/cases/reports',
          roles: ['siswa'],
        },
        {
          title: 'Pengajuan Surat',
          icon: FileText,
          href: '/documents',
          roles: ['siswa'],
        },
      ]
    },

    // Kegiatan & Ekstrakurikuler
    {
      title: 'Kegiatan',
      icon: BookOpen,
      roles: ['admin', 'siswa', 'koordinator_ekstrakurikuler', 'waka_kesiswaan'],
      children: [
        {
          title: 'Ekstrakurikuler',
          icon: BookOpen,
          href: '/extracurricular',
          roles: ['admin', 'siswa', 'koordinator_ekstrakurikuler'],
        },
        {
          title: 'Proposal Kegiatan',
          icon: ClipboardList,
          href: '/proposals',
          roles: ['admin', 'waka_kesiswaan', 'koordinator_ekstrakurikuler', 'siswa'],
        },
      ]
    },

    // Penanganan Kasus
    {
      title: 'Penanganan Kasus',
      icon: MessageSquare,
      roles: ['admin', 'tppk', 'arps', 'p4gn', 'guru_bk'],
      children: [
        {
          title: 'Manajemen Kasus',
          icon: MessageSquare,
          href: '/cases',
          roles: ['admin', 'tppk', 'arps', 'p4gn', 'guru_bk'],
        },
        {
          title: 'Jurnal Perwalian',
          icon: FileText,
          href: '/homeroom',
          roles: ['admin', 'wali_kelas'],
        },
      ]
    },

    // Laporan & Analitik
    {
      title: 'Laporan & Analitik',
      icon: BarChart3,
      roles: ['admin', 'waka_kesiswaan', 'kepala_sekolah'],
      children: [
        {
          title: 'Laporan Umum',
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
      ]
    },

    // Sistem & Konfigurasi
    {
      title: 'Sistem',
      icon: Settings,
      roles: ['admin'],
      children: [
        {
          title: 'Master Data',
          icon: Database,
          href: '/master-data',
          roles: ['admin'],
        },
        {
          title: 'Manajemen Pengguna',
          icon: Users,
          href: '/user-management',
          roles: ['admin'],
        },
        {
          title: 'Notifikasi',
          icon: Bell,
          href: '/notifications',
          roles: ['admin', 'waka_kesiswaan'],
        },
        {
          title: 'Pengaturan',
          icon: Settings,
          href: '/settings',
          roles: ['admin'],
        },
      ]
    },

    // User Menu
    {
      title: 'Akun',
      icon: User,
      roles: ['admin', 'wali_kelas', 'guru_bk', 'siswa', 'koordinator_ekstrakurikuler', 'tppk', 'waka_kesiswaan'],
      children: [
        {
          title: 'Profil Saya',
          icon: User,
          href: '/profile',
          roles: ['admin', 'wali_kelas', 'guru_bk', 'siswa', 'koordinator_ekstrakurikuler', 'tppk', 'waka_kesiswaan'],
        },
        {
          title: 'Keluar',
          icon: LogOut,
          href: '/logout',
          roles: ['admin', 'wali_kelas', 'guru_bk', 'siswa', 'koordinator_ekstrakurikuler', 'tppk', 'waka_kesiswaan'],
        },
      ]
    },
  ];

  const filteredMenuItems = menuItems.filter(item => {
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
      
      <div className="space-y-2 flex-1 px-2 overflow-y-auto">
        {filteredMenuItems.map((item, index) => (
          <MenuGroup key={index} item={item} />
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
