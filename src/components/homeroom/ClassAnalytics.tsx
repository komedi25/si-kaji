
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Calendar, Award, AlertTriangle, GraduationCap, Loader2 } from 'lucide-react';
import { ClassSelector } from '@/components/common/ClassSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface ClassAnalyticsData {
  totalStudents: number;
  attendanceRate: number;
  disciplineScore: number;
  totalAchievements: number;
  attendanceData: Array<{ day: string; rate: number }>;
  behaviorData: Array<{ name: string; value: number; color: string }>;
  monthlyProgress: Array<{ 
    month: string; 
    kehadiran: number; 
    perilaku: number; 
    prestasi: number; 
  }>;
  performanceSummary: {
    excellentAttendance: number;
    goodDiscipline: number;
    hasAchievements: number;
  };
  recommendations: string[];
}

export const ClassAnalytics = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<ClassAnalyticsData | null>(null);

  const fetchClassAnalytics = async (classId: string) => {
    if (!classId || classId === 'all') return;
    
    try {
      setLoading(true);
      
      // Get students in the class
      const { data: students, error: studentsError } = await supabase
        .from('student_enrollments')
        .select(`
          student_id,
          students (
            id,
            full_name,
            nis
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'active');

      if (studentsError) throw studentsError;

      const studentIds = students?.map(s => s.student_id) || [];
      const totalStudents = studentIds.length;

      if (totalStudents === 0) {
        setAnalyticsData({
          totalStudents: 0,
          attendanceRate: 0,
          disciplineScore: 0,
          totalAchievements: 0,
          attendanceData: [],
          behaviorData: [],
          monthlyProgress: [],
          performanceSummary: {
            excellentAttendance: 0,
            goodDiscipline: 0,
            hasAchievements: 0
          },
          recommendations: ['Tidak ada data siswa untuk kelas ini']
        });
        return;
      }

      // Get attendance data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('student_attendances')
        .select('*')
        .in('student_id', studentIds)
        .gte('attendance_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (attendanceError) throw attendanceError;

      // Get discipline points
      const { data: disciplineData, error: disciplineError } = await supabase
        .from('student_discipline_points')
        .select('*')
        .in('student_id', studentIds);

      if (disciplineError) throw disciplineError;

      // Get achievements (this year)
      const currentYear = new Date().getFullYear();
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('student_achievements')
        .select('*')
        .in('student_id', studentIds)
        .gte('achievement_date', `${currentYear}-01-01`)
        .eq('status', 'verified');

      if (achievementsError) throw achievementsError;

      // Calculate attendance rate
      const totalAttendanceDays = attendanceData?.length || 0;
      const presentDays = attendanceData?.filter(a => a.status === 'present').length || 0;
      const attendanceRate = totalAttendanceDays > 0 ? (presentDays / totalAttendanceDays) * 100 : 0;

      // Calculate average discipline score
      const avgDisciplineScore = disciplineData?.length > 0 
        ? disciplineData.reduce((sum, d) => sum + (d.final_score || 0), 0) / disciplineData.length 
        : 0;

      // Generate weekly attendance data
      const weeklyAttendance = [];
      const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      for (let i = 0; i < 6; i++) {
        const dayData = attendanceData?.filter(a => {
          const date = new Date(a.attendance_date);
          return date.getDay() === (i + 1) % 7;
        }) || [];
        const dayPresent = dayData.filter(a => a.status === 'present').length;
        const dayTotal = dayData.length;
        const rate = dayTotal > 0 ? (dayPresent / dayTotal) * 100 : 0;
        weeklyAttendance.push({ day: days[i], rate: Math.round(rate) });
      }

      // Generate behavior distribution
      const excellentCount = disciplineData?.filter(d => (d.final_score || 0) >= 90).length || 0;
      const goodCount = disciplineData?.filter(d => (d.final_score || 0) >= 75 && (d.final_score || 0) < 90).length || 0;
      const warningCount = disciplineData?.filter(d => (d.final_score || 0) >= 60 && (d.final_score || 0) < 75).length || 0;
      const criticalCount = disciplineData?.filter(d => (d.final_score || 0) < 60).length || 0;

      const behaviorData = [
        { name: 'Sangat Baik', value: excellentCount, color: '#00C49F' },
        { name: 'Baik', value: goodCount, color: '#0088FE' },
        { name: 'Perhatian', value: warningCount, color: '#FFBB28' },
        { name: 'Kritis', value: criticalCount, color: '#FF8042' }
      ];

      // Generate monthly progress (last 6 months)
      const monthlyProgress = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthName = months[monthDate.getMonth()];
        
        // Calculate monthly attendance
        const monthAttendance = attendanceData?.filter(a => {
          const date = new Date(a.attendance_date);
          return date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear();
        }) || [];
        const monthPresent = monthAttendance.filter(a => a.status === 'present').length;
        const monthTotal = monthAttendance.length;
        const monthAttendanceRate = monthTotal > 0 ? (monthPresent / monthTotal) * 100 : 0;

        // Use discipline score as behavior metric
        const monthBehavior = Math.round(avgDisciplineScore * 0.9); // Slightly lower than discipline score

        // Calculate achievement score based on achievements this month
        const monthAchievements = achievementsData?.filter(a => {
          const date = new Date(a.achievement_date);
          return date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear();
        }).length || 0;
        const monthAchievementScore = Math.min(monthAchievements * 20, 100); // 20 points per achievement, max 100

        monthlyProgress.push({
          month: monthName,
          kehadiran: Math.round(monthAttendanceRate),
          perilaku: monthBehavior,
          prestasi: monthAchievementScore
        });
      }

      // Calculate performance summary
      const excellentAttendanceCount = studentIds.filter(studentId => {
        const studentAttendance = attendanceData?.filter(a => a.student_id === studentId) || [];
        const studentPresent = studentAttendance.filter(a => a.status === 'present').length;
        const studentTotal = studentAttendance.length;
        return studentTotal > 0 ? (studentPresent / studentTotal) >= 0.95 : false;
      }).length;

      const goodDisciplineCount = disciplineData?.filter(d => (d.final_score || 0) >= 80).length || 0;
      const hasAchievementsCount = [...new Set(achievementsData?.map(a => a.student_id) || [])].length;

      // Generate recommendations
      const recommendations = [];
      const lowAttendanceCount = totalStudents - excellentAttendanceCount;
      const poorDisciplineCount = totalStudents - goodDisciplineCount;
      const noAchievementsCount = totalStudents - hasAchievementsCount;

      if (lowAttendanceCount > 0) {
        recommendations.push(`${lowAttendanceCount} siswa memerlukan perhatian khusus untuk peningkatan kehadiran`);
      }
      if (poorDisciplineCount > 0) {
        recommendations.push(`${poorDisciplineCount} siswa perlu bimbingan konseling untuk perbaikan perilaku`);
      }
      if (noAchievementsCount > 0) {
        recommendations.push(`${noAchievementsCount} siswa potensial untuk dikembangkan prestasinya`);
      }
      
      const parentCommunicationNeeded = Math.round((lowAttendanceCount + poorDisciplineCount) * 0.6);
      if (parentCommunicationNeeded > 0) {
        recommendations.push(`Komunikasi intensif dengan ${parentCommunicationNeeded} orang tua siswa yang perlu perhatian`);
      }

      setAnalyticsData({
        totalStudents,
        attendanceRate: Math.round(attendanceRate),
        disciplineScore: Math.round(avgDisciplineScore),
        totalAchievements: achievementsData?.length || 0,
        attendanceData: weeklyAttendance,
        behaviorData,
        monthlyProgress,
        performanceSummary: {
          excellentAttendance: excellentAttendanceCount,
          goodDiscipline: goodDisciplineCount,
          hasAchievements: hasAchievementsCount
        },
        recommendations
      });

    } catch (error) {
      console.error('Error fetching class analytics:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data analisis kelas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedClass !== 'all') {
      fetchClassAnalytics(selectedClass);
    }
  }, [selectedClass]);

  if (!hasRole('admin') && !hasRole('wali_kelas') && !hasRole('waka_kesiswaan')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-orange-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Akses Terbatas</h3>
              <p className="text-gray-500 mt-2">
                Anda tidak memiliki akses untuk melihat analisis kelas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Class Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Kelas untuk Analisis</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassSelector
            value={selectedClass}
            onValueChange={setSelectedClass}
            placeholder="Pilih kelas yang akan dianalisis"
            allowAll={false}
          />
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Memuat data analisis...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedClass && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              Silakan pilih kelas untuk melihat analisis data
            </div>
          </CardContent>
        </Card>
      )}

      {analyticsData && !loading && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Siswa aktif di kelas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.attendanceRate >= 95 ? (
                    <span className="text-green-500">Sangat baik</span>
                  ) : analyticsData.attendanceRate >= 85 ? (
                    <span className="text-blue-500">Baik</span>
                  ) : (
                    <span className="text-orange-500">Perlu perhatian</span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rata-rata Disiplin</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.disciplineScore}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.disciplineScore >= 90 ? (
                    <span className="text-green-500">Sangat baik</span>
                  ) : analyticsData.disciplineScore >= 75 ? (
                    <span className="text-blue-500">Baik</span>
                  ) : (
                    <span className="text-orange-500">Perlu bimbingan</span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Prestasi</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalAchievements}</div>
                <p className="text-xs text-muted-foreground">
                  Prestasi tahun ini
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trend Kehadiran Harian</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.attendanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analyticsData.attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Tingkat Kehadiran']} />
                      <Line type="monotone" dataKey="rate" stroke="#0088FE" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-gray-500">
                    Tidak ada data kehadiran
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribusi Status Perilaku</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.behaviorData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analyticsData.behaviorData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.behaviorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-gray-500">
                    Tidak ada data perilaku
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Progres Bulanan Kelas</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.monthlyProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.monthlyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="kehadiran" fill="#0088FE" name="Kehadiran %" />
                    <Bar dataKey="perilaku" fill="#00C49F" name="Perilaku Score" />
                    <Bar dataKey="prestasi" fill="#FFBB28" name="Prestasi Score" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  Tidak ada data progres bulanan
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Performa Siswa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Kehadiran Sangat Baik (≥95%)</span>
                      <span className="text-sm text-muted-foreground">{analyticsData.performanceSummary.excellentAttendance} siswa</span>
                    </div>
                    <Progress 
                      value={analyticsData.totalStudents > 0 ? (analyticsData.performanceSummary.excellentAttendance / analyticsData.totalStudents) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Disiplin Baik (≥80)</span>
                      <span className="text-sm text-muted-foreground">{analyticsData.performanceSummary.goodDiscipline} siswa</span>
                    </div>
                    <Progress 
                      value={analyticsData.totalStudents > 0 ? (analyticsData.performanceSummary.goodDiscipline / analyticsData.totalStudents) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Memiliki Prestasi</span>
                      <span className="text-sm text-muted-foreground">{analyticsData.performanceSummary.hasAchievements} siswa</span>
                    </div>
                    <Progress 
                      value={analyticsData.totalStudents > 0 ? (analyticsData.performanceSummary.hasAchievements / analyticsData.totalStudents) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>

                {analyticsData.recommendations.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Rekomendasi Tindak Lanjut</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {analyticsData.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
