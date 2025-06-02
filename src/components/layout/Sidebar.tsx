
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
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRoles?: string[];
  badge?: string;
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
      title: 'Manajemen Pengguna',
      href: '/users',
      icon: Users,
      requiredRoles: ['admin_sistem'],
    },
    {
      title: 'Data Siswa',
      href: '/siswa',
      icon: UserCheck,
      requiredRoles: ['admin_kesiswaan', 'wali_kelas', 'guru_bk'],
    },
    {
      title: 'Ekstrakurikuler',
      href: '/ekstrakurikuler',
      icon: BookOpen,
      requiredRoles: ['koordinator_ekstrakurikuler', 'pelatih_ekstrakurikuler'],
    },
    {
      title: 'Kasus & BK',
      href: '/kasus',
      icon: Shield,
      requiredRoles: ['guru_bk', 'tppk', 'arps', 'p4gn'],
    },
    {
      title: 'Laporan',
      href: '/laporan',
      icon: BarChart3,
      requiredRoles: ['kepala_sekolah', 'waka_kesiswaan', 'admin_kesiswaan'],
    },
    {
      title: 'Master Data',
      href: '/master-data',
      icon: School,
      requiredRoles: ['admin_sistem'],
    },
    {
      title: 'Pengaturan',
      href: '/settings',
      icon: Settings,
    },
  ];

  const filteredItems = sidebarItems.filter(item => {
    if (!item.requiredRoles) return true;
    return item.requiredRoles.some(role => hasRole(role as any));
  });

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900">
            SMK N 1 Kendal
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
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0")} />
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
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info at Bottom */}
      {!isCollapsed && user && (
        <div className="border-t p-4">
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
      )}
    </div>
  );
};
