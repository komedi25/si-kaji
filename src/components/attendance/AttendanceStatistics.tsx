import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calendar, Users, TrendingUp, Clock, BarChart3, PieChart,
  CheckCircle, XCircle, AlertTriangle, Download
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Cell, BarChart, Bar, Pie } from 'recharts';

interface AttendanceStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
  monthlyTrend: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
    rate: number;
  }>;
  classBreakdown: Array<{
    className: string;
    total: number;
    present: number;
    rate: number;
  }>;
  weeklyPattern: Array<{
    day: string;
    average: number;
  }>;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export const AttendanceStatistics = () => {
  const { hasRole } = useAuth();
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedClass, setSelectedClass] = useState('all');

  useEffect(() => {
    if (hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk') || hasRole('waka_kesiswaan')) {
      fetchAttendanceStats();
    }
  }, [selectedPeriod, selectedClass]);

  const fetchAttendanceStats = async () => {
    setLoading(true);
    
    try {
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      let startDate, endDate;

      // Calculate date range based on selected period
      switch (selectedPeriod) {
        case 'current_month':
          startDate = format(startOfMonth(now), 'yyyy-MM-dd');
          endDate = format(endOfMonth(now), 'yyyy-MM-dd');
          break;
        case 'last_month':
          const lastMonth = subMonths(now, 1);
          startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
          endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
          break;
        case 'last_3_months':
          startDate = format(subMonths(now, 3), 'yyyy-MM-dd');
          endDate = format(now, 'yyyy-MM-dd');
          break;
        default:
          startDate = format(startOfMonth(now), 'yyyy-MM-dd');
          endDate = format(endOfMonth(now), 'yyyy-MM-dd');
      }

      // Get total students count
      const { data: studentsData, count: totalStudents } = await supabase
        .from('students')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      // Get today's attendance
      const { data: todayAttendance } = await supabase
        .from('student_self_attendances')
        .select('status')
        .eq('attendance_date', today);

      const presentToday = todayAttendance?.filter(a => a.status === 'present').length || 0;
      const absentToday = (totalStudents || 0) - (todayAttendance?.length || 0);
      const lateToday = todayAttendance?.filter(a => a.status === 'late').length || 0;

      // Get monthly trend data
      const { data: monthlyData } = await supabase
        .from('student_self_attendances')
        .select('attendance_date, status')
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date');

      // Process monthly trend
      const monthlyTrend = processMonthlyTrend(monthlyData || [], totalStudents || 0, startDate, endDate);

      // Get class breakdown
      const { data: classData } = await supabase
        .from('student_enrollments')
        .select(`
          classes(id, name, grade),
          students(
            student_self_attendances!inner(status, attendance_date)
          )
        `)
        .eq('status', 'active');

      const classBreakdown = processClassBreakdown(classData || [], today);

      // Calculate weekly pattern (average attendance by day of week)
      const weeklyPattern = processWeeklyPattern(monthlyData || [], totalStudents || 0);

      setStats({
        totalStudents: totalStudents || 0,
        presentToday,
        absentToday,
        lateToday,
        attendanceRate: totalStudents ? Math.round((presentToday / totalStudents) * 100) : 0,
        monthlyTrend,
        classBreakdown,
        weeklyPattern
      });

    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyTrend = (data: any[], totalStudents: number, startDate: string, endDate: string) => {
    const trendMap = new Map();
    
    // Group by date
    data.forEach(record => {
      const date = record.attendance_date;
      if (!trendMap.has(date)) {
        trendMap.set(date, { present: 0, absent: 0, late: 0 });
      }
      
      const dayData = trendMap.get(date);
      if (record.status === 'present') dayData.present++;
      else if (record.status === 'late') dayData.late++;
    });

    return Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      ...data,
      absent: totalStudents - (data.present + data.late),
      rate: totalStudents ? Math.round(((data.present + data.late) / totalStudents) * 100) : 0
    })).sort((a, b) => a.date.localeCompare(b.date));
  };

  const processClassBreakdown = (data: any[], today: string) => {
    const classMap = new Map();
    
    data.forEach(enrollment => {
      const className = `${enrollment.classes.grade} ${enrollment.classes.name}`;
      if (!classMap.has(className)) {
        classMap.set(className, { total: 0, present: 0 });
      }
      
      const classData = classMap.get(className);
      classData.total++;
      
      const todayAttendance = enrollment.students.student_self_attendances?.find(
        (att: any) => att.attendance_date === today
      );
      
      if (todayAttendance && (todayAttendance.status === 'present' || todayAttendance.status === 'late')) {
        classData.present++;
      }
    });

    return Array.from(classMap.entries()).map(([className, data]) => ({
      className,
      total: data.total,
      present: data.present,
      rate: data.total ? Math.round((data.present / data.total) * 100) : 0
    }));
  };

  const processWeeklyPattern = (data: any[], totalStudents: number) => {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const weeklyMap = new Map();
    
    data.forEach(record => {
      const date = new Date(record.attendance_date);
      const dayOfWeek = date.getDay();
      const dayName = dayNames[dayOfWeek];
      
      if (!weeklyMap.has(dayName)) {
        weeklyMap.set(dayName, { total: 0, count: 0 });
      }
      
      const dayData = weeklyMap.get(dayName);
      if (record.status === 'present' || record.status === 'late') {
        dayData.total++;
      }
      dayData.count++;
    });

    return dayNames.map(day => ({
      day,
      average: weeklyMap.has(day) 
        ? Math.round((weeklyMap.get(day).total / weeklyMap.get(day).count) * 100)
        : 0
    }));
  };

  const exportData = () => {
    // Implementation for exporting attendance data
    console.log('Exporting attendance data...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Tidak ada data statistik kehadiran</p>
      </div>
    );
  }

  const pieData = [
    { name: 'Hadir', value: stats.presentToday, color: '#10b981' },
    { name: 'Terlambat', value: stats.lateToday, color: '#f59e0b' },
    { name: 'Tidak Hadir', value: stats.absentToday, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Bulan Ini</SelectItem>
              <SelectItem value="last_month">Bulan Lalu</SelectItem>
              <SelectItem value="last_3_months">3 Bulan Terakhir</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {stats.classBreakdown.map((cls) => (
                <SelectItem key={cls.className} value={cls.className}>
                  {cls.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportData} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Total Siswa</div>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Hadir Hari Ini</div>
                <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Terlambat</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.lateToday}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Tidak Hadir</div>
                <div className="text-2xl font-bold text-red-600">{stats.absentToday}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Tren Kehadiran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'dd MMM')}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: id })}
                />
                <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Today's Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Distribusi Kehadiran Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Kehadiran per Kelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.classBreakdown.map((cls) => (
              <div key={cls.className} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{cls.className}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {cls.present}/{cls.total}
                    </span>
                    <Badge variant={cls.rate >= 90 ? 'default' : cls.rate >= 75 ? 'secondary' : 'destructive'}>
                      {cls.rate}%
                    </Badge>
                  </div>
                </div>
                <Progress value={cls.rate} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Pattern */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Pola Kehadiran Mingguan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.weeklyPattern}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Rata-rata Kehadiran']} />
              <Bar dataKey="average" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
