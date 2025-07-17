
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Award, AlertTriangle, User, Calendar } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const StudentProgressReport = () => {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('semester');

  // Get students list
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          nis,
          status,
          student_enrollments!inner(
            classes!inner(
              name,
              grade
            )
          )
        `)
        .eq('status', 'active')
        .eq('student_enrollments.status', 'active');

      if (error) throw error;
      return data;
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('wali_kelas')),
  });

  // Get detailed student progress
  const { data: studentProgress, isLoading: loadingProgress } = useQuery({
    queryKey: ['student-progress', selectedStudent, selectedPeriod],
    queryFn: async () => {
      if (!selectedStudent) return null;

      const startDate = selectedPeriod === 'year' 
        ? new Date(new Date().getFullYear(), 0, 1).toISOString()
        : new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1).toISOString();

      // Get attendance data
      const { data: attendance } = await supabase
        .from('unified_attendances')
        .select('attendance_date, status')
        .eq('student_id', selectedStudent)
        .gte('attendance_date', startDate.split('T')[0])
        .order('attendance_date', { ascending: true });

      // Get violations data
      const { data: violations } = await supabase
        .from('student_violations')
        .select(`
          violation_date,
          point_deduction,
          status,
          violation_types!inner(
            name,
            category
          )
        `)
        .eq('student_id', selectedStudent)
        .gte('violation_date', startDate.split('T')[0])
        .eq('status', 'active');

      // Get achievements data
      const { data: achievements } = await supabase
        .from('student_achievements')
        .select(`
          achievement_date,
          point_reward,
          status,
          achievement_types!inner(
            name,
            level,
            category
          )
        `)
        .eq('student_id', selectedStudent)
        .gte('achievement_date', startDate.split('T')[0])
        .eq('status', 'verified');

      // Get discipline points
      const { data: disciplinePoints } = await supabase
        .from('student_discipline_points')
        .select('*')
        .eq('student_id', selectedStudent)
        .order('last_updated', { ascending: false })
        .limit(1);

      return {
        attendance: attendance || [],
        violations: violations || [],
        achievements: achievements || [],
        disciplinePoints: disciplinePoints?.[0] || null
      };
    },
    enabled: !!selectedStudent,
  });

  // Process attendance trends
  const attendanceTrends = studentProgress?.attendance?.reduce((acc: any[], record) => {
    const month = new Date(record.attendance_date).toLocaleDateString('id-ID', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    
    if (existing) {
      existing[record.status]++;
    } else {
      acc.push({
        month,
        present: record.status === 'present' ? 1 : 0,
        absent: record.status === 'absent' ? 1 : 0,
        late: record.status === 'late' ? 1 : 0
      });
    }
    return acc;
  }, []) || [];

  // Process violations by category
  const violationsByCategory = studentProgress?.violations?.reduce((acc: any[], violation: any) => {
    const category = violation.violation_types?.category || 'Lainnya';
    const existing = acc.find(item => item.category === category);
    
    if (existing) {
      existing.count++;
      existing.points += violation.point_deduction;
    } else {
      acc.push({
        category,
        count: 1,
        points: violation.point_deduction
      });
    }
    return acc;
  }, []) || [];

  // Process achievements by level
  const achievementsByLevel = studentProgress?.achievements?.reduce((acc: any[], achievement: any) => {
    const level = achievement.achievement_types?.level || 'Lainnya';
    const existing = acc.find(item => item.level === level);
    
    if (existing) {
      existing.count++;
      existing.points += achievement.point_reward;
    } else {
      acc.push({
        level,
        count: 1,
        points: achievement.point_reward
      });
    }
    return acc;
  }, []) || [];

  const calculateAttendanceRate = () => {
    if (!studentProgress?.attendance?.length) return 0;
    const presentCount = studentProgress.attendance.filter(a => a.status === 'present').length;
    return Math.round((presentCount / studentProgress.attendance.length) * 100);
  };

  const getProgressStatus = (score: number) => {
    if (score >= 90) return { status: 'Sangat Baik', color: 'bg-green-500', variant: 'default' as const };
    if (score >= 75) return { status: 'Baik', color: 'bg-blue-500', variant: 'secondary' as const };
    if (score >= 60) return { status: 'Cukup', color: 'bg-yellow-500', variant: 'outline' as const };
    return { status: 'Perlu Perhatian', color: 'bg-red-500', variant: 'destructive' as const };
  };

  if (!user?.roles?.includes('admin') && !user?.roles?.includes('wali_kelas')) {
    return (
      <div className="text-center p-8">
        <p>Anda tidak memiliki akses untuk melihat laporan ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Laporan Perkembangan Siswa
          </CardTitle>
          <CardDescription>
            Analisis mendalam perkembangan akademik dan non-akademik siswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih siswa..." />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} - {student.nis}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semester">6 Bulan</SelectItem>
                  <SelectItem value="year">1 Tahun</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedStudent && studentProgress && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Ringkasan</TabsTrigger>
                <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
                <TabsTrigger value="behavior">Perilaku</TabsTrigger>
                <TabsTrigger value="achievements">Prestasi</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Calendar className="w-8 h-8 mx-auto text-green-600 mb-2" />
                        <div className="text-2xl font-bold">{calculateAttendanceRate()}%</div>
                        <div className="text-sm text-muted-foreground">Tingkat Kehadiran</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <AlertTriangle className="w-8 h-8 mx-auto text-red-600 mb-2" />
                        <div className="text-2xl font-bold">{studentProgress.violations?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Pelanggaran</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Award className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                        <div className="text-2xl font-bold">{studentProgress.achievements?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Prestasi</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <TrendingUp className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                        <div className="text-2xl font-bold">{studentProgress.disciplinePoints?.final_score || 100}</div>
                        <div className="text-sm text-muted-foreground">Poin Disiplin</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {studentProgress.disciplinePoints && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Status Disiplin</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <span>Skor Disiplin</span>
                        <Badge variant={getProgressStatus(studentProgress.disciplinePoints.final_score).variant}>
                          {getProgressStatus(studentProgress.disciplinePoints.final_score).status}
                        </Badge>
                      </div>
                      <Progress value={studentProgress.disciplinePoints.final_score} className="mb-2" />
                      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Poin Pelanggaran: </span>
                          <span className="font-medium text-red-600">
                            -{studentProgress.disciplinePoints.total_violation_points}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Poin Prestasi: </span>
                          <span className="font-medium text-green-600">
                            +{studentProgress.disciplinePoints.total_achievement_points}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="attendance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Trend Kehadiran</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={attendanceTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="present" fill="#10b981" name="Hadir" />
                        <Bar dataKey="late" fill="#f59e0b" name="Terlambat" />
                        <Bar dataKey="absent" fill="#ef4444" name="Tidak Hadir" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="behavior" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pelanggaran Berdasarkan Kategori</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={violationsByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, count }) => `${category} (${count})`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {violationsByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Prestasi Berdasarkan Level</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={achievementsByLevel}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="level" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0088FE" name="Jumlah Prestasi" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
