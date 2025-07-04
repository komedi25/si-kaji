
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AttendanceStatistics } from './AttendanceStatistics';
import { 
  Search, Filter, Download, Calendar, Users, TrendingUp,
  CheckCircle, XCircle, AlertTriangle, FileText, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface StudentAttendance {
  id: string;
  full_name: string;
  nis: string;
  class_name: string;
  attendance_rate: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  total_days: number;
  last_attendance: string | null;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export const EnhancedAttendanceReport = () => {
  const { hasRole } = useAuth();
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk') || hasRole('waka_kesiswaan')) {
      fetchData();
    }
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, filterClass, filterStatus, students]);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, grade')
        .eq('is_active', true)
        .order('grade', { ascending: true });

      setClasses(classesData || []);

      // Fetch students with their attendance data
      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          id, full_name, nis,
          student_enrollments(
            classes(name, grade)
          )
        `)
        .eq('status', 'active');

      if (!studentsData) return;

      // Calculate attendance statistics for each student
      const studentAttendancePromises = studentsData.map(async (student) => {
        const className = student.student_enrollments?.[0]?.classes
          ? `${student.student_enrollments[0].classes.grade} ${student.student_enrollments[0].classes.name}`
          : 'Tidak ada kelas';

        // Get attendance data for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const { data: attendanceData } = await supabase
          .from('student_self_attendances')
          .select('attendance_date, status, check_in_time')
          .eq('student_id', student.id)
          .gte('attendance_date', format(startOfMonth, 'yyyy-MM-dd'))
          .lte('attendance_date', format(endOfMonth, 'yyyy-MM-dd'))
          .order('attendance_date', { ascending: false });

        const totalDays = attendanceData?.length || 0;
        const presentDays = attendanceData?.filter(a => a.status === 'present').length || 0;
        const absentDays = attendanceData?.filter(a => a.status === 'absent').length || 0;
        const lateDays = attendanceData?.filter(a => a.status === 'late').length || 0;
        const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        let status: 'excellent' | 'good' | 'warning' | 'critical';
        if (attendanceRate >= 95) status = 'excellent';
        else if (attendanceRate >= 85) status = 'good';
        else if (attendanceRate >= 75) status = 'warning';
        else status = 'critical';

        return {
          id: student.id,
          full_name: student.full_name,
          nis: student.nis,
          class_name: className,
          attendance_rate: attendanceRate,
          present_days: presentDays,
          absent_days: absentDays,
          late_days: lateDays,
          total_days: totalDays,
          last_attendance: attendanceData?.[0]?.attendance_date || null,
          status
        };
      });

      const attendanceResults = await Promise.all(studentAttendancePromises);
      setStudents(attendanceResults);
      
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nis.includes(searchTerm)
      );
    }

    if (filterClass !== 'all') {
      filtered = filtered.filter(student => student.class_name === filterClass);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(student => student.status === filterStatus);
    }

    setFilteredStudents(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge variant="default" className="bg-green-500">Sangat Baik</Badge>;
      case 'good':
        return <Badge variant="default" className="bg-blue-500">Baik</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">Perhatian</Badge>;
      case 'critical':
        return <Badge variant="destructive">Kritis</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const exportReport = () => {
    // Implementation for exporting detailed attendance report
    const csvContent = [
      ['NIS', 'Nama', 'Kelas', 'Hadir', 'Tidak Hadir', 'Terlambat', 'Total Hari', 'Persentase', 'Status'],
      ...filteredStudents.map(student => [
        student.nis,
        student.full_name,
        student.class_name,
        student.present_days.toString(),
        student.absent_days.toString(),
        student.late_days.toString(),
        student.total_days.toString(),
        `${student.attendance_rate}%`,
        student.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-kehadiran-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="statistics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="statistics">Statistik</TabsTrigger>
          <TabsTrigger value="detailed">Laporan Detail</TabsTrigger>
          <TabsTrigger value="analysis">Analisis</TabsTrigger>
        </TabsList>

        <TabsContent value="statistics">
          <AttendanceStatistics />
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Laporan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama atau NIS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={`${cls.grade} ${cls.name}`}>
                        {cls.grade} {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status Kehadiran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="excellent">Sangat Baik</SelectItem>
                    <SelectItem value="good">Baik</SelectItem>
                    <SelectItem value="warning">Perhatian</SelectItem>
                    <SelectItem value="critical">Kritis</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={exportReport} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Laporan Kehadiran Siswa
                </div>
                <Badge variant="outline">
                  {filteredStudents.length} dari {students.length} siswa
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 font-medium">Siswa</th>
                      <th className="pb-3 font-medium">Kelas</th>
                      <th className="pb-3 font-medium text-center">Hadir</th>
                      <th className="pb-3 font-medium text-center">Terlambat</th>
                      <th className="pb-3 font-medium text-center">Tidak Hadir</th>
                      <th className="pb-3 font-medium text-center">Persentase</th>
                      <th className="pb-3 font-medium text-center">Status</th>
                      <th className="pb-3 font-medium">Terakhir Hadir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <div>
                            <div className="font-medium">{student.full_name}</div>
                            <div className="text-sm text-muted-foreground">{student.nis}</div>
                          </div>
                        </td>
                        <td className="py-3">{student.class_name}</td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>{student.present_days}</span>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            <span>{student.late_days}</span>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span>{student.absent_days}</span>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`font-semibold ${
                            student.attendance_rate >= 95 ? 'text-green-600' :
                            student.attendance_rate >= 85 ? 'text-blue-600' :
                            student.attendance_rate >= 75 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {student.attendance_rate}%
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          {getStatusBadge(student.status)}
                        </td>
                        <td className="py-3">
                          {student.last_attendance 
                            ? format(new Date(student.last_attendance), 'dd MMM yyyy', { locale: id })
                            : 'Belum pernah'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analisis Risiko
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Siswa Berisiko Tinggi (&lt;75%)</span>
                    <Badge variant="destructive">
                      {students.filter(s => s.attendance_rate < 75).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Perlu Perhatian (75-85%)</span>
                    <Badge variant="secondary">
                      {students.filter(s => s.attendance_rate >= 75 && s.attendance_rate < 85).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Baik (85-95%)</span>
                    <Badge variant="default" className="bg-blue-500">
                      {students.filter(s => s.attendance_rate >= 85 && s.attendance_rate < 95).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sangat Baik (≥95%)</span>
                    <Badge variant="default" className="bg-green-500">
                      {students.filter(s => s.attendance_rate >= 95).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Rekomendasi Tindakan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="font-medium text-red-800">Prioritas Tinggi</div>
                  <div className="text-sm text-red-600">
                    {students.filter(s => s.attendance_rate < 75).length} siswa perlu intervensi segera
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="font-medium text-yellow-800">Monitoring</div>
                  <div className="text-sm text-yellow-600">
                    {students.filter(s => s.attendance_rate >= 75 && s.attendance_rate < 85).length} siswa perlu pemantauan rutin
                  </div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="font-medium text-green-800">Pertahankan</div>
                  <div className="text-sm text-green-600">
                    {students.filter(s => s.attendance_rate >= 85).length} siswa dengan kehadiran baik
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
