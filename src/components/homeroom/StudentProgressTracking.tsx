
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  User, 
  Award, 
  AlertTriangle,
  Target,
  BookOpen,
  Users,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';

export const StudentProgressTracking = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('semester');

  // Get classes for teacher
  const { data: teacherClasses } = useQuery({
    queryKey: ['teacher-classes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          grade,
          major:majors(name)
        `)
        .eq('homeroom_teacher_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && user?.roles?.includes('wali_kelas'),
  });

  // Get students with comprehensive progress data
  const { data: studentsProgress, isLoading } = useQuery({
    queryKey: ['students-progress', selectedClass, selectedPeriod],
    queryFn: async () => {
      if (!selectedClass) return [];

      const periodMonths = selectedPeriod === 'year' ? 12 : 6;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - periodMonths);

      // Get students in the class
      const { data: enrollments, error: enrollError } = await supabase
        .from('student_enrollments')
        .select(`
          student_id,
          students!inner(
            id,
            full_name,
            nis,
            gender
          )
        `)
        .eq('class_id', selectedClass)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      const studentIds = enrollments?.map(e => e.student_id) || [];

      // Get comprehensive data for each student
      const [attendanceData, violationData, achievementData, disciplineData] = await Promise.all([
        // Attendance data
        supabase
          .from('student_attendances')
          .select('student_id, attendance_date, status')
          .in('student_id', studentIds)
          .gte('attendance_date', startDate.toISOString().split('T')[0]),

        // Violation data
        supabase
          .from('student_violations')
          .select(`
            student_id,
            violation_date,
            point_deduction,
            violation_types!inner(
              name,
              category
            )
          `)
          .in('student_id', studentIds)
          .gte('violation_date', startDate.toISOString().split('T')[0])
          .eq('status', 'active'),

        // Achievement data
        supabase
          .from('student_achievements')
          .select(`
            student_id,
            achievement_date,
            point_reward,
            achievement_types!inner(
              name,
              level
            )
          `)
          .in('student_id', studentIds)
          .gte('achievement_date', startDate.toISOString().split('T')[0])
          .eq('status', 'verified'),

        // Discipline points
        supabase
          .from('student_discipline_points')
          .select('*')
          .in('student_id', studentIds)
      ]);

      // Process and combine data
      const processedStudents = enrollments?.map((enrollment: any) => {
        const student = enrollment.students;
        const studentId = student.id;

        // Process attendance
        const studentAttendance = attendanceData.data?.filter(a => a.student_id === studentId) || [];
        const attendanceRate = studentAttendance.length > 0 
          ? Math.round((studentAttendance.filter(a => a.status === 'present').length / studentAttendance.length) * 100)
          : 100;

        // Process violations
        const studentViolations = violationData.data?.filter(v => v.student_id === studentId) || [];
        const totalViolationPoints = studentViolations.reduce((sum, v) => sum + v.point_deduction, 0);

        // Process achievements
        const studentAchievements = achievementData.data?.filter(a => a.student_id === studentId) || [];
        const totalAchievementPoints = studentAchievements.reduce((sum, a) => sum + a.point_reward, 0);

        // Get discipline status
        const disciplineRecord = disciplineData.data?.find(d => d.student_id === studentId);
        const finalScore = disciplineRecord?.final_score || (100 - totalViolationPoints + totalAchievementPoints);
        const disciplineStatus = disciplineRecord?.discipline_status || 
          (finalScore >= 90 ? 'excellent' : finalScore >= 75 ? 'good' : finalScore >= 60 ? 'warning' : 'critical');

        return {
          ...student,
          attendanceRate,
          violationCount: studentViolations.length,
          achievementCount: studentAchievements.length,
          finalScore,
          disciplineStatus,
          totalViolationPoints,
          totalAchievementPoints,
          attendanceData: studentAttendance,
          violationsData: studentViolations,
          achievementsData: studentAchievements
        };
      }) || [];

      return processedStudents;
    },
    enabled: !!selectedClass,
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'excellent': { label: 'Sangat Baik', variant: 'default' as const },
      'good': { label: 'Baik', variant: 'secondary' as const },
      'warning': { label: 'Perhatian', variant: 'outline' as const },
      'critical': { label: 'Kritis', variant: 'destructive' as const }
    };
    
    const config = statusMap[status] || statusMap.good;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate class statistics
  const classStats = React.useMemo(() => {
    if (!studentsProgress?.length) return null;

    const avgAttendance = Math.round(
      studentsProgress.reduce((sum, s) => sum + s.attendanceRate, 0) / studentsProgress.length
    );
    const avgDiscipline = Math.round(
      studentsProgress.reduce((sum, s) => sum + s.finalScore, 0) / studentsProgress.length
    );
    const totalViolations = studentsProgress.reduce((sum, s) => sum + s.violationCount, 0);
    const totalAchievements = studentsProgress.reduce((sum, s) => sum + s.achievementCount, 0);

    const riskLevels = {
      high: studentsProgress.filter(s => s.finalScore < 60).length,
      medium: studentsProgress.filter(s => s.finalScore >= 60 && s.finalScore < 75).length,
      low: studentsProgress.filter(s => s.finalScore >= 75).length
    };

    return {
      avgAttendance,
      avgDiscipline,
      totalViolations,
      totalAchievements,
      riskLevels,
      topPerformers: studentsProgress
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, 3),
      needAttention: studentsProgress
        .filter(s => s.finalScore < 75 || s.attendanceRate < 80)
        .sort((a, b) => a.finalScore - b.finalScore)
    };
  }, [studentsProgress]);

  // Process trend data
  const trendData = React.useMemo(() => {
    if (!studentsProgress?.length) return [];

    const monthlyData = {};
    
    studentsProgress.forEach(student => {
      student.attendanceData?.forEach((attendance: any) => {
        const month = new Date(attendance.attendance_date).toLocaleDateString('id-ID', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month,
            presentCount: 0,
            totalCount: 0,
            violationCount: 0,
            achievementCount: 0
          };
        }
        
        monthlyData[month].totalCount++;
        if (attendance.status === 'present') {
          monthlyData[month].presentCount++;
        }
      });

      student.violationsData?.forEach((violation: any) => {
        const month = new Date(violation.violation_date).toLocaleDateString('id-ID', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        if (monthlyData[month]) {
          monthlyData[month].violationCount++;
        }
      });

      student.achievementsData?.forEach((achievement: any) => {
        const month = new Date(achievement.achievement_date).toLocaleDateString('id-ID', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        if (monthlyData[month]) {
          monthlyData[month].achievementCount++;
        }
      });
    });

    return Object.values(monthlyData).map((data: any) => ({
      ...data,
      attendanceRate: data.totalCount > 0 ? Math.round((data.presentCount / data.totalCount) * 100) : 0
    }));
  }, [studentsProgress]);

  if (!user?.roles?.includes('wali_kelas') && !user?.roles?.includes('admin')) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Anda tidak memiliki akses untuk melihat tracking perkembangan siswa.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Sistem Tracking Perkembangan Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas..." />
                </SelectTrigger>
                <SelectContent>
                  {teacherClasses?.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.major?.name}
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

          {selectedClass && classStats && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Ringkasan</TabsTrigger>
                <TabsTrigger value="individuals">Individu</TabsTrigger>
                <TabsTrigger value="trends">Trend</TabsTrigger>
                <TabsTrigger value="analysis">Analisis</TabsTrigger>
                <TabsTrigger value="interventions">Intervensi</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Class Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                        <div className="text-2xl font-bold">{studentsProgress?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Siswa</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Calendar className="w-8 h-8 mx-auto text-green-600 mb-2" />
                        <div className="text-2xl font-bold">{classStats.avgAttendance}%</div>
                        <div className="text-sm text-muted-foreground">Rata-rata Kehadiran</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Target className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                        <div className="text-2xl font-bold">{classStats.avgDiscipline}</div>
                        <div className="text-sm text-muted-foreground">Rata-rata Disiplin</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Award className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                        <div className="text-2xl font-bold">{classStats.totalAchievements}</div>
                        <div className="text-sm text-muted-foreground">Total Prestasi</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Risk Level Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribusi Tingkat Risiko</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-green-600">Risiko Rendah (≥75)</span>
                          <span className="font-bold">{classStats.riskLevels.low} siswa</span>
                        </div>
                        <Progress value={(classStats.riskLevels.low / studentsProgress.length) * 100} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-yellow-600">Risiko Sedang (60-74)</span>
                          <span className="font-bold">{classStats.riskLevels.medium} siswa</span>
                        </div>
                        <Progress value={(classStats.riskLevels.medium / studentsProgress.length) * 100} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-red-600">Risiko Tinggi (<60)</span>
                          <span className="font-bold">{classStats.riskLevels.high} siswa</span>
                        </div>
                        <Progress value={(classStats.riskLevels.high / studentsProgress.length) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Siswa Berprestasi Terbaik</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {classStats.topPerformers.map((student: any, index) => (
                          <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              <span className="font-medium">{student.full_name}</span>
                            </div>
                            <span className="font-bold text-green-600">{student.finalScore}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="individuals" className="space-y-4">
                <div className="grid gap-4">
                  {studentsProgress?.map((student: any) => (
                    <Card key={student.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{student.full_name}</h3>
                              <p className="text-sm text-muted-foreground">NIS: {student.nis}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">Skor Disiplin</div>
                              <div className={`font-bold ${getProgressColor(student.finalScore)}`}>
                                {student.finalScore}
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">Status</div>
                              {getStatusBadge(student.disciplineStatus)}
                            </div>

                            <Progress 
                              value={student.finalScore} 
                              className="w-24"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span>Kehadiran: {student.attendanceRate}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span>Pelanggaran: {student.violationCount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-yellow-600" />
                            <span>Prestasi: {student.achievementCount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span>Poin: {student.totalAchievementPoints - student.totalViolationPoints}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="trends" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Trend Kehadiran Kelas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="attendanceRate" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="Tingkat Kehadiran (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trend Pelanggaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="violationCount" fill="#ef4444" name="Pelanggaran" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Trend Prestasi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Area 
                            type="monotone" 
                            dataKey="achievementCount" 
                            stroke="#f59e0b" 
                            fill="#f59e0b" 
                            name="Prestasi"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Analisis Kelas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Kekuatan Kelas</h4>
                        <ul className="space-y-2 text-sm">
                          {classStats.avgAttendance >= 90 && (
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Tingkat kehadiran sangat baik ({classStats.avgAttendance}%)
                            </li>
                          )}
                          {classStats.avgDiscipline >= 80 && (
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Disiplin kelas dalam kategori baik
                            </li>
                          )}
                          {classStats.totalAchievements > studentsProgress.length && (
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Banyak siswa yang berprestasi
                            </li>
                          )}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Area yang Perlu Perbaikan</h4>
                        <ul className="space-y-2 text-sm">
                          {classStats.avgAttendance < 80 && (
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              Tingkat kehadiran perlu ditingkatkan
                            </li>
                          )}
                          {classStats.riskLevels.high > 0 && (
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              {classStats.riskLevels.high} siswa dalam kategori risiko tinggi
                            </li>
                          )}
                          {classStats.totalViolations > studentsProgress.length * 2 && (
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              Tingkat pelanggaran cukup tinggi
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interventions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Rekomendasi Intervensi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {classStats.needAttention.length > 0 ? (
                      <div className="space-y-4">
                        <h4 className="font-medium">Siswa yang Memerlukan Perhatian Khusus:</h4>
                        {classStats.needAttention.slice(0, 5).map((student: any) => (
                          <div key={student.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h5 className="font-medium">{student.full_name}</h5>
                                <p className="text-sm text-muted-foreground">NIS: {student.nis}</p>
                              </div>
                              <Badge variant="outline">Prioritas Tinggi</Badge>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              {student.finalScore < 60 && (
                                <p>• Perlu konseling dan pembinaan intensif untuk meningkatkan disiplin</p>
                              )}
                              {student.attendanceRate < 80 && (
                                <p>• Koordinasi dengan orang tua untuk meningkatkan kehadiran</p>
                              )}
                              {student.violationCount > 3 && (
                                <p>• Implementasi program pembinaan karakter</p>
                              )}
                              {student.achievementCount === 0 && (
                                <p>• Identifikasi bakat dan minat untuk pengembangan potensi</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
                        <h4 className="font-medium mb-2">Kelas dalam Kondisi Baik</h4>
                        <p className="text-muted-foreground">
                          Semua siswa berada dalam performa yang memuaskan. 
                          Lanjutkan monitoring rutin dan pertahankan kualitas pembelajaran.
                        </p>
                      </div>
                    )}
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
