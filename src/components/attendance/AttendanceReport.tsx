import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, FileText, TrendingUp, Users } from 'lucide-react';
import { AttendanceReportExport } from './AttendanceReportExport';

interface Class {
  id: string;
  name: string;
  grade: number;
}

interface AttendanceStats {
  total_students: number;
  present: number;
  absent: number;
  late: number;
  sick: number;
  permission: number;
  attendance_rate: number;
}

interface DailyAttendance {
  date: string;
  present: number;
  absent: number;
  total: number;
  rate: number;
}

interface AttendanceExportData {
  student_name: string;
  class_name: string;
  attendance_date: string;
  status: string;
  notes?: string;
}

export function AttendanceReport() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyAttendance[]>([]);
  const [exportData, setExportData] = useState<AttendanceExportData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (selectedClass && startDate && endDate) {
      fetchAttendanceReport();
      fetchExportData();
    }
  }, [selectedClass, startDate, endDate]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, grade')
        .eq('is_active', true)
        .order('grade', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kelas",
        variant: "destructive"
      });
    }
  };

  const fetchExportData = async () => {
    if (!selectedClass || !startDate || !endDate) return;

    try {
      const { data: attendanceData, error } = await supabase
        .from('unified_attendances')
        .select(`
          attendance_date,
          status,
          notes,
          student_id,
          students!inner(full_name),
          classes!inner(name)
        `)
        .eq('class_id', selectedClass)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: false });

      if (error) throw error;

      const formattedData: AttendanceExportData[] = attendanceData?.map(record => ({
        student_name: record.students?.full_name || '',
        class_name: record.classes?.name || '',
        attendance_date: new Date(record.attendance_date).toLocaleDateString('id-ID'),
        status: record.status,
        notes: record.notes || ''
      })) || [];

      setExportData(formattedData);
    } catch (error) {
      console.error('Error fetching export data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data untuk ekspor",
        variant: "destructive"
      });
    }
  };

  const fetchAttendanceReport = async () => {
    if (!selectedClass || !startDate || !endDate) return;

    setLoading(true);
    try {
      // Get overall stats
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('unified_attendances')
        .select('status, student_id')
        .eq('class_id', selectedClass)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);

      if (attendanceError) throw attendanceError;

      // Get total students in class
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('student_id')
        .eq('class_id', selectedClass)
        .eq('status', 'active');

      if (enrollmentError) throw enrollmentError;

      const totalStudents = enrollmentData?.length || 0;
      
      // Calculate stats
      const statusCounts = {
        present: 0,
        absent: 0,
        late: 0,
        sick: 0,
        permission: 0
      };

      attendanceData?.forEach(record => {
        if (statusCounts.hasOwnProperty(record.status)) {
          statusCounts[record.status as keyof typeof statusCounts]++;
        }
      });

      const totalRecords = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
      const attendanceRate = totalRecords > 0 ? (statusCounts.present / totalRecords) * 100 : 0;

      setStats({
        total_students: totalStudents,
        ...statusCounts,
        attendance_rate: attendanceRate
      });

      // Get daily attendance data
      const { data: dailyAttendanceData, error: dailyError } = await supabase
        .from('unified_attendances')
        .select('attendance_date, status')
        .eq('class_id', selectedClass)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: true });

      if (dailyError) throw dailyError;

      // Group by date
      const dailyStats: Record<string, { present: number; absent: number; total: number }> = {};
      
      dailyAttendanceData?.forEach(record => {
        const date = record.attendance_date;
        if (!dailyStats[date]) {
          dailyStats[date] = { present: 0, absent: 0, total: 0 };
        }
        
        if (record.status === 'present') {
          dailyStats[date].present++;
        } else {
          dailyStats[date].absent++;
        }
        dailyStats[date].total++;
      });

      const dailyDataArray = Object.entries(dailyStats).map(([date, data]) => ({
        date,
        present: data.present,
        absent: data.absent,
        total: data.total,
        rate: data.total > 0 ? (data.present / data.total) * 100 : 0
      }));

      setDailyData(dailyDataArray);

    } catch (error) {
      console.error('Error fetching attendance report:', error);
      toast({
        title: "Error",
        description: "Gagal memuat laporan presensi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pieData = stats ? [
    { name: 'Hadir', value: stats.present, color: '#22c55e' },
    { name: 'Tidak Hadir', value: stats.absent, color: '#ef4444' },
    { name: 'Terlambat', value: stats.late, color: '#f59e0b' },
    { name: 'Sakit', value: stats.sick, color: '#3b82f6' },
    { name: 'Izin', value: stats.permission, color: '#8b5cf6' }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Laporan Presensi
              </CardTitle>
              <CardDescription>
                Analisis kehadiran siswa berdasarkan periode waktu
              </CardDescription>
            </div>
            <AttendanceReportExport
              data={exportData}
              disabled={!selectedClass || loading}
              filename={`laporan_presensi_${selectedClass ? classes.find(c => c.id === selectedClass)?.name.replace(/\s+/g, '_') : 'semua'}`}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Kelas</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} (Kelas {cls.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Tanggal Mulai</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Tanggal Selesai</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">Memuat laporan...</div>
          </CardContent>
        </Card>
      )}

      {!loading && stats && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div className="text-sm font-medium text-muted-foreground">Total Siswa</div>
                </div>
                <div className="text-2xl font-bold">{stats.total_students}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div className="text-sm font-medium text-muted-foreground">Tingkat Kehadiran</div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.attendance_rate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <div className="text-sm font-medium text-muted-foreground">Total Hadir</div>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.present}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-red-600" />
                  <div className="text-sm font-medium text-muted-foreground">Tidak Hadir</div>
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Status Kehadiran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Hadir</Badge>
                  </div>
                  <div className="font-bold text-green-600">{stats.present}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Tidak Hadir</Badge>
                  </div>
                  <div className="font-bold text-red-600">{stats.absent}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Terlambat</Badge>
                  </div>
                  <div className="font-bold text-yellow-600">{stats.late}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Sakit</Badge>
                  </div>
                  <div className="font-bold text-blue-600">{stats.sick}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Izin</Badge>
                  </div>
                  <div className="font-bold text-purple-600">{stats.permission}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Attendance Chart */}
          {dailyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Trend Kehadiran Harian</CardTitle>
                <CardDescription>
                  Grafik tingkat kehadiran per hari dalam periode yang dipilih
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('id-ID')}
                        formatter={(value, name) => [value, name === 'present' ? 'Hadir' : 'Tidak Hadir']}
                      />
                      <Bar dataKey="present" fill="#22c55e" name="present" />
                      <Bar dataKey="absent" fill="#ef4444" name="absent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!loading && selectedClass && startDate && endDate && !stats && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              Tidak ada data presensi untuk periode yang dipilih
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
