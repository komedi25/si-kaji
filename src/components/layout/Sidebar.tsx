
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Home, Users, UserCheck, FileText, MessageSquare, Calendar,
  GraduationCap, Shield, Award, AlertTriangle, BarChart3,
  Settings, ChevronRight, ChevronDown, BookOpen, Brain,
  School, ClipboardList, FileSearch, Heart, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  icon: any;
  href?: string;
  roles?: string[];
  children?: MenuItem[];
  badge?: string;
}

export const Sidebar = () => {
  const { user, hasRole } = useAuth();
  const location = useLocation();
  const [openItems, setOpenItems] = useState<string[]>(['data-siswa']);

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      roles: ['admin', 'kepala_sekolah', 'waka_kesiswaan', 'wali_kelas', 'guru_bk', 'siswa', 'orang_tua', 'tppk', 'arps', 'p4gn', 'koordinator_ekstrakurikuler', 'pelatih_ekstrakurikuler', 'penanggung_jawab_sarpras']
    },
    {
      title: 'Data & Pengguna',
      icon: Users,
      roles: ['admin', 'wali_kelas', 'guru_bk', 'siswa'],
      children: [
        {
          title: 'Manajemen Pengguna',
          icon: Users,
          href: '/user-management',
          roles: ['admin', 'wali_kelas', 'guru_bk', 'siswa']
        },
        {
          title: 'Master Data',
          icon: School,
          href: '/master-data',
          roles: ['admin']
        }
      ]
    },
    {
      title: 'Presensi & Disiplin',
      icon: UserCheck,
      roles: ['admin', 'wali_kelas', 'guru_bk', 'tppk', 'siswa'],
      children: [
        {
          title: 'Presensi Mandiri',
          icon: UserCheck,
          href: '/attendance/self',
          roles: ['admin', 'wali_kelas', 'guru_bk', 'tppk', 'siswa']
        },
        {
          title: 'Input Presensi',
          icon: ClipboardList,
          href: '/attendance/record',
          roles: ['admin', 'wali_kelas', 'guru_bk', 'tppk']
        },
        {
          title: 'Laporan Presensi',
          icon: BarChart3,
          href: '/attendance/report',
          roles: ['admin', 'wali_kelas', 'guru_bk', 'tppk']
        },
        {
          title: 'Kelola Lokasi',
          icon: MapPin,
          href: '/attendance/location',
          roles: ['admin']
        },
        {
          title: 'Kelola Jadwal',
          icon: Calendar,
          href: '/attendance/schedule',
          roles: ['admin']
        }
      ]
    },
    {
      title: 'Pelanggaran',
      icon: AlertTriangle,
      href: '/violations',
      roles: ['admin', 'wali_kelas', 'guru_bk', 'tppk']
    },
    {
      title: 'Prestasi',
      icon: Award,
      href: '/achievements',
      roles: ['admin', 'wali_kelas', 'guru_bk', 'siswa']
    },
    {
      title: 'Verifikasi Prestasi',
      icon: Shield,
      href: '/achievement-verification',
      roles: ['admin', 'wali_kelas']
    },
    {
      title: 'Poin Disiplin',
      icon: BarChart3,
      href: '/discipline-points',
      roles: ['admin', 'wali_kelas', 'guru_bk', 'tppk']
    },
    {
      title: 'Perizinan',
      icon: FileText,
      href: '/permits',
      roles: ['admin', 'wali_kelas', 'siswa']
    },
    {
      title: 'Konseling',
      icon: Heart,
      href: '/counseling',
      roles: ['admin', 'guru_bk', 'siswa']
    },
    {
      title: 'Kasus & Pelaporan',
      icon: FileSearch,
      href: '/cases',
      roles: ['admin', 'tppk', 'arps', 'p4gn', 'wali_kelas', 'guru_bk']
    },
    {
      title: 'Ekstrakurikuler',
      icon: Activity,
      href: '/extracurricular',
      roles: ['admin', 'wali_kelas', 'pelatih_ekstrakurikuler', 'koordinator_ekstrakurikuler', 'siswa']
    },
    {
      title: 'Jurnal Perwalian',
      icon: BookOpen,
      href: '/homeroom-journal',
      roles: ['admin', 'wali_kelas']
    },
    {
      title: 'Portal Orang Tua',
      icon: Users,
      href: '/parent-portal',
      roles: ['admin', 'wali_kelas', 'orang_tua']
    },
    {
      title: 'Proposal Kegiatan',
      icon: ClipboardList,
      href: '/activity-proposal',
      roles: ['admin', 'wali_kelas', 'siswa', 'koordinator_ekstrakurikuler']
    },
    {
      title: 'AI Assistant',
      icon: Brain,
      href: '/ai-management',
      roles: ['admin', 'wali_kelas', 'guru_bk']
    },
    {
      title: 'Dokumen',
      icon: FileText,
      href: '/documents',
      roles: ['admin', 'wali_kelas', 'guru_bk', 'siswa']
    },
    {
      title: 'Repositori Dokumen',
      icon: FileSearch,
      href: '/document-repository',
      roles: ['admin', 'siswa']
    },
    {
      title: 'Notifikasi',
      icon: MessageSquare,
      href: '/notifications',
      roles: ['admin']
    },
    {
      title: 'Status Sistem',
      icon: Activity,
      href: '/system-status',
      roles: ['admin']
    }
  ];

  const toggleOpen = (title: string) => {
    setOpenItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isItemVisible = (item: MenuItem) => {
    if (!item.roles) return true;
    return item.roles.some(role => hasRole(role as any));
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (!isItemVisible(item)) return null;

    const isCurrentActive = item.href ? isActive(item.href) : false;
    const hasActiveChild = item.children?.some(child => child.href && isActive(child.href));
    const isOpen = openItems.includes(item.title);

    if (item.children) {
      return (
        <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleOpen(item.title)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-between hover:bg-gray-100 transition-colors",
                (hasActiveChild || isCurrentActive) && "bg-blue-50 text-blue-700 border-r-2 border-blue-700",
                level > 0 && "ml-4"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.title}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {item.children.map(child => renderMenuItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link key={item.title} to={item.href!}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start hover:bg-gray-100 transition-colors",
            isCurrentActive && "bg-blue-50 text-blue-700 border-r-2 border-blue-700",
            level > 0 && "ml-4"
          )}
        >
          <item.icon className="h-4 w-4 mr-3" />
          <span className="text-sm font-medium">{item.title}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {item.badge}
            </Badge>
          )}
        </Button>
      </Link>
    );
  };

  if (!user) return null;

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 h-full">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="font-bold text-lg text-gray-900">Si-Kaji</h2>
            <p className="text-xs text-gray-500">SMK Negeri 1 Kendal</p>
          </div>
        </div>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">{user.profile?.full_name || user.email}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {user.roles.map(role => (
              <Badge key={role} variant="outline" className="text-xs">
                {role.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      
      <Separator />
      
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="space-y-1">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
      </ScrollArea>
      
      <Separator />
      
      <div className="p-2">
        <Link to="/settings">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start hover:bg-gray-100 transition-colors",
              isActive('/settings') && "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
            )}
          >
            <Settings className="h-4 w-4 mr-3" />
            <span className="text-sm font-medium">Pengaturan</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
