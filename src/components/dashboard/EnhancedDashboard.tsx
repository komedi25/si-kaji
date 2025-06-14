
import { useAuth } from '@/hooks/useAuth';
import { RealDataStats } from './RealDataStats';
import { DashboardCharts } from './DashboardCharts';
import { RealtimeUpdates } from './RealtimeUpdates';
import { ProductionReadinessWidget } from './ProductionReadinessWidget';
import { DataExporter } from '../exports/DataExporter';
import { CaseStatistics } from '../cases/CaseStatistics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Calendar, Users, TrendingUp, AlertTriangle, CheckCircle, Download, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

export const EnhancedDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Get recent activities
  const { data: recentActivities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const [violations, achievements, cases] = await Promise.all([
        supabase
          .from('student_violations')
          .select(`
            id, violation_date, description,
            students(full_name),
            violation_types(name)
          `)
          .eq('status', 'active')
          .order('violation_date', { ascending: false })
          .limit(3),
        
        supabase
          .from('student_achievements')
          .select(`
            id, achievement_date, description,
            students(full_name),
            achievement_types(name)
          `)
          .eq('status', 'verified')
          .order('achievement_date', { ascending: false })
          .limit(3),

        supabase
          .from('student_cases')
          .select('id, title, created_at, status, priority')
          .order('created_at', { ascending: false })
          .limit(3)
      ]);

      return {
        violations: violations.data || [],
        achievements: achievements.data || [],
        cases: cases.data || []
      };
    },
    enabled: !!user,
  });

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'admin': 'Administrator',
      'kepala_sekolah': 'Kepala Sekolah',
      'tppk': 'TPPK',
      'wali_kelas': 'Wali Kelas',
      'guru_bk': 'Guru BK',
      'waka_kesiswaan': 'Waka Kesiswaan'
    };
    return roleNames[role] || role;
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
    <div className="space-y-6">
      {/* Welcome Section dengan Data Real */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden shadow rounded-lg">
        <div className="px-6 py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Dashboard {user?.roles?.[0] ? getRoleDisplayName(user.roles[0]) : 'Kesiswaan'}
              </h1>
              <p className="text-blue-100 mb-2">
                SMK Negeri 1 Kendal - Sistem Informasi Kesiswaan Terpadu
              </p>
              <div className="flex items-center gap-2 text-blue-100 text-sm">
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

      {/* Production Readiness Widget for Admin */}
      {user?.roles?.includes('admin') && (
        <ProductionReadinessWidget />
      )}

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analisis</TabsTrigger>
          <TabsTrigger value="cases">Kasus</TabsTrigger>
          <TabsTrigger value="activities">Aktivitas</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Real Database Statistics */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Statistik Real-time</h2>
            <RealDataStats />
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Pelanggaran Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivities?.violations && recentActivities.violations.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivities.violations.map((violation: any) => (
                      <div key={violation.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{violation.students?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{violation.violation_types?.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(violation.violation_date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Link to="/violations">
                      <Button variant="outline" size="sm" className="w-full">
                        Lihat Semua Pelanggaran
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>Tidak ada pelanggaran terbaru</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Prestasi Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivities?.achievements && recentActivities.achievements.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivities.achievements.map((achievement: any) => (
                      <div key={achievement.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{achievement.students?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{achievement.achievement_types?.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(achievement.achievement_date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Link to="/achievements">
                      <Button variant="outline" size="sm" className="w-full">
                        Lihat Semua Prestasi
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Belum ada prestasi terbaru</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Analisis Data Terkini</h2>
            <DashboardCharts />
          </div>
        </TabsContent>

        <TabsContent value="cases" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Statistik Kasus</h2>
            <CaseStatistics />
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Sistem Terbaru</CardTitle>
              <CardDescription>
                Monitoring aktivitas real-time dari seluruh sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities?.cases && recentActivities.cases.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.cases.map((case_item: any) => (
                    <div key={case_item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(case_item.priority)}`} />
                        <div>
                          <p className="font-medium text-sm">{case_item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Status: {case_item.status} • {new Date(case_item.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={case_item.status === 'pending' ? 'destructive' : 'default'}>
                        {case_item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Tidak ada aktivitas terbaru</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <DataExporter />
        </TabsContent>
      </Tabs>

      {/* Realtime Updates Component */}
      <RealtimeUpdates />
    </div>
  );
};
