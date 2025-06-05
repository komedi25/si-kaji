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
  Search,
  Download,
  Sliders
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

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, hasRole } = useAuth();
  const location = useLocation();

  const sidebarItems: SidebarItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      title: 'Data Siswa',
      href: '/student-management',
      icon: UserCheck,
      requiredRoles: ['admin_kesiswaan', 'wali_kelas', 'guru_bk'],
    },
    {
      title: 'Akademik',
      href: '#',
      icon: BookOpen,
      children: [
        {
          title: 'Presensi',
          href: '/attendance-management',
          icon: Calendar,
          requiredRoles: ['admin_kesiswaan', 'wali_kelas', 'guru_bk', 'tppk'],
        },
        {
          title: 'Pelanggaran',
          href: '/violation-management',
          icon: AlertTriangle,
          requiredRoles: ['admin_kesiswaan', 'wali_kelas', 'guru_bk', 'tppk'],
        },
        {
          title: 'Prestasi',
          href: '/achievement-management',
          icon: Trophy,
          requiredRoles: ['admin_kesiswaan', 'wali_kelas'],
        },
        {
          title: 'Poin Disiplin',
          href: '/discipline-points-management',
          icon: BarChart3,
          requiredRoles: ['admin_kesiswaan', 'wali_kelas', 'guru_bk'],
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
          href: '/activity-proposal',
          icon: ClipboardList,
          requiredRoles: ['koordinator_ekstrakurikuler', 'admin_kesiswaan'],
        },
        {
          title: 'Ekstrakurikuler',
          href: '/extracurricular-management',
          icon: BookOpen,
          requiredRoles: ['koordinator_ekstrakurikuler', 'pelatih_ekstrakurikuler'],
        },
        {
          title: 'Dokumen & Surat',
          href: '/document-management',
          icon: FileText,
          requiredRoles: ['admin_kesiswaan', 'admin_sistem'],
        },
      ],
    },
    {
      title: 'Konseling & BK',
      href: '#',
      icon: Heart,
      children: [
        {
          title: 'Sesi Konseling',
          href: '/counseling-management',
          icon: Heart,
          requiredRoles: ['guru_bk'],
        },
        {
          title: 'Manajemen Kasus',
          href: '/case-management',
          icon: Shield,
          requiredRoles: ['guru_bk', 'tppk', 'arps', 'p4gn'],
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
          href: '/permit-management',
          icon: MapPin,
          requiredRoles: ['admin_kesiswaan', 'wali_kelas'],
        },
        {
          title: 'Portal Orang Tua',
          href: '/parent-portal',
          icon: UsersIcon,
          requiredRoles: ['admin_kesiswaan', 'wali_kelas'],
        },
      ],
    },
    {
      title: 'Sistem & Pengaturan',
      href: '#',
      icon: Settings,
      children: [
        {
          title: 'Manajemen User',
          href: '/user-management',
          icon: Users,
          requiredRoles: ['admin_sistem'],
        },
        {
          title: 'Master Data',
          href: '/master-data',
          icon: Database,
          requiredRoles: ['admin_sistem'],
        },
        {
          title: 'Notifikasi',
          href: '/settings/notifications',
          icon: Bell,
        },
        {
          title: 'Analytics',
          href: '/settings/analytics',
          icon: LineChart,
        },
        {
          title: 'Global Search',
          href: '/settings/search',
          icon: Search,
        },
        {
          title: 'Export System',
          href: '/settings/export',
          icon: Download,
        },
        {
          title: 'Preferensi',
          href: '/settings/preferences',
          icon: Sliders,
        },
      ],
    },
  ];

  const filteredItems = sidebarItems.filter(item => {
    if (!item.requiredRoles) return true;
    return item.requiredRoles.some(role => hasRole(role as any));
  });

  const isItemActive = (href: string) => {
    if (href === '#') return false;
    return location.pathname === href;
  };

  const hasActiveChild = (children?: SidebarItem[]) => {
    if (!children) return false;
    return children.some(child => isItemActive(child.href));
  };

  const [expandedItems, setExpandedItems] = useState<string[]>(['Sistem & Pengaturan']);

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
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
            onClick={() => toggleExpand(item.title)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors w-full text-left",
              (hasActiveChildren || isExpanded)
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="truncate flex-1">{item.title}</span>
                <ChevronLeft className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-90"
                )} />
              </>
            )}
          </button>
          
          {!isCollapsed && isExpanded && (
            <div className="ml-6 mt-1 space-y-1">
              {filteredChildren.map(child => (
                <Link
                  key={child.href}
                  to={child.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                    isItemActive(child.href)
                      ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <child.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{child.title}</span>
                  {child.badge && (
                    <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      {child.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
          isActive
            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
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
            Navigation
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
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
