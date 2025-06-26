
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { format, subDays, startOfWeek } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface HomeroomAnalyticsProps {
  classId: string;
}

export const HomeroomAnalytics = ({ classId }: HomeroomAnalyticsProps) => {
  // Query untuk analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['homeroom-analytics', classId],
    queryFn: async () => {
      // Get students in class
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('students(id)')
        .eq('class_id', classId)
        .eq('status', 'active');

      const studentIds = enrollments?.map(e => e.students?.id).filter(Boolean) || [];

      // Get attendance data for the last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data: attendanceData } = await supabase
        .from('student_self_attendances')
        .select('attendance_date, status')
        .in('student_id', studentIds)
        .gte('attendance_date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .order('attendance_date');

      // Group attendance by date
      const attendanceByDate: Record<string, { present: number; late: number; absent: number }> = {};
      
      // Initialize all dates with zero values
      for (let i = 0; i < 30; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        attendanceByDate[date] = { present: 0, late: 0, absent: 0 };
      }

      // Fill in actual data
      attendanceData?.forEach(record => {
        const date = record.attendance_date;
        if (attendanceByDate[date]) {
          if (record.status === 'present') attendanceByDate[date].present++;
          else if (record.status === 'late') attendanceByDate[date].late++;
          else attendanceByDate[date].absent++;
        }
      });

      const attendanceTrend = Object.entries(attendanceByDate)
        .map(([date, stats]) => ({
          date: format(new Date(date), 'dd/MM', { locale: localeId }),
          fullDate: date,
          ...stats,
          total: stats.present + stats.late,
          rate: studentIds.length > 0 ? Math.round(((stats.present + stats.late) / studentIds.length) * 100) : 0
        }))
        .reverse();

      // Get violations trend
      const { data: violationsData } = await supabase
        .from('student_violations')
        .select('violation_date, point_deduction')
        .in('student_id', studentIds)
        .gte('violation_date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .order('violation_date');

      const violationsByDate: Record<string, number> = {};
      violationsData?.forEach(violation => {
        const date = violation.violation_date;
        violationsByDate[date] = (violationsByDate[date] || 0) + 1;
      });

      const violationsTrend = Object.entries(violationsByDate)
        .map(([date, count]) => ({
          date: format(new Date(date), 'dd/MM', { locale: localeId }),
          violations: count
        }));

      // Get achievements trend
      const { data: achievementsData } = await supabase
        .from('student_achievements')
        .select('achievement_date')
        .in('student_id', studentIds)
        .eq('status', 'verified')
        .gte('achievement_date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .order('achievement_date');

      const achievementsByDate: Record<string, number> = {};
      achievementsData?.forEach(achievement => {
        const date = achievement.achievement_date;
        achievementsByDate[date] = (achievementsByDate[date] || 0) + 1;
      });

      const achievementsTrend = Object.entries(achievementsByDate)
        .map(([date, count]) => ({
          date: format(new Date(date), 'dd/MM', { locale: localeId }),
          achievements: count
        }));

      return {
        attendanceTrend,
        violationsTrend,
        achievementsTrend,
        totalStudents: studentIds.length
      };
    },
    enabled: !!classId
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const currentWeekAttendance = analyticsData?.attendanceTrend.slice(-7) || [];
  const averageAttendanceRate = currentWeekAttendance.length > 0 
    ? Math.round(currentWeekAttendance.reduce((sum, day) => sum + day.rate, 0) / currentWeekAttendance.length)
    : 0;

  const totalViolationsThisWeek = analyticsData?.violationsTrend
    .slice(-7)
    .reduce((sum, day) => sum + day.violations, 0) || 0;

  const totalAchievementsThisWeek = analyticsData?.achievementsTrend
    .slice(-7)
    .reduce((sum, day) => sum + day.achievements, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Kehadiran Minggu Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{averageAttendanceRate}%</div>
            <p className="text-xs text-muted-foreground">7 hari terakhir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggaran Minggu Ini</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalViolationsThisWeek}</div>
            <p className="text-xs text-muted-foreground">Total kasus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestasi Minggu Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalAchievementsThisWeek}</div>
            <p className="text-xs text-muted-foreground">Prestasi baru</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Kehadiran (30 Hari)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                rate: { label: "Tingkat Kehadiran (%)", color: "#3b82f6" }
              }}
              className="h-[300px]"
            >
              <LineChart data={analyticsData?.attendanceTrend || []}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  dataKey="rate" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Tingkat Kehadiran (%)"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Daily Attendance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Kehadiran Harian</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                present: { label: "Hadir", color: "#10b981" },
                late: { label: "Terlambat", color: "#f59e0b" }
              }}
              className="h-[300px]"
            >
              <BarChart data={analyticsData?.attendanceTrend.slice(-14) || []}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="present" fill="#10b981" name="Hadir" />
                <Bar dataKey="late" fill="#f59e0b" name="Terlambat" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Analisis Kinerja Kelas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Tingkat Kehadiran</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Sangat Baik (≥95%)</span>
                  <span className={`text-sm font-medium ${averageAttendanceRate >= 95 ? 'text-green-600' : 'text-gray-400'}`}>
                    {averageAttendanceRate >= 95 ? '✓' : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Baik (85-94%)</span>
                  <span className={`text-sm font-medium ${averageAttendanceRate >= 85 && averageAttendanceRate < 95 ? 'text-blue-600' : 'text-gray-400'}`}>
                    {averageAttendanceRate >= 85 && averageAttendanceRate < 95 ? '✓' : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Perlu Perhatian (<85%)</span>
                  <span className={`text-sm font-medium ${averageAttendanceRate < 85 ? 'text-red-600' : 'text-gray-400'}`}>
                    {averageAttendanceRate < 85 ? '⚠' : '-'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Kedisiplinan</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Pelanggaran Minggu Ini</span>
                  <span className={`text-sm font-medium ${totalViolationsThisWeek === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalViolationsThisWeek}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Prestasi Minggu Ini</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {totalAchievementsThisWeek}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
