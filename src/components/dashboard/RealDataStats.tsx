
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, AlertTriangle, Award, GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DatabaseStats {
  totalStudents: number;
  activeStudents: number;
  totalClasses: number;
  totalViolations: number;
  totalAchievements: number;
  totalExtracurriculars: number;
  pendingCases: number;
  thisMonthViolations: number;
  thisMonthAchievements: number;
  attendanceToday: number;
  attendanceThisMonth: number;
}

export const RealDataStats = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['real-database-stats'],
    queryFn: async (): Promise<DatabaseStats> => {
      // Get student counts
      const { data: students } = await supabase
        .from('students')
        .select('status');

      // Get class count
      const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .eq('is_active', true);

      // Get violation counts
      const { data: violations } = await supabase
        .from('student_violations')
        .select('violation_date, status')
        .eq('status', 'active');

      // Get achievement counts  
      const { data: achievements } = await supabase
        .from('student_achievements')
        .select('achievement_date, status')
        .eq('status', 'verified');

      // Get extracurricular count
      const { data: extracurriculars } = await supabase
        .from('extracurriculars')
        .select('id')
        .eq('is_active', true);

      // Get pending cases
      const { data: pendingCases } = await supabase
        .from('student_cases')
        .select('id')
        .eq('status', 'pending');

      // Get attendance data (from student_self_attendances)
      const { data: attendanceToday } = await supabase
        .from('student_self_attendances')
        .select('id, status')
        .eq('attendance_date', new Date().toISOString().split('T')[0]);

      // Get total attendance this month
      const { data: attendanceThisMonth } = await supabase
        .from('student_self_attendances')
        .select('id, attendance_date')
        .gte('attendance_date', thisMonth.toISOString().split('T')[0]);

      // Calculate this month's data
      const thisMonth = new Date();
      thisMonth.setDate(1);
      
      const thisMonthViolations = violations?.filter(v => 
        new Date(v.violation_date) >= thisMonth
      ).length || 0;

      const thisMonthAchievements = achievements?.filter(a => 
        new Date(a.achievement_date) >= thisMonth
      ).length || 0;

      return {
        totalStudents: students?.length || 0,
        activeStudents: students?.filter(s => s.status === 'active').length || 0,
        totalClasses: classes?.length || 0,
        totalViolations: violations?.length || 0,
        totalAchievements: achievements?.length || 0,
        totalExtracurriculars: extracurriculars?.length || 0,
        pendingCases: pendingCases?.length || 0,
        thisMonthViolations,
        thisMonthAchievements,
        attendanceToday: attendanceToday?.length || 0,
        attendanceThisMonth: attendanceThisMonth?.length || 0
      };
    },
    enabled: !!user,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Siswa",
      value: stats?.totalStudents || 0,
      description: `${stats?.activeStudents || 0} siswa aktif`,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Total Kelas",
      value: stats?.totalClasses || 0,
      description: "Kelas aktif tahun ini",
      icon: GraduationCap,
      color: "text-green-600"
    },
    {
      title: "Pelanggaran Bulan Ini",
      value: stats?.thisMonthViolations || 0,
      description: `Total: ${stats?.totalViolations || 0} pelanggaran`,
      icon: AlertTriangle,
      color: "text-red-600"
    },
    {
      title: "Prestasi Bulan Ini",
      value: stats?.thisMonthAchievements || 0,
      description: `Total: ${stats?.totalAchievements || 0} prestasi`,
      icon: Award,
      color: "text-yellow-600"
    },
    {
      title: "Ekstrakurikuler",
      value: stats?.totalExtracurriculars || 0,
      description: "Kegiatan ekstrakurikuler aktif",
      icon: BookOpen,
      color: "text-purple-600"
    },
    {
      title: "Kasus Pending",
      value: stats?.pendingCases || 0,
      description: "Memerlukan tindak lanjut",
      icon: AlertTriangle,
      color: "text-orange-600"
    },
    {
      title: "Presensi Hari Ini",
      value: stats?.attendanceToday || 0,
      description: "Siswa yang sudah presensi",
      icon: UserCheck,
      color: "text-emerald-600"
    },
    {
      title: "Presensi Bulan Ini", 
      value: stats?.attendanceThisMonth || 0,
      description: "Total presensi bulan ini",
      icon: UserCheck,
      color: "text-cyan-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
