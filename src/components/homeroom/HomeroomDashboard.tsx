
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, AlertTriangle, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { HomeroomStudentList } from './HomeroomStudentList';
import { HomeroomAnalytics } from './HomeroomAnalytics';

export const HomeroomDashboard = () => {
  const { user } = useAuth();

  // Query untuk mendapatkan kelas yang diampu
  const { data: homeroomClass, isLoading: loadingClass } = useQuery({
    queryKey: ['homeroom-class', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          academic_years (name),
          majors (name, code)
        `)
        .eq('homeroom_teacher_id', user?.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Query untuk statistik siswa di kelas
  const { data: classStats, isLoading: loadingStats } = useQuery({
    queryKey: ['class-stats', homeroomClass?.id],
    queryFn: async () => {
      if (!homeroomClass?.id) return null;

      // Get students in class
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select(`
          students (
            id,
            full_name,
            status
          )
        `)
        .eq('class_id', homeroomClass.id)
        .eq('status', 'active');

      const students = enrollments?.map(e => e.students).filter(Boolean) || [];
      const studentIds = students.map(s => s.id);

      // Get attendance today
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAttendance } = await supabase
        .from('student_self_attendances')
        .select('student_id, status')
        .in('student_id', studentIds)
        .eq('attendance_date', today);

      // Get violations this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const { data: monthlyViolations } = await supabase
        .from('student_violations')
        .select('student_id, point_deduction')
        .in('student_id', studentIds)
        .gte('violation_date', thisMonth.toISOString().split('T')[0]);

      // Get achievements this month
      const { data: monthlyAchievements } = await supabase
        .from('student_achievements')
        .select('student_id, point_reward')
        .in('student_id', studentIds)
        .eq('status', 'verified')
        .gte('achievement_date', thisMonth.toISOString().split('T')[0]);

      // Get pending achievements for verification
      const { data: pendingAchievements } = await supabase
        .from('student_achievements')
        .select(`
          *,
          students (full_name),
          achievement_types (name, category, level)
        `)
        .in('student_id', studentIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      const presentToday = todayAttendance?.filter(a => a.status === 'present').length || 0;
      const lateToday = todayAttendance?.filter(a => a.status === 'late').length || 0;
      const absentToday = students.length - (todayAttendance?.length || 0);

      return {
        totalStudents: students.length,
        presentToday,
        lateToday,
        absentToday,
        monthlyViolations: monthlyViolations?.length || 0,
        monthlyAchievements: monthlyAchievements?.length || 0,
        pendingAchievements: pendingAchievements || [],
        students
      };
    },
    enabled: !!homeroomClass?.id
  });

  if (loadingClass) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!homeroomClass) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Kelas yang Diampu</h3>
            <p className="text-muted-foreground">
              Anda belum ditetapkan sebagai wali kelas. Silakan hubungi admin.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const attendanceData = [
    { name: 'Hadir', value: classStats?.presentToday || 0, color: '#10b981' },
    { name: 'Terlambat', value: classStats?.lateToday || 0, color: '#f59e0b' },
    { name: 'Tidak Hadir', value: classStats?.absentToday || 0, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Class Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Dashboard Wali Kelas - {homeroomClass.name}
        </h1>
        <p className="opacity-90">
          {homeroomClass.majors?.name} • Tahun Ajaran {homeroomClass.academic_years?.name}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{classStats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Siswa di kelas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hadir Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{classStats?.presentToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              {classStats?.lateToday || 0} terlambat, {classStats?.absentToday || 0} tidak hadir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggaran Bulan Ini</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{classStats?.monthlyViolations || 0}</div>
            <p className="text-xs text-muted-foreground">Kasus pelanggaran</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestasi Bulan Ini</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{classStats?.monthlyAchievements || 0}</div>
            <p className="text-xs text-muted-foreground">Prestasi terverifikasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="students">Daftar Siswa</TabsTrigger>
          <TabsTrigger value="achievements">Verifikasi Prestasi</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Today's Attendance */}
            <Card>
              <CardHeader>
                <CardTitle>Kehadiran Hari Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    hadir: { label: "Hadir", color: "#10b981" },
                    terlambat: { label: "Terlambat", color: "#f59e0b" },
                    tidak_hadir: { label: "Tidak Hadir", color: "#ef4444" }
                  }}
                  className="h-[250px]"
                >
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Class Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Kinerja Kelas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tingkat Kehadiran</span>
                    <span className="text-sm font-bold text-green-600">
                      {classStats?.totalStudents ? 
                        Math.round(((classStats.presentToday + classStats.lateToday) / classStats.totalStudents) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${classStats?.totalStudents ? 
                          ((classStats.presentToday + classStats.lateToday) / classStats.totalStudents) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  
                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Pelanggaran Bulan Ini</span>
                      <span className="font-medium text-red-600">{classStats?.monthlyViolations || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Prestasi Bulan Ini</span>
                      <span className="font-medium text-yellow-600">{classStats?.monthlyAchievements || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <HomeroomStudentList classId={homeroomClass.id} />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prestasi Menunggu Verifikasi</CardTitle>
            </CardHeader>
            <CardContent>
              {classStats?.pendingAchievements.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">Tidak ada prestasi yang menunggu verifikasi</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {classStats?.pendingAchievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium">{achievement.students?.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {achievement.achievement_types?.name} ({achievement.achievement_types?.level})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Tolak
                        </Button>
                        <Button size="sm">
                          Verifikasi
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <HomeroomAnalytics classId={homeroomClass.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
