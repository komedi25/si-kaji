
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  Users,
  Settings,
  Home,
  UserCheck,
  BookOpen,
  Shield,
  BarChart3,
  School,
  ChevronLeft,
  Menu,
  Calendar,
  AlertTriangle,
  Trophy,
  ClipboardList,
  FileText,
  MapPin,
  Heart,
  FolderOpen,
  UsersIcon,
  Database,
  Bell,
  LineChart,
  Sliders,
  Building,
  Activity,
  Award,
  FileX,
  ListChecks,
  Upload,
  Archive,
  Clock,
  MessageSquare,
  TrendingUp,
  ChevronDown,
  Bot,
  User,
  CheckSquare,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRoles?: string[];
  badge?: string;
  children?: SidebarItem[];
}

interface SidebarProps {
  isMobile?: boolean;
  onItemClick?: () => void;
}

export const Sidebar = ({ isMobile = false, onItemClick }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, hasRole } = useAuth();
  const location = useLocation();

  const sidebarItems: SidebarItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    // Siswa Menu Items
    {
      title: 'Prestasi Saya',
      href: '/achievements?view=student',
      icon: Trophy,
      requiredRoles: ['siswa'],
    },
    {
      title: 'Laporan Kasus',
      href: '/cases?view=student',
      icon: Shield,
      requiredRoles: ['siswa'],
    },
    {
      title: 'Presensi Saya',
      href: '/attendance/self',
      icon: Calendar,
      requiredRoles: ['siswa'],
    },
    {
      title: 'Perizinan & Kegiatan',
      href: '/permits',
      icon: FileX,
      requiredRoles: ['siswa'],
    },
    {
      title: 'Permohonan Surat',
      href: '/letter-request',
      icon: FileCheck,
      requiredRoles: ['siswa'],
    },
    {
      title: 'Konseling',
      href: '/counseling',
      icon: Heart,
      requiredRoles: ['siswa'],
    },
    {
      title: 'Ekstrakurikuler',
      href: '#',
      icon: Activity,
      requiredRoles: ['siswa'],
      children: [
        {
          title: 'Daftar Eskul',
          href: '/extracurricular?tab=enrollment',
          icon: Users,
          requiredRoles: ['siswa'],
        },
        {
          title: 'Kegiatan Saya',
          href: '/extracurricular?tab=my-activities',
          icon: Activity,
          requiredRoles: ['siswa'],
        },
      ],
    },
    {
      title: 'Proposal Kegiatan',
      href: '/activity-proposal',
      icon: ClipboardList,
      requiredRoles: ['siswa'],
    },
    {
      title: 'Profil Saya',
      href: '/my-profile',
      icon: User,
      requiredRoles: ['siswa'],
    },
    // Admin & Staff Menu Items (only show for authorized roles)
    {
      title: 'Manajemen Pengguna',
      href: '/user-management',
      icon: Users,
      requiredRoles: ['admin'],
    },
    {
      title: 'Akademik',
      href: '#',
      icon: BookOpen,
      children: [
        {
          title: 'Presensi',
          href: '#',
          icon: Calendar,
          requiredRoles: ['admin', 'wali_kelas', 'guru_bk', 'tppk'],
          children: [
            {
              title: 'Presensi Mandiri',
              href: '/attendance/self',
              icon: MapPin,
              requiredRoles: ['admin', 'wali_kelas', 'guru_bk', 'tppk', 'siswa'],
            },
            {
              title: 'Input Presensi',
              href: '/attendance/record',
              icon: Calendar,
              requiredRoles: ['admin', 'wali_kelas', 'guru_bk', 'tppk'],
            },
            {
              title: 'Presensi QR Code',
              href: '/attendance-qr',
              icon: MapPin,
              requiredRoles: ['tppk'],
            },
            {
              title: 'Laporan Presensi',
              href: '/attendance/report',
              icon: FileText,
              requiredRoles: ['admin', 'wali_kelas', 'guru_bk', 'tppk'],
            },
            {
              title: 'Kelola Lokasi',
              href: '/attendance/location',
              icon: MapPin,
              requiredRoles: ['admin'],
            },
            {
              title: 'Kelola Jadwal',
              href: '/attendance/schedule',
              icon: Clock,
              requiredRoles: ['admin'],
            },
          ],
        },
        {
          title: 'Pelanggaran',
          href: '#',
          icon: AlertTriangle,
          requiredRoles: ['admin', 'wali_kelas', 'guru_bk', 'tppk'],
          children: [
            {
              title: 'Input Pelanggaran',
              href: '/violations?tab=record',
              icon: AlertTriangle,
              requiredRoles: ['admin', 'wali_kelas', 'guru_bk', 'tppk'],
            },
            {
              title: 'Laporan Pelanggaran',
              href: '/violations?tab=report',
              icon: FileText,
              requiredRoles: ['admin', 'wali_kelas', 'guru_bk', 'tppk'],
            },
          ],
        },
        {
          title: 'Prestasi',
          href: '#',
          icon: Trophy,
          requiredRoles: ['admin', 'wali_kelas'],
          children: [
            {
              title: 'Verifikasi Prestasi',
              href: '/achievements?tab=verification',
              icon: CheckSquare,
              requiredRoles: ['admin', 'wali_kelas'],
            },
            {
              title: 'Input Prestasi',
              href: '/achievements?tab=record',
              icon: Award,
              requiredRoles: ['admin', 'wali_kelas'],
            },
            {
              title: 'Laporan Prestasi',
              href: '/achievements?tab=report',
              icon: FileText,
              requiredRoles: ['admin', 'wali_kelas'],
            },
          ],
        },
        {
          title: 'Poin Disiplin',
          href: '/discipline-points',
          icon: BarChart3,
          requiredRoles: ['admin', 'wali_kelas', 'guru_bk'],
        },
      ],
    },
    {
      title: 'Kegiatan',
      href: '#',
      icon: Calendar,
      children: [
        {
          title: 'Proposal Kegiatan',
          href: '#',
          icon: ClipboardList,
          requiredRoles: ['koordinator_ekstrakurikuler', 'admin'],
          children: [
            {
              title: 'Buat Proposal',
              href: '/activity-proposal?tab=proposal',
              icon: ClipboardList,
              requiredRoles: ['koordinator_ekstrakurikuler', 'admin'],
            },
            {
              title: 'Peminjaman Fasilitas',
              href: '/activity-proposal?tab=facilities',
              icon: Building,
              requiredRoles: ['koordinator_ekstrakurikuler', 'admin'],
            },
            {
              title: 'LPJ & Dokumentasi',
              href: '/activity-proposal?tab=report',
              icon: FileText,
              requiredRoles: ['koordinator_ekstrakurikuler', 'admin'],
            },
          ],
        },
        {
          title: 'Ekstrakurikuler',
          href: '#',
          icon: BookOpen,
          requiredRoles: ['koordinator_ekstrakurikuler', 'pelatih_ekstrakurikuler', 'admin'],
          children: [
            {
              title: 'Pendaftaran Siswa',
              href: '/extracurricular?tab=enrollment',
              icon: Users,
              requiredRoles: ['koordinator_ekstrakurikuler', 'pelatih_ekstrakurikuler', 'admin'],
            },
            {
              title: 'Jurnal Pelatih',
              href: '/extracurricular?tab=activity-log',
              icon: BookOpen,
              requiredRoles: ['koordinator_ekstrakurikuler', 'pelatih_ekstrakurikuler', 'admin'],
            },
            {
              title: 'Presensi Pelatih',
              href: '/extracurricular?tab=attendance',
              icon: Calendar,
              requiredRoles: ['koordinator_ekstrakurikuler', 'pelatih_ekstrakurikuler', 'admin'],
            },
            {
              title: 'Data Ekstrakurikuler',
              href: '/extracurricular?tab=master-data',
              icon: Database,
              requiredRoles: ['koordinator_ekstrakurikuler', 'pelatih_ekstrakurikuler', 'admin'],
            },
          ],
        },
      ],
    },
    {
      title: 'Perwalian & BK',
      href: '#',
      icon: Heart,
      children: [
        {
          title: 'Jurnal Perwalian',
          href: '#',
          icon: BookOpen,
          requiredRoles: ['wali_kelas', 'admin'],
          children: [
            {
              title: 'Buat Jurnal',
              href: '/homeroom-journal?tab=create',
              icon: FileText,
              requiredRoles: ['wali_kelas', 'admin'],
            },
            {
              title: 'Daftar Jurnal',
              href: '/homeroom-journal?tab=list',
              icon: FolderOpen,
              requiredRoles: ['wali_kelas', 'admin'],
            },
            {
              title: 'Progres Siswa',
              href: '/homeroom-journal?tab=progress',
              icon: TrendingUp,
              requiredRoles: ['wali_kelas', 'admin'],
            },
            {
              title: 'Komunikasi Ortu',
              href: '/homeroom-journal?tab=communication',
              icon: MessageSquare,
              requiredRoles: ['wali_kelas', 'admin'],
            },
            {
              title: 'Analisis Kelas',
              href: '/homeroom-journal?tab=analytics',
              icon: BarChart3,
              requiredRoles: ['wali_kelas', 'admin'],
            },
          ],
        },
        {
          title: 'Sesi Konseling',
          href: '/counseling',
          icon: Heart,
          requiredRoles: ['guru_bk', 'admin'],
        },
        {
          title: 'Manajemen Kasus',
          href: '/cases',
          icon: Shield,
          requiredRoles: ['guru_bk', 'tppk', 'arps', 'p4gn', 'admin'],
        },
      ],
    },
    {
      title: 'Administrasi',
      href: '#',
      icon: FolderOpen,
      children: [
        {
          title: 'Perizinan',
          href: '#',
          icon: MapPin,
          requiredRoles: ['admin', 'wali_kelas'],
          children: [
            {
              title: 'Buat Izin',
              href: '/permits?tab=form',
              icon: FileX,
              requiredRoles: ['admin', 'wali_kelas'],
            },
            {
              title: 'Persetujuan',
              href: '/permits?tab=approval',
              icon: ListChecks,
              requiredRoles: ['admin', 'wali_kelas'],
            },
            {
              title: 'Laporan Izin',
              href: '/permits?tab=report',
              icon: FileText,
              requiredRoles: ['admin', 'wali_kelas'],
            },
          ],
        },
        {
          title: 'Dokumen & Surat',
          href: '#',
          icon: FileText,
          requiredRoles: ['admin'],
          children: [
            {
              title: 'Permohonan Surat',
              href: '/documents?tab=letters',
              icon: FileText,
              requiredRoles: ['admin'],
            },
            {
              title: 'Mutasi Siswa',
              href: '/documents?tab=mutations',
              icon: Users,
              requiredRoles: ['admin'],
            },
            {
              title: 'Template Surat',
              href: '/documents?tab=templates',
              icon: Archive,
              requiredRoles: ['admin'],
            },
          ],
        },
        {
          title: 'Repositori Dokumen',
          href: '#',
          icon: FolderOpen,
          requiredRoles: ['admin'],
          children: [
            {
              title: 'Repositori',
              href: '/document-repository?tab=repository',
              icon: Archive,
              requiredRoles: ['admin'],
            },
            {
              title: 'Upload Dokumen',
              href: '/document-repository?tab=upload',
              icon: Upload,
              requiredRoles: ['admin'],
            },
            {
              title: 'Kebijakan',
              href: '/document-repository?tab=policies',
              icon: Shield,
              requiredRoles: ['admin'],
            },
            {
              title: 'Kategori',
              href: '/document-repository?tab=categories',
              icon: FolderOpen,
              requiredRoles: ['admin'],
            },
            {
              title: 'Version Control',
              href: '/document-repository?tab=versions',
              icon: Clock,
              requiredRoles: ['admin'],
            },
          ],
        },
        {
          title: 'Portal Orang Tua',
          href: '/parent-portal',
          icon: UsersIcon,
          requiredRoles: ['admin', 'wali_kelas'],
        },
      ],
    },
    {
      title: 'AI & Sistem Cerdas',
      href: '/ai-management',
      icon: Bot,
      requiredRoles: ['admin', 'wali_kelas', 'guru_bk'],
    },
    {
      title: 'Sistem & Pengaturan',
      href: '#',
      icon: Settings,
      children: [
        {
          title: 'Master Data',
          href: '#',
          icon: Database,
          requiredRoles: ['admin'],
          children: [
            {
              title: 'Akademik',
              href: '/master-data?tab=academic',
              icon: Calendar,
              requiredRoles: ['admin'],
            },
            {
              title: 'Struktur',
              href: '/master-data?tab=structure',
              icon: School,
              requiredRoles: ['admin'],
            },
            {
              title: 'Pelanggaran',
              href: '/master-data?tab=violations',
              icon: AlertTriangle,
              requiredRoles: ['admin'],
            },
            {
              title: 'Prestasi',
              href: '/master-data?tab=achievements',
              icon: Trophy,
              requiredRoles: ['admin'],
            },
            {
              title: 'Ekstrakurikuler',
              href: '/master-data?tab=extracurricular',
              icon: Activity,
              requiredRoles: ['admin'],
            },
            {
              title: 'Fasilitas',
              href: '/master-data?tab=facilities',
              icon: Building,
              requiredRoles: ['admin'],
            },
          ],
        },
        {
          title: 'Notifikasi',
          href: '/notifications',
          icon: Bell,
          requiredRoles: ['admin'],
        },
        {
          title: 'Status Sistem',
          href: '/system-status',
          icon: LineChart,
          requiredRoles: ['admin'],
        },
        {
          title: 'Pengaturan',
          href: '/settings',
          icon: Sliders,
        },
      ],
    },
  ];

  const filteredItems = sidebarItems.filter(item => {
    if (!item.requiredRoles) return true;
    
    // Special filtering for TPPK role - only show relevant menus
    if (hasRole('tppk') && !hasRole('admin')) {
      const tppkRelevantMenus = [
        'Dashboard',
        'Presensi',
        'Input Presensi',
        'Presensi QR Code',
        'Laporan Presensi',
        'Pelanggaran',
        'Input Pelanggaran',
        'Laporan Pelanggaran',
        'Poin Disiplin',
        'Manajemen Kasus'
      ];
      if (!tppkRelevantMenus.includes(item.title)) {
        return false;
      }
    }
    
    return item.requiredRoles.some(role => hasRole(role as any));
  });

  const isItemActive = (href: string) => {
    if (href === '#') return false;
    const currentPath = location.pathname;
    const currentSearch = location.search;
    
    // Handle attendance routes specifically
    if (href.startsWith('/attendance/')) {
      const attendanceSection = href.split('/')[2];
      return currentPath === '/attendance' && currentSearch.includes(`tab=${attendanceSection}`);
    }
    
    // Handle tab-based navigation
    if (href.includes('?tab=')) {
      const [path, tab] = href.split('?tab=');
      return currentPath === path && currentSearch.includes(`tab=${tab}`);
    }
    
    // Handle view-based navigation
    if (href.includes('?view=')) {
      const [path, view] = href.split('?view=');
      return currentPath === path && currentSearch.includes(`view=${view}`);
    }
    
    return currentPath === href;
  };

  const hasActiveChild = (children?: SidebarItem[]): boolean => {
    if (!children) return false;
    return children.some(child => {
      if (isItemActive(child.href)) return true;
      return hasActiveChild(child.children);
    });
  };

  const [expandedItems, setExpandedItems] = useState<string[]>(['Sistem & Pengaturan', 'Akademik']);

  const toggleExpand = (title: string, e?: React.MouseEvent) => {
    // Prevent event propagation to avoid closing mobile sidebar
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const handleItemClick = (href: string) => {
    // Only close mobile sidebar when clicking actual links (not parent items with children)
    if (isMobile && onItemClick && href !== '#') {
      onItemClick();
    }
  };

  const renderMenuItem = (item: SidebarItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const isActive = isItemActive(item.href);
    const hasActiveChildren = hasActiveChild(item.children);

    if (hasChildren) {
      const filteredChildren = item.children?.filter(child => {
        if (!child.requiredRoles) return true;
        return child.requiredRoles.some(role => hasRole(role as any));
      }) || [];

      if (filteredChildren.length === 0) return null;

      return (
        <div key={item.title}>
          <button
            onClick={(e) => toggleExpand(item.title, e)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors w-full text-left",
              level > 0 && "ml-4",
              (hasActiveChildren || isExpanded)
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="truncate flex-1">{item.title}</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-180"
                )} />
              </>
            )}
          </button>
          
          {!isCollapsed && isExpanded && (
            <div className="mt-1 space-y-1">
              {filteredChildren.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={() => handleItemClick(item.href)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
          level > 0 && "ml-4",
          level > 1 && "ml-8",
          isActive
            ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="truncate">{item.title}</span>
            {item.badge && (
              <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900">
            Navigasi
          </h2>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navigation Items */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {filteredItems.map(item => renderMenuItem(item))}
        </nav>
      </ScrollArea>

      {/* User Info at Bottom */}
      {!isCollapsed && user && (
        <>
          <Separator />
          <div className="p-4">
            <div className="text-sm">
              <p className="font-medium text-gray-900 truncate">
                {user.profile?.full_name || user.email}
              </p>
              {user.roles && user.roles.length > 0 && (
                <p className="text-gray-500 text-xs truncate">
                  {user.roles[0].replace('_', ' ').toUpperCase()}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
