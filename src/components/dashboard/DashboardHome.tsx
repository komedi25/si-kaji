
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { RealtimeUpdates } from '@/components/dashboard/RealtimeUpdates';
import { RoleBasedStats } from '@/components/dashboard/RoleBasedStats';
import { SelfAttendanceWidget } from '@/components/attendance/SelfAttendanceWidget';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, AlertTriangle, Trophy } from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  attendanceToday: {
    total: number;
    present: number;
    percentage: number;
  };
  activeViolations: number;
  monthlyAchievements: number;
}

export const DashboardHome = () => {
  const { hasRole } = useAuth();

  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);

      // Get total students
      const { data: students } = await supabase
        .from('students')
        .select('id, status')
        .eq('status', 'active');

      const totalStudents = students?.length || 0;

      // Get today's attendance
      const { data: todayAttendance } = await supabase
        .from('student_attendances')
        .select('status')
        .eq('attendance_date', today);

      const attendanceTotal = todayAttendance?.length || 0;
      const attendancePresent = todayAttendance?.filter(a => a.status === 'present').length || 0;
      const attendancePercentage = attendanceTotal > 0 ? (attendancePresent / attendanceTotal) * 100 : 0;

      // Get active violations
      const { data: violations } = await supabase
        .from('student_violations')
        .select('id')
        .eq('status', 'active');

      const activeViolations = violations?.length || 0;

      // Get this month's achievements
      const { data: achievements } = await supabase
        .from('student_achievements')
        .select('id')
        .eq('status', 'verified')
        .gte('achievement_date', `${thisMonth}-01`)
        .lt('achievement_date', `${thisMonth}-32`);

      const monthlyAchievements = achievements?.length || 0;

      return {
        totalStudents,
        attendanceToday: {
          total: attendanceTotal,
          present: attendancePresent,
          percentage: attendancePercentage
        },
        activeViolations,
        monthlyAchievements
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const StatsCard = ({ title, value, description, icon: Icon, trend = 'neutral' }: {
    title: string;
    value: string | number;
    description: string;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
  }) => {
    const getTrendColor = () => {
      switch (trend) {
        case 'up':
          return 'text-green-600';
        case 'down':
          return 'text-red-600';
        default:
          return 'text-gray-600';
      }
    };

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isLoading ? "..." : value.toLocaleString()}</div>
          <p className={`text-xs ${getTrendColor()}`}>
            {description}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Siswa"
          value={dashboardStats?.totalStudents || 0}
          description="Siswa aktif terdaftar"
          icon={Users}
        />
        <StatsCard
          title="Presensi Hari Ini"
          value={`${dashboardStats?.attendanceToday.percentage.toFixed(1) || 0}%`}
          description={`${dashboardStats?.attendanceToday.present || 0} dari ${dashboardStats?.attendanceToday.total || 0} siswa`}
          icon={UserCheck}
        />
        <StatsCard
          title="Pelanggaran Aktif"
          value={dashboardStats?.activeViolations || 0}
          description="Perlu tindak lanjut"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Prestasi Bulan Ini"
          value={dashboardStats?.monthlyAchievements || 0}
          description="Prestasi terverifikasi"
          icon={Trophy}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Self Attendance Widget - Only for students */}
        {hasRole('siswa') && (
          <div className="lg:col-span-4">
            <SelfAttendanceWidget />
          </div>
        )}
        
        {/* Role-based Statistics */}
        <div className={hasRole('siswa') ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <RoleBasedStats />
        </div>
      </div>

      {/* Charts and Updates */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        <div className="order-1">
          <DashboardCharts />
        </div>
        <div className="order-2">
          <RealtimeUpdates />
        </div>
      </div>
    </div>
  );
};
