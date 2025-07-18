import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, FileText, TrendingUp, Users, UserCheck, UserX, Clock, User } from 'lucide-react';
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

interface Student {
  id: string;
  full_name: string;
  nis: string;
  class_name?: string;
}

interface DetailedAttendanceData {
  present: Student[];
  absent: Student[];
  late: Student[];
  sick: Student[];
  permission: Student[];
}

export function AttendanceReport() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [reportType, setReportType] = useState<'overall' | 'class' | 'individual'>('overall');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyAttendance[]>([]);
  const [exportData, setExportData] = useState<AttendanceExportData[]>([]);
  const [detailedData, setDetailedData] = useState<DetailedAttendanceData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchStudents();
    // Set default date range (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAttendanceReport();
      fetchExportData();
      fetchDetailedData();
    }
  }, [selectedClass, selectedStudent, reportType, startDate, endDate]);

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

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id, 
          full_name, 
          nis,
          student_enrollments!inner(
            class_id,
            classes!inner(name)
          )
        `)
        .eq('student_enrollments.status', 'active')
        .order('full_name');

      if (error) throw error;
      
      const formattedStudents = data?.map(student => ({
        id: student.id,
        full_name: student.full_name,
        nis: student.nis,
        class_name: student.student_enrollments?.[0]?.classes?.name || ''
      })) || [];
      
      setStudents(formattedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive"
      });
    }
  };

  const fetchExportData = async () => {
    if (!startDate || !endDate) return;

    try {
      let query = supabase
        .from('unified_attendances')
        .select(`
          attendance_date,
          status,
          notes,
          student_id,
          class_id
        `)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);

      // Apply filters based on report type
      if (reportType === 'class' && selectedClass !== 'all') {
        query = query.eq('class_id', selectedClass);
      } else if (reportType === 'individual' && selectedStudent) {
        query = query.eq('student_id', selectedStudent);
      }

      const { data: attendanceData, error } = await query.order('attendance_date', { ascending: false });

      // Get students data separately  
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, full_name');

      // Get classes data separately
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name');

      if (error) throw error;

      const formattedData: AttendanceExportData[] = attendanceData?.map(record => {
        const student = studentsData?.find(s => s.id === record.student_id);
        const classInfo = classesData?.find(c => c.id === record.class_id);
        return {
          student_name: student?.full_name || '',
          class_name: classInfo?.name || '',
          attendance_date: new Date(record.attendance_date).toLocaleDateString('id-ID'),
          status: record.status,
          notes: record.notes || ''
        };
      }) || [];

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
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      let attendanceQuery = supabase
        .from('unified_attendances')
        .select('status, student_id, class_id')
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);

      // Apply filters based on report type
      if (reportType === 'class' && selectedClass !== 'all') {
        attendanceQuery = attendanceQuery.eq('class_id', selectedClass);
      } else if (reportType === 'individual' && selectedStudent) {
        attendanceQuery = attendanceQuery.eq('student_id', selectedStudent);
      }

      const { data: attendanceData, error: attendanceError } = await attendanceQuery;
      if (attendanceError) throw attendanceError;

      // Get total students based on report type
      let totalStudents = 0;
      if (reportType === 'individual') {
        totalStudents = 1;
      } else if (reportType === 'class' && selectedClass !== 'all') {
        const { data: enrollmentData } = await supabase
          .from('student_enrollments')
          .select('student_id')
          .eq('class_id', selectedClass)
          .eq('status', 'active');
        totalStudents = enrollmentData?.length || 0;
      } else {
        // Overall - get all active students
        const { data: allStudents } = await supabase
          .from('student_enrollments')
          .select('student_id')
          .eq('status', 'active');
        totalStudents = allStudents?.length || 0;
      }
      
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
      let dailyQuery = supabase
        .from('unified_attendances')
        .select('attendance_date, status')
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: true });

      // Apply same filters for daily data
      if (reportType === 'class' && selectedClass !== 'all') {
        dailyQuery = dailyQuery.eq('class_id', selectedClass);
      } else if (reportType === 'individual' && selectedStudent) {
        dailyQuery = dailyQuery.eq('student_id', selectedStudent);
      }

      const { data: dailyAttendanceData, error: dailyError } = await dailyQuery;
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

  const fetchDetailedData = async () => {
    if (!startDate || !endDate) return;

    try {
      let query = supabase
        .from('unified_attendances')
        .select(`
          status,
          student_id,
          students!inner(id, full_name, nis)
        `)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);

      // Apply filters based on report type
      if (reportType === 'class' && selectedClass !== 'all') {
        query = query.eq('class_id', selectedClass);
      } else if (reportType === 'individual' && selectedStudent) {
        query = query.eq('student_id', selectedStudent);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group students by status
      const grouped: DetailedAttendanceData = {
        present: [],
        absent: [],
        late: [],
        sick: [],
        permission: []
      };

      // Track unique students per status
      const studentSets = {
        present: new Set(),
        absent: new Set(),
        late: new Set(),
        sick: new Set(),
        permission: new Set()
      };

      data?.forEach(record => {
        const student = {
          id: record.students.id,
          full_name: record.students.full_name,
          nis: record.students.nis
        };

        const status = record.status as keyof DetailedAttendanceData;
        if (status in grouped && !studentSets[status].has(student.id)) {
          grouped[status].push(student);
          studentSets[status].add(student.id);
        }
      });

      setDetailedData(grouped);
    } catch (error) {
      console.error('Error fetching detailed data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data detail",
        variant: "destructive"
      });
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
                Laporan Presensi Detail
              </CardTitle>
              <CardDescription>
                Sistem laporan presensi lengkap dengan analisis per siswa, kelas, dan keseluruhan
              </CardDescription>
            </div>
            <AttendanceReportExport
              data={exportData}
              disabled={loading}
              filename={`laporan_presensi_${reportType}_${new Date().toISOString().split('T')[0]}`}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-2">
            <Label>Jenis Laporan</Label>
            <Tabs value={reportType} onValueChange={(value) => setReportType(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overall" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Keseluruhan
                </TabsTrigger>
                <TabsTrigger value="class" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Per Kelas
                </TabsTrigger>
                <TabsTrigger value="individual" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Per Individu
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Dynamic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {reportType === 'class' && (
              <div className="space-y-2">
                <Label htmlFor="class">Kelas</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} (Kelas {cls.grade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === 'individual' && (
              <div className="space-y-2">
                <Label htmlFor="student">Siswa</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih siswa" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name} - {student.nis} ({student.class_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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

            <div className="flex items-end">
              <Button 
                onClick={() => {
                  fetchAttendanceReport();
                  fetchExportData();
                  fetchDetailedData();
                }}
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Memuat...' : 'Refresh Data'}
              </Button>
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <div className="text-sm font-medium text-muted-foreground">Hadir</div>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.present}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <UserX className="h-4 w-4 text-red-600" />
                  <div className="text-sm font-medium text-muted-foreground">Tidak Hadir</div>
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div className="text-sm font-medium text-muted-foreground">Terlambat</div>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Student Lists */}
          {detailedData && (
            <Card>
              <CardHeader>
                <CardTitle>Detail Nama Siswa Per Status</CardTitle>
                <CardDescription>
                  Daftar lengkap siswa berdasarkan status kehadiran
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="present" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="present" className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Hadir ({detailedData.present.length})
                    </TabsTrigger>
                    <TabsTrigger value="absent" className="flex items-center gap-2">
                      <UserX className="h-4 w-4" />
                      Tidak Hadir ({detailedData.absent.length})
                    </TabsTrigger>
                    <TabsTrigger value="late" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Terlambat ({detailedData.late.length})
                    </TabsTrigger>
                    <TabsTrigger value="sick" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Sakit ({detailedData.sick.length})
                    </TabsTrigger>
                    <TabsTrigger value="permission" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Izin ({detailedData.permission.length})
                    </TabsTrigger>
                  </TabsList>

                  {Object.entries(detailedData).map(([status, students]) => (
                    <TabsContent key={status} value={status} className="mt-4">
                      <div className="space-y-2">
                        {students.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {students.map((student) => (
                              <div key={student.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <Badge variant={
                                  status === 'present' ? 'default' :
                                  status === 'absent' ? 'destructive' :
                                  status === 'late' ? 'secondary' :
                                  'outline'
                                }>
                                  {student.nis}
                                </Badge>
                                <span className="text-sm font-medium">{student.full_name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            Tidak ada siswa dengan status {status === 'present' ? 'hadir' : 
                              status === 'absent' ? 'tidak hadir' :
                              status === 'late' ? 'terlambat' :
                              status === 'sick' ? 'sakit' : 'izin'} dalam periode ini
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Status Kehadiran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
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
                <CardTitle>Ringkasan Status Detail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Hadir</span>
                  </div>
                  <div className="font-bold text-green-600">{stats.present}</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserX className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Tidak Hadir</span>
                  </div>
                  <div className="font-bold text-red-600">{stats.absent}</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">Terlambat</span>
                  </div>
                  <div className="font-bold text-yellow-600">{stats.late}</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Sakit</span>
                  </div>
                  <div className="font-bold text-blue-600">{stats.sick}</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Izin</span>
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
                  Grafik tingkat kehadiran per hari dalam periode yang dipilih (Responsif)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                        angle={-45}
                        textAnchor="end"
                        height={60}
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

      {!loading && startDate && endDate && !stats && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              Tidak ada data presensi untuk periode yang dipilih.
              {reportType === 'individual' && !selectedStudent && (
                <div className="mt-2 text-sm">Pilih siswa untuk melihat laporan individual.</div>
              )}
              {reportType === 'class' && selectedClass === 'all' && (
                <div className="mt-2 text-sm">Pilih kelas atau ubah ke laporan keseluruhan.</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
