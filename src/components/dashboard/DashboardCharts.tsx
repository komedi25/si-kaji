
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

interface ViolationTrend {
  month: string;
  count: number;
}

interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
}

interface AchievementsByLevel {
  level: string;
  count: number;
  percentage: number;
}

export const DashboardCharts = () => {
  const { user } = useAuth();

  // Get violation trends for the last 6 months
  const { data: violationTrends, isLoading: loadingViolations } = useQuery({
    queryKey: ['violation-trends'],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from('student_violations')
        .select('violation_date')
        .gte('violation_date', sixMonthsAgo.toISOString().split('T')[0])
        .eq('status', 'active');

      if (error) throw error;

      // Group by month
      const monthlyData = data?.reduce((acc: Record<string, number>, violation) => {
        const month = new Date(violation.violation_date).toLocaleDateString('id-ID', { 
          year: 'numeric', 
          month: 'short' 
        });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {}) || {};

      return Object.entries(monthlyData).map(([month, count]) => ({
        month,
        count
      })) as ViolationTrend[];
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('tppk')),
  });

  // Get attendance trends for the last 30 days
  const { data: attendanceTrends, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance-trends'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('student_attendances')
        .select('attendance_date, status')
        .gte('attendance_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('attendance_date', { ascending: true });

      if (error) throw error;

      // Group by date and status
      const dailyData = data?.reduce((acc: Record<string, { present: number; absent: number; late: number }>, attendance) => {
        const date = new Date(attendance.attendance_date).toLocaleDateString('id-ID', { 
          day: 'numeric', 
          month: 'short' 
        });
        if (!acc[date]) {
          acc[date] = { present: 0, absent: 0, late: 0 };
        }
        if (attendance.status === 'present') acc[date].present++;
        else if (attendance.status === 'absent') acc[date].absent++;
        else if (attendance.status === 'late') acc[date].late++;
        return acc;
      }, {}) || {};

      return Object.entries(dailyData).map(([date, counts]) => ({
        date,
        ...counts
      })) as AttendanceTrend[];
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('wali_kelas')),
  });

  // Get achievements by level
  const { data: achievementsByLevel, isLoading: loadingAchievements } = useQuery({
    queryKey: ['achievements-by-level'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_achievements')
        .select(`
          achievement_types (
            level
          )
        `)
        .eq('status', 'verified');

      if (error) throw error;

      // Group by level
      const levelCounts = data?.reduce((acc: Record<string, number>, achievement: any) => {
        const level = achievement.achievement_types?.level || 'unknown';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {}) || {};

      const total = Object.values(levelCounts).reduce((sum, count) => sum + count, 0);

      return Object.entries(levelCounts).map(([level, count]) => ({
        level: level.charAt(0).toUpperCase() + level.slice(1),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      })) as AchievementsByLevel[];
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('wali_kelas')),
  });

  // Get discipline score trends
  const { data: disciplineTrends, isLoading: loadingDiscipline } = useQuery({
    queryKey: ['discipline-trends'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_discipline_points')
        .select('final_score, last_updated')
        .order('last_updated', { ascending: true })
        .limit(50);

      if (error) throw error;

      return data?.map((point, index) => ({
        period: `Period ${index + 1}`,
        average_score: point.final_score
      })) || [];
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('waka_kesiswaan')),
  });

  if (!user?.roles) return null;

  const isLoading = loadingViolations || loadingAttendance || loadingAchievements || loadingDiscipline;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Violation Trends */}
      {(user.roles.includes('admin') || user.roles.includes('tppk')) && (
        <Card>
          <CardHeader>
            <CardTitle>Trend Pelanggaran</CardTitle>
            <CardDescription>Statistik pelanggaran 6 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div>Memuat data...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={violationTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" name="Jumlah Pelanggaran" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attendance Trends */}
      {(user.roles.includes('admin') || user.roles.includes('wali_kelas')) && (
        <Card>
          <CardHeader>
            <CardTitle>Trend Kehadiran</CardTitle>
            <CardDescription>Statistik kehadiran 30 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div>Memuat data...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={attendanceTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="present" 
                    stackId="1" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    name="Hadir"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="late" 
                    stackId="1" 
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    name="Terlambat"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="absent" 
                    stackId="1" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    name="Tidak Hadir"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Achievements by Level */}
      {(user.roles.includes('admin') || user.roles.includes('wali_kelas')) && (
        <Card>
          <CardHeader>
            <CardTitle>Prestasi Berdasarkan Level</CardTitle>
            <CardDescription>Distribusi prestasi siswa</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div>Memuat data...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={achievementsByLevel || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ level, percentage }) => `${level} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(achievementsByLevel || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Discipline Score Trends */}
      {(user.roles.includes('admin') || user.roles.includes('waka_kesiswaan')) && (
        <Card>
          <CardHeader>
            <CardTitle>Trend Skor Disiplin</CardTitle>
            <CardDescription>Rata-rata skor disiplin siswa</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div>Memuat data...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={disciplineTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="average_score" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Skor Rata-rata"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
