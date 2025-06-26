
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, BookOpen, Trophy, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';

interface HomeroomAnalyticsProps {
  classId: string;
}

export const HomeroomAnalytics = ({ classId }: HomeroomAnalyticsProps) => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['homeroom-analytics', classId],
    queryFn: async () => {
      // Fetch class statistics
      const { data: classData } = await supabase
        .from('classes')
        .select('name, max_students')
        .eq('id', classId)
        .single();

      // Fetch student count
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('student_id')
        .eq('class_id', classId)
        .eq('status', 'active');

      // Fetch attendance statistics for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: attendanceData } = await supabase
        .from('student_attendances')
        .select('status, attendance_date')
        .eq('class_id', classId)
        .gte('attendance_date', thirtyDaysAgo.toISOString().split('T')[0]);

      // Fetch achievements
      const { data: achievements } = await supabase
        .from('student_achievements')
        .select('student_id, point_reward')
        .in('student_id', enrollments?.map(e => e.student_id) || [])
        .eq('status', 'verified');

      // Fetch violations
      const { data: violations } = await supabase
        .from('student_violations')
        .select('student_id, point_deduction')
        .in('student_id', enrollments?.map(e => e.student_id) || [])
        .eq('status', 'active');

      return {
        className: classData?.name || 'Unknown Class',
        totalStudents: enrollments?.length || 0,
        maxStudents: classData?.max_students || 36,
        attendanceData: attendanceData || [],
        achievements: achievements || [],
        violations: violations || []
      };
    },
    enabled: !!classId
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { className, totalStudents, maxStudents, attendanceData, achievements, violations } = analyticsData || {};

  // Calculate attendance statistics
  const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
  const lateCount = attendanceData?.filter(a => a.status === 'late').length || 0;
  const absentCount = attendanceData?.filter(a => a.status === 'absent').length || 0;
  const totalAttendance = presentCount + lateCount + absentCount;
  const attendanceRate = totalAttendance > 0 ? Math.round(((presentCount + lateCount) / totalAttendance) * 100) : 0;

  // Calculate achievement and violation statistics
  const totalAchievementPoints = achievements?.reduce((sum, a) => sum + (a.point_reward || 0), 0) || 0;
  const totalViolationPoints = violations?.reduce((sum, v) => sum + (v.point_deduction || 0), 0) || 0;

  const pieData = [
    { name: 'Hadir', value: presentCount, color: '#10b981' },
    { name: 'Terlambat', value: lateCount, color: '#f59e0b' },
    { name: 'Tidak Hadir', value: absentCount, color: '#ef4444' }
  ];

  const statsCards = [
    {
      title: 'Total Siswa',
      value: `${totalStudents}/${maxStudents}`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Tingkat Kehadiran',
      value: `${attendanceRate}%`,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Prestasi',
      value: totalAchievementPoints.toString(),
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Total Pelanggaran',
      value: totalViolationPoints.toString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Analitik Kelas</h2>
        <p className="opacity-90">{className}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <Card key={index} className={`${card.bgColor} border-0`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                present: { label: "Hadir", color: "#10b981" },
                late: { label: "Terlambat", color: "#f59e0b" },
                absent: { label: "Tidak Hadir", color: "#ef4444" }
              }}
              className="h-[250px]"
            >
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performa Kelas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kapasitas Kelas</span>
                <span className="text-sm text-gray-600">{Math.round((totalStudents / maxStudents) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min((totalStudents / maxStudents) * 100, 100)}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tingkat Kehadiran</span>
                <span className="text-sm text-gray-600">{attendanceRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
