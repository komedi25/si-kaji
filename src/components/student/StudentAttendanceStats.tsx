
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

interface StudentAttendanceStatsProps {
  studentId: string;
}

export const StudentAttendanceStats = ({ studentId }: StudentAttendanceStatsProps) => {
  // Query untuk statistik kehadiran keseluruhan
  const { data: attendanceStats, isLoading } = useQuery({
    queryKey: ['student-attendance-stats', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('student_id', studentId)
        .order('attendance_date', { ascending: false });

      if (error) throw error;

      const total = data?.length || 0;
      const present = data?.filter(a => a.status === 'present').length || 0;
      const late = data?.filter(a => a.status === 'late').length || 0;
      const absent = total - present - late;

      return { total, present, late, absent, records: data || [] };
    },
  });

  // Query untuk trend kehadiran bulanan
  const { data: monthlyTrend } = useQuery({
    queryKey: ['student-monthly-attendance', studentId],
    queryFn: async () => {
      const startDate = startOfMonth(subDays(new Date(), 90));
      const endDate = endOfMonth(new Date());

      const { data, error } = await supabase
        .from('student_self_attendances')
        .select('attendance_date, status')
        .eq('student_id', studentId)
        .gte('attendance_date', format(startDate, 'yyyy-MM-dd'))
        .lte('attendance_date', format(endDate, 'yyyy-MM-dd'))
        .order('attendance_date');

      if (error) throw error;

      // Group by month
      const monthlyData: Record<string, { present: number; late: number; absent: number }> = {};
      
      data?.forEach(record => {
        const month = format(new Date(record.attendance_date), 'MMM yyyy', { locale: id });
        if (!monthlyData[month]) {
          monthlyData[month] = { present: 0, late: 0, absent: 0 };
        }
        
        if (record.status === 'present') monthlyData[month].present++;
        else if (record.status === 'late') monthlyData[month].late++;
        else monthlyData[month].absent++;
      });

      return Object.entries(monthlyData).map(([month, stats]) => ({
        month,
        ...stats,
        total: stats.present + stats.late + stats.absent
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const pieData = [
    { name: 'Hadir', value: attendanceStats?.present || 0, color: '#10b981' },
    { name: 'Terlambat', value: attendanceStats?.late || 0, color: '#f59e0b' },
    { name: 'Tidak Hadir', value: attendanceStats?.absent || 0, color: '#ef4444' }
  ];

  const attendanceRate = attendanceStats?.total 
    ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hari</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Hari sekolah</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hadir</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceStats?.present || 0}</div>
            <p className="text-xs text-muted-foreground">Hari hadir tepat waktu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{attendanceStats?.late || 0}</div>
            <p className="text-xs text-muted-foreground">Hari terlambat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Persentase kehadiran</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                hadir: { label: "Hadir", color: "#10b981" },
                terlambat: { label: "Terlambat", color: "#f59e0b" },
                tidak_hadir: { label: "Tidak Hadir", color: "#ef4444" }
              }}
              className="h-[300px]"
            >
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
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

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Kehadiran Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                present: { label: "Hadir", color: "#10b981" },
                late: { label: "Terlambat", color: "#f59e0b" }
              }}
              className="h-[300px]"
            >
              <BarChart data={monthlyTrend}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="present" fill="#10b981" name="Hadir" />
                <Bar dataKey="late" fill="#f59e0b" name="Terlambat" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Records */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kehadiran Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {attendanceStats?.records.slice(0, 10).map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {record.status === 'present' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : record.status === 'late' ? (
                    <Clock className="h-5 w-5 text-amber-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {format(new Date(record.attendance_date), 'EEEE, dd MMMM yyyy', { locale: id })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {record.check_in_time && `Masuk: ${record.check_in_time}`}
                      {record.check_out_time && ` • Pulang: ${record.check_out_time}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    record.status === 'present' ? 'bg-green-100 text-green-800' :
                    record.status === 'late' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {record.status === 'present' ? 'Hadir' :
                     record.status === 'late' ? 'Terlambat' : 'Tidak Hadir'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
