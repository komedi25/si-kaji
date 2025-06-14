import { useAuth } from '@/hooks/useAuth';
import { RoleBasedStats } from './RoleBasedStats';
import { DashboardCharts } from './DashboardCharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Calendar, Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardHome = () => {
  const { user } = useAuth();

  // Get recent notifications
  const { data: notifications } = useQuery({
    queryKey: ['recent-notifications'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get urgent tasks based on role
  const { data: urgentTasks } = useQuery({
    queryKey: ['urgent-tasks', user?.roles],
    queryFn: async () => {
      const tasks = [];

      if (user?.roles?.includes('wali_kelas')) {
        // Check for pending permits
        const { data: permits } = await supabase
          .from('student_permits')
          .select('id, student_id, permit_type, students(full_name)')
          .eq('status', 'pending')
          .limit(3);

        if (permits) {
          tasks.push(...permits.map(permit => ({
            id: permit.id,
            type: 'permit',
            title: `Izin ${permit.permit_type}`,
            description: `Dari ${permit.students?.full_name}`,
            priority: 'medium' as const,
            link: '/permit-management'
          })));
        }
      }

      if (user?.roles?.includes('guru_bk')) {
        // Check for pending cases
        const { data: cases } = await supabase
          .from('student_cases')
          .select('id, title, priority')
          .eq('status', 'pending')
          .limit(3);

        if (cases) {
          tasks.push(...cases.map(case_item => ({
            id: case_item.id,
            type: 'case',
            title: case_item.title,
            description: 'Kasus baru perlu ditangani',
            priority: case_item.priority as 'low' | 'medium' | 'high' | 'urgent',
            link: '/case-management'
          })));
        }
      }

      if (user?.roles?.includes('admin')) {
        // Check for AI recommendations
        const { data: recommendations } = await supabase
          .from('ai_recommendations')
          .select('id, title, priority')
          .eq('status', 'pending')
          .eq('assigned_role', 'admin')
          .limit(3);

        if (recommendations) {
          tasks.push(...recommendations.map(rec => ({
            id: rec.id,
            type: 'ai_recommendation',
            title: rec.title,
            description: 'Rekomendasi AI baru',
            priority: rec.priority as 'low' | 'medium' | 'high' | 'urgent',
            link: '/ai-management'
          })));
        }
      }

      return tasks.slice(0, 5); // Limit to 5 most urgent
    },
    enabled: !!user?.roles,
  });

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-4 md:px-6 md:py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-1">
                {getWelcomeMessage()}
              </h1>
              <p className="text-blue-100 text-sm md:text-base mb-2">
                SMK Negeri 1 Kendal
              </p>
              <div className="flex items-center gap-2 text-blue-100 text-xs md:text-sm">
                <Calendar className="h-4 w-4" />
                <span>{getCurrentTime()}</span>
              </div>
            </div>
            {user?.roles && user.roles.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {user.roles.slice(1, 3).map((role) => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {getRoleDisplayName(role)}
                  </Badge>
                ))}
                {user.roles.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{user.roles.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Urgent Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Tugas Mendesak
            </CardTitle>
            <CardDescription>
              Item yang memerlukan perhatian segera
            </CardDescription>
          </CardHeader>
          <CardContent>
            {urgentTasks && urgentTasks.length > 0 ? (
              <div className="space-y-3">
                {urgentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                      </div>
                    </div>
                    <Link to={task.link}>
                      <Button variant="outline" size="sm">
                        Lihat
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>Tidak ada tugas mendesak saat ini</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifikasi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications && notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-2 border-l-2 border-blue-500 bg-blue-50 rounded">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
                <Link to="/notifications">
                  <Button variant="outline" size="sm" className="w-full">
                    Lihat Semua
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Tidak ada notifikasi baru</p>
              </div>
            )}
          </CardContent>
        </Card>
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
