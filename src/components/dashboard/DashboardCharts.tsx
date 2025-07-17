
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, AlertTriangle, Trophy, Users, Activity, Calendar } from 'lucide-react';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6'
};

const chartConfig = {
  violations: {
    label: "Pelanggaran",
    color: COLORS.danger,
  },
  achievements: {
    label: "Prestasi",
    color: COLORS.success,
  },
  present: {
    label: "Hadir",
    color: COLORS.success,
  },
  absent: {
    label: "Tidak Hadir",
    color: COLORS.danger,
  },
  late: {
    label: "Terlambat",
    color: COLORS.warning,
  },
  discipline: {
    label: "Skor Disiplin",
    color: COLORS.primary,
  },
};

export const DashboardCharts = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('trends');

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
        count,
        fill: COLORS.danger
      }));
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
        .from('unified_attendances')
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
      }));
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
      const colors = [COLORS.success, COLORS.primary, COLORS.warning, COLORS.purple, COLORS.teal];

      return Object.entries(levelCounts).map(([level, count], index) => ({
        level: level.charAt(0).toUpperCase() + level.slice(1),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        fill: colors[index % colors.length]
      }));
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
        .limit(30);

      if (error) throw error;

      return data?.map((point, index) => ({
        period: `W${index + 1}`,
        score: point.final_score,
        fill: point.final_score >= 80 ? COLORS.success : point.final_score >= 60 ? COLORS.warning : COLORS.danger
      })) || [];
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('waka_kesiswaan')),
  });

  if (!user?.roles || user.roles.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Tidak ada data untuk ditampilkan</p>
      </div>
    );
  }

  const isLoading = loadingViolations || loadingAttendance || loadingAchievements || loadingDiscipline;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-80 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="trends" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Trend Data
        </TabsTrigger>
        <TabsTrigger value="distribution" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Distribusi
        </TabsTrigger>
        <TabsTrigger value="performance" className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Performa
        </TabsTrigger>
      </TabsList>

      <TabsContent value="trends" className="space-y-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Violation Trends */}
          {(user.roles.includes('admin') || user.roles.includes('tppk')) && violationTrends && (
            <Card className="border-red-200 bg-red-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Trend Pelanggaran
                </CardTitle>
                <CardDescription>6 bulan terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={violationTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#cbd5e1' }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="count" 
                        fill={COLORS.danger}
                        radius={[4, 4, 0, 0]}
                        className="animate-fade-in"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Attendance Trends */}
          {(user.roles.includes('admin') || user.roles.includes('wali_kelas')) && attendanceTrends && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Trend Kehadiran
                </CardTitle>
                <CardDescription>30 hari terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#cbd5e1' }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="present" 
                        stackId="1" 
                        stroke={COLORS.success} 
                        fill={COLORS.success}
                        fillOpacity={0.6}
                        className="animate-fade-in"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="late" 
                        stackId="1" 
                        stroke={COLORS.warning} 
                        fill={COLORS.warning}
                        fillOpacity={0.6}
                        className="animate-fade-in"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="absent" 
                        stackId="1" 
                        stroke={COLORS.danger} 
                        fill={COLORS.danger}
                        fillOpacity={0.6}
                        className="animate-fade-in"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="distribution" className="space-y-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Achievements Distribution */}
          {(user.roles.includes('admin') || user.roles.includes('wali_kelas')) && achievementsByLevel && (
            <Card className="border-green-200 bg-green-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-green-500" />
                  Distribusi Prestasi
                </CardTitle>
                <CardDescription>Berdasarkan tingkat prestasi</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={achievementsByLevel}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ level, percentage }) => `${level} (${percentage}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        className="animate-scale-in"
                      >
                        {achievementsByLevel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="performance" className="space-y-6 mt-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Discipline Score Trends */}
          {(user.roles.includes('admin') || user.roles.includes('waka_kesiswaan')) && disciplineTrends && (
            <Card className="border-purple-200 bg-purple-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  Trend Skor Disiplin
                </CardTitle>
                <CardDescription>Performa disiplin siswa dari waktu ke waktu</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={disciplineTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#cbd5e1' }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke={COLORS.primary} 
                        strokeWidth={3}
                        dot={{ fill: COLORS.primary, strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, className: "animate-pulse" }}
                        className="animate-fade-in"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};
