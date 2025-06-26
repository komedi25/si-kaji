
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface StudentAttendanceStatsProps {
  studentId: string;
}

export const StudentAttendanceStats = ({ studentId }: StudentAttendanceStatsProps) => {
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['student-attendance-stats', studentId],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const { data: attendanceRecords } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('student_id', studentId)
        .gte('attendance_date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .order('attendance_date', { ascending: false });

      // Calculate statistics
      const total = attendanceRecords?.length || 0;
      const present = attendanceRecords?.filter(r => r.status === 'present').length || 0;
      const late = attendanceRecords?.filter(r => r.status === 'late').length || 0;
      const absent = attendanceRecords?.filter(r => r.status === 'absent').length || 0;
      
      const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

      // Prepare chart data
      const chartData = attendanceRecords?.slice(0, 14).reverse().map(record => ({
        date: format(new Date(record.attendance_date), 'dd/MM', { locale: localeId }),
        status: record.status === 'present' ? 1 : record.status === 'late' ? 0.5 : 0
      })) || [];

      const pieData = [
        { name: 'Hadir', value: present, color: '#10b981' },
        { name: 'Terlambat', value: late, color: '#f59e0b' },
        { name: 'Tidak Hadir', value: absent, color: '#ef4444' }
      ];

      return {
        statistics: { total, present, late, absent, attendanceRate },
        chartData,
        pieData,
        recentRecords: attendanceRecords?.slice(0, 5) || []
      };
    },
    enabled: !!studentId
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
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

  const { statistics, chartData, pieData, recentRecords } = attendanceData || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics?.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">30 hari terakhir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hadir</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics?.present}</div>
            <p className="text-xs text-muted-foreground">hari</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics?.late}</div>
            <p className="text-xs text-muted-foreground">hari</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tidak Hadir</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics?.absent}</div>
            <p className="text-xs text-muted-foreground">hari</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trend Kehadiran (14 Hari)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                status: { label: "Status Kehadiran", color: "#3b82f6" }
              }}
              className="h-[250px]"
            >
              <LineChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} tickFormatter={(value) => value === 1 ? 'Hadir' : value === 0.5 ? 'Telat' : 'Tidak'} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="status" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

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
                  {pieData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
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
          <div className="space-y-3">
            {recentRecords?.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    record.status === 'present' ? 'bg-green-100 text-green-600' :
                    record.status === 'late' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {record.status === 'present' ? <CheckCircle className="h-4 w-4" /> :
                     record.status === 'late' ? <Clock className="h-4 w-4" /> :
                     <XCircle className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium">
                      {format(new Date(record.attendance_date), 'dd MMMM yyyy', { locale: localeId })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {record.status === 'present' ? 'Hadir' :
                       record.status === 'late' ? 'Terlambat' : 'Tidak Hadir'}
                    </p>
                  </div>
                </div>
                {record.check_in_time && (
                  <span className="text-sm text-gray-500">
                    {format(new Date(`${record.attendance_date}T${record.check_in_time}`), 'HH:mm')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
