
import { StatCard } from '@/components/ui/stat-card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, AlertTriangle, Award, UserCheck, Clock, TrendingUp } from 'lucide-react';

export const ResponsiveStatsGrid = () => {
  const { user } = useAuth();

  // Fetch real-time statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [studentsData, violationsData, achievementsData, attendanceData] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('student_violations').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('student_achievements').select('id', { count: 'exact' }).eq('status', 'verified'),
        supabase.from('student_attendances').select('id, status', { count: 'exact' }).gte('attendance_date', new Date().toISOString().split('T')[0])
      ]);

      const todayPresent = attendanceData.data?.filter(a => a.status === 'present').length || 0;
      const todayTotal = attendanceData.count || 0;
      const attendanceRate = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;

      return {
        totalStudents: studentsData.count || 0,
        totalViolations: violationsData.count || 0,
        totalAchievements: achievementsData.count || 0,
        todayAttendanceRate: attendanceRate,
        todayPresent: todayPresent,
        todayTotal: todayTotal
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 sm:h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Siswa',
      value: stats?.totalStudents || 0,
      description: 'Siswa aktif',
      icon: Users,
      trend: 'neutral' as const,
      show: true
    },
    {
      title: 'Kehadiran Hari Ini',
      value: `${stats?.todayAttendanceRate || 0}%`,
      description: `${stats?.todayPresent || 0} dari ${stats?.todayTotal || 0} siswa`,
      icon: UserCheck,
      trend: (stats?.todayAttendanceRate || 0) >= 80 ? 'up' : 'down' as const,
      show: user?.roles?.some(role => ['admin', 'wali_kelas', 'tppk'].includes(role))
    },
    {
      title: 'Total Pelanggaran',
      value: stats?.totalViolations || 0,
      description: 'Pelanggaran aktif',
      icon: AlertTriangle,
      trend: 'down' as const,
      show: user?.roles?.some(role => ['admin', 'tppk', 'wali_kelas'].includes(role))
    },
    {
      title: 'Total Prestasi',
      value: stats?.totalAchievements || 0,
      description: 'Prestasi terverifikasi',
      icon: Award,
      trend: 'up' as const,
      show: user?.roles?.some(role => ['admin', 'wali_kelas', 'siswa'].includes(role))
    }
  ].filter(card => card.show);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {statsCards.map((card, index) => (
        <StatCard
          key={index}
          title={card.title}
          value={card.value}
          description={card.description}
          icon={card.icon}
          trend={card.trend}
          className="min-h-[6rem] sm:min-h-[8rem]"
        />
      ))}
    </div>
  );
};
