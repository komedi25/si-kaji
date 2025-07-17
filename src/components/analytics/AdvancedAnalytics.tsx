
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  AlertTriangle, 
  Award,
  Brain,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface AnalyticsData {
  totalStudents: number;
  attendanceRate: number;
  totalViolations: number;
  totalAchievements: number;
}

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
  late: number;
}

interface ViolationData {
  type: string;
  count: number;
  trend: number;
}

interface ClassPerformanceData {
  className: string;
  attendance: number;
  violations: number;
  achievements: number;
  averageScore: number;
}

export const AdvancedAnalytics = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');

  // Fetch analytics overview data
  const { data: analyticsOverview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['analytics-overview', dateRange, selectedClass],
    queryFn: async (): Promise<AnalyticsData> => {
      const { data: students } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active');

      const { data: attendance } = await supabase
        .from('unified_attendances')
        .select('*')
        .gte('attendance_date', dateRange.from.toISOString().split('T')[0])
        .lte('attendance_date', dateRange.to.toISOString().split('T')[0]);

      const { data: violations } = await supabase
        .from('student_violations')
        .select('*')
        .gte('violation_date', dateRange.from.toISOString().split('T')[0])
        .lte('violation_date', dateRange.to.toISOString().split('T')[0]);

      const { data: achievements } = await supabase
        .from('student_achievements')
        .select('*')
        .gte('achievement_date', dateRange.from.toISOString().split('T')[0])
        .lte('achievement_date', dateRange.to.toISOString().split('T')[0]);

      const totalStudents = students?.length || 0;
      const attendanceRate = attendance?.length ? 
        (attendance.filter(a => a.status === 'present').length / attendance.length) * 100 : 0;

      return {
        totalStudents,
        attendanceRate: Math.round(attendanceRate),
        totalViolations: violations?.length || 0,
        totalAchievements: achievements?.length || 0
      };
    }
  });

  // Fetch attendance trend data
  const { data: attendanceTrend, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance-trend', dateRange, selectedClass],
    queryFn: async (): Promise<AttendanceData[]> => {
      const { data } = await supabase
        .from('unified_attendances')
        .select('attendance_date, status')
        .gte('attendance_date', dateRange.from.toISOString().split('T')[0])
        .lte('attendance_date', dateRange.to.toISOString().split('T')[0])
        .order('attendance_date');

      // Group by date and count statuses
      const groupedData = data?.reduce((acc: any, curr) => {
        const date = new Date(curr.attendance_date).toLocaleDateString('id-ID');
        if (!acc[date]) {
          acc[date] = { date, present: 0, absent: 0, late: 0 };
        }
        acc[date][curr.status] += 1;
        return acc;
      }, {});

      return Object.values(groupedData || {}) as AttendanceData[];
    }
  });

  // Fetch violation statistics
  const { data: violationStats, isLoading: violationsLoading } = useQuery({
    queryKey: ['violation-stats', dateRange],
    queryFn: async (): Promise<ViolationData[]> => {
      const { data } = await supabase
        .from('student_violations')
        .select(`
          violation_date,
          violation_types (
            name
          )
        `)
        .gte('violation_date', dateRange.from.toISOString().split('T')[0])
        .lte('violation_date', dateRange.to.toISOString().split('T')[0]);

      const violationCounts = data?.reduce((acc: any, curr: any) => {
        const typeName = curr.violation_types?.name || 'Unknown';
        acc[typeName] = (acc[typeName] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(violationCounts || {}).map(([type, count]) => ({
        type,
        count: count as number,
        trend: Math.random() > 0.5 ? 1 : -1 // Mock trend data
      }));
    }
  });

  // Fetch class performance data
  const { data: classPerformance, isLoading: performanceLoading } = useQuery({
    queryKey: ['class-performance', dateRange],
    queryFn: async (): Promise<ClassPerformanceData[]> => {
      const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true);

      // Mock class performance data for now
      return classes?.map((cls) => ({
        className: cls.name,
        attendance: Math.floor(Math.random() * 20) + 80,
        violations: Math.floor(Math.random() * 10),
        achievements: Math.floor(Math.random() * 15) + 5,
        averageScore: Math.floor(Math.random() * 20) + 75
      })) || [];
    }
  });

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange({ from: range.from, to: range.to });
    }
  };

  const handleExportData = () => {
    console.log('Mengekspor data analytics...');
    // Implementation for exporting data
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Laporan</h1>
          <p className="text-muted-foreground">
            Analisis data kesiswaan dan laporan komprehensif
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetchOverview()} disabled={overviewLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${overviewLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rentang Tanggal</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={handleDateRangeChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kelas</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  <SelectItem value="X-RPL-1">X RPL 1</SelectItem>
                  <SelectItem value="X-RPL-2">X RPL 2</SelectItem>
                  <SelectItem value="XI-RPL-1">XI RPL 1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Periode</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Mingguan</SelectItem>
                  <SelectItem value="month">Bulanan</SelectItem>
                  <SelectItem value="semester">Semesteran</SelectItem>
                  <SelectItem value="year">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Siswa</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{overviewLoading ? '...' : analyticsOverview?.totalStudents || 0}</p>
                  <Badge variant="secondary">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +2.5%
                  </Badge>
                </div>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Tingkat Kehadiran</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{overviewLoading ? '...' : analyticsOverview?.attendanceRate || 0}%</p>
                  <Badge variant="default">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +1.2%
                  </Badge>
                </div>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Pelanggaran</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{overviewLoading ? '...' : analyticsOverview?.totalViolations || 0}</p>
                  <Badge variant="destructive">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    -3.1%
                  </Badge>
                </div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Prestasi</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{overviewLoading ? '...' : analyticsOverview?.totalAchievements || 0}</p>
                  <Badge variant="default">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +5.7%
                  </Badge>
                </div>
              </div>
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
          <TabsTrigger value="behavior">Perilaku</TabsTrigger>
          <TabsTrigger value="performance">Performa Kelas</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tren Kehadiran Harian</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Memuat data kehadiran...</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="present" stackId="1" stroke="#10b981" fill="#10b981" name="Hadir" />
                    <Area type="monotone" dataKey="late" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Terlambat" />
                    <Area type="monotone" dataKey="absent" stackId="1" stroke="#ef4444" fill="#ef4444" name="Tidak Hadir" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Jenis Pelanggaran</CardTitle>
              </CardHeader>
              <CardContent>
                {violationsLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={violationStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {violationStats?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistik Pelanggaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {violationStats?.map((violation, index) => (
                    <div key={violation.type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{violation.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">{violation.count}</span>
                        {violation.trend > 0 ? (
                          <TrendingUp className="w-4 h-4 text-red-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performa Kelas Keseluruhan</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={classPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="className" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="attendance" fill="#10b981" name="Kehadiran %" />
                    <Bar dataKey="violations" fill="#ef4444" name="Pelanggaran" />
                    <Bar dataKey="achievements" fill="#f59e0b" name="Prestasi" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Insights & Rekomendasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Analisis Kehadiran</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Tingkat Kehadiran Rata-rata</span>
                      <div className="flex items-center gap-2">
                        <Progress value={92} className="w-20" />
                        <span className="font-bold">92%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Siswa Perlu Perhatian</span>
                      <Badge variant="outline">15 siswa</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Rekomendasi Tindakan</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm">
                        <strong>Informasi:</strong> Tingkat kehadiran siswa menunjukkan tren positif 
                        pada bulan ini.
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm">
                        <strong>Positif:</strong> Program ekstrakurikuler menunjukkan dampak positif 
                        terhadap kedisiplinan siswa.
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm">
                        <strong>Perhatian:</strong> Beberapa kelas menunjukkan penurunan kehadiran. 
                        Disarankan untuk melakukan pendekatan individual.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
