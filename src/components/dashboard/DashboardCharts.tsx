
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const DashboardCharts = () => {
  const { user } = useAuth();

  // Attendance trend data
  const { data: attendanceTrend } = useQuery({
    queryKey: ['attendance-trend'],
    queryFn: async () => {
      const dates = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return format(date, 'yyyy-MM-dd');
      });

      const trendData = await Promise.all(
        dates.map(async (date) => {
          const { data, error } = await supabase
            .from('student_attendances')
            .select('status')
            .eq('attendance_date', date);

          if (error) throw error;

          const present = data?.filter(a => a.status === 'present').length || 0;
          const absent = data?.filter(a => a.status === 'absent').length || 0;
          const late = data?.filter(a => a.status === 'late').length || 0;

          return {
            date: format(new Date(date), 'dd MMM', { locale: id }),
            hadir: present,
            tidak_hadir: absent,
            terlambat: late,
          };
        })
      );

      return trendData;
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('wali_kelas')),
  });

  // Violation categories data
  const { data: violationCategories } = useQuery({
    queryKey: ['violation-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_violations')
        .select(`
          violation_type:violation_types!student_violations_violation_type_id_fkey(category)
        `)
        .eq('status', 'active');

      if (error) throw error;

      const categoryCounts = data?.reduce((acc: Record<string, number>, violation) => {
        const category = violation.violation_type?.category || 'Lainnya';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(categoryCounts || {}).map(([name, value]) => ({
        name,
        value,
      }));
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('tppk')),
  });

  // Achievement categories data
  const { data: achievementCategories } = useQuery({
    queryKey: ['achievement-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_achievements')
        .select(`
          achievement_type:achievement_types!student_achievements_achievement_type_id_fkey(category)
        `)
        .eq('status', 'verified');

      if (error) throw error;

      const categoryCounts = data?.reduce((acc: Record<string, number>, achievement) => {
        const category = achievement.achievement_type?.category || 'Lainnya';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(categoryCounts || {}).map(([name, value]) => ({
        name,
        value,
      }));
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('wali_kelas')),
  });

  const chartConfig = {
    hadir: { label: 'Hadir', color: '#22c55e' },
    tidak_hadir: { label: 'Tidak Hadir', color: '#ef4444' },
    terlambat: { label: 'Terlambat', color: '#f59e0b' },
  };

  if (!user?.roles) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Attendance Trend Chart */}
      {(user.roles.includes('admin') || user.roles.includes('wali_kelas')) && attendanceTrend && (
        <Card>
          <CardHeader>
            <CardTitle>Tren Presensi 7 Hari Terakhir</CardTitle>
            <CardDescription>Grafik presensi harian siswa</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="hadir" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tidak_hadir" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="terlambat" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Violation Categories Chart */}
      {(user.roles.includes('admin') || user.roles.includes('tppk')) && violationCategories && (
        <Card>
          <CardHeader>
            <CardTitle>Kategori Pelanggaran</CardTitle>
            <CardDescription>Distribusi pelanggaran berdasarkan kategori</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={violationCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {violationCategories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Achievement Categories Chart */}
      {(user.roles.includes('admin') || user.roles.includes('wali_kelas')) && achievementCategories && (
        <Card>
          <CardHeader>
            <CardTitle>Kategori Prestasi</CardTitle>
            <CardDescription>Distribusi prestasi berdasarkan kategori</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={achievementCategories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <Bar dataKey="value" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
