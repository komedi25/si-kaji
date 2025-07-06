import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import { 
  Calendar, 
  Trophy, 
  AlertTriangle, 
  BookOpen, 
  Clock,
  TrendingUp,
  FileText,
  Star,
  MapPin,
  Award,
  Target,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const chartConfig = {
  present: { label: "Hadir", color: "#10b981" },
  absent: { label: "Tidak Hadir", color: "#ef4444" },
  late: { label: "Terlambat", color: "#f59e0b" },
  permission: { label: "Izin", color: "#3b82f6" }
};

export const StudentDashboard = () => {
  const { user } = useAuth();

  // Get student data
  const { data: studentData, isLoading: loadingStudent } = useQuery({
    queryKey: ['student-data', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && user.roles?.includes('siswa'),
  });

  // Get attendance statistics
  const { data: attendanceStats, isLoading: loadingAttendance } = useQuery({
    queryKey: ['student-attendance-stats', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return null;

      const { data, error } = await supabase
        .from('student_attendances')
        .select('status, attendance_date')
        .eq('student_id', studentData.id)
        .order('attendance_date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      
      const stats = {
        present: data?.filter(a => a.status === 'present').length || 0,
        absent: data?.filter(a => a.status === 'absent').length || 0,
        late: data?.filter(a => a.status === 'late').length || 0,
        permission: data?.filter(a => a.status === 'permission').length || 0,
        total: data?.length || 0
      };
      
      // Weekly trend data
      const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        const dayData = data?.filter(a => a.attendance_date === dateStr);
        
        return {
          day: format(date, 'EEE', { locale: id }),
          present: dayData?.filter(a => a.status === 'present').length || 0,
          absent: dayData?.filter(a => a.status === 'absent').length || 0,
          late: dayData?.filter(a => a.status === 'late').length || 0
        };
      });
      
      return { ...stats, weeklyData };
    },
    enabled: !!studentData?.id,
  });

  // Get violations and achievements
  const { data: disciplineData, isLoading: loadingDiscipline } = useQuery({
    queryKey: ['student-discipline', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return null;

      const [violationsRes, achievementsRes] = await Promise.all([
        supabase
          .from('student_violations')
          .select(`
            *,
            violation_types (name, category, point_deduction)
          `)
          .eq('student_id', studentData.id)
          .order('violation_date', { ascending: false })
          .limit(10),
        
        supabase
          .from('student_achievements')
          .select(`
            *,
            achievement_types (name, category, level, point_reward)
          `)
          .eq('student_id', studentData.id)
          .order('achievement_date', { ascending: false })
          .limit(10)
      ]);

      if (violationsRes.error) throw violationsRes.error;
      if (achievementsRes.error) throw achievementsRes.error;

      const totalViolationPoints = violationsRes.data?.reduce((sum, v) => sum + (v.point_deduction || 0), 0) || 0;
      const totalAchievementPoints = achievementsRes.data?.reduce((sum, a) => sum + (a.achievement_types?.point_reward || 0), 0) || 0;
      const disciplineScore = Math.max(0, 100 - totalViolationPoints + totalAchievementPoints);

      return {
        violations: violationsRes.data || [],
        achievements: achievementsRes.data || [],
        totalViolationPoints,
        totalAchievementPoints,
        disciplineScore
      };
    },
    enabled: !!studentData?.id,
  });

  // Get extracurricular activities
  const { data: activities, isLoading: loadingActivities } = useQuery({
    queryKey: ['student-activities', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return null;

      const { data, error } = await supabase
        .from('extracurricular_enrollments')
        .select(`
          *,
          extracurriculars (
            name,
            description,
            schedule_day,
            schedule_time,
            location
          )
        `)
        .eq('student_id', studentData.id)
        .eq('status', 'active');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentData?.id,
  });

  // Get recent permits
  const { data: permits, isLoading: loadingPermits } = useQuery({
    queryKey: ['student-permits', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return null;

      const { data, error } = await supabase
        .from('student_permits')
        .select('*')
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentData?.id,
  });

  if (loadingStudent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const attendancePercentage = attendanceStats?.total 
    ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
    : 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Selamat Datang, {studentData?.full_name}
            </h1>
            <p className="text-blue-100">
              NIS: {studentData?.nis} | Status: {studentData?.status}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Badge className="bg-white/20 text-white border-white/20">
              Dashboard Siswa
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Kehadiran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {attendancePercentage}%
            </div>
            <p className="text-xs text-green-600 mt-1">
              {attendanceStats?.present || 0} dari {attendanceStats?.total || 0} hari
            </p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Skor Disiplin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {disciplineData?.disciplineScore || 100}
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              {disciplineData?.disciplineScore >= 80 ? 'Baik' : 
               disciplineData?.disciplineScore >= 60 ? 'Cukup' : 'Perlu Perbaikan'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Prestasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {disciplineData?.achievements?.length || 0}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Total {disciplineData?.totalAchievementPoints || 0} poin
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Kegiatan Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {activities?.length || 0}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Ekstrakurikuler
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
          <TabsTrigger value="discipline">Disiplin & Prestasi</TabsTrigger>
          <TabsTrigger value="activities">Kegiatan</TabsTrigger>
          <TabsTrigger value="permits">Perizinan</TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                  Tren Kehadiran Mingguan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <ChartContainer config={chartConfig} className="h-64 md:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={attendanceStats?.weeklyData || []}
                      margin={{ 
                        top: 10, 
                        right: 10, 
                        left: 0, 
                        bottom: 0 
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 10 }}
                        tickLine={{ stroke: '#cbd5e1' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickLine={{ stroke: '#cbd5e1' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        width={30}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        contentStyle={{
                          fontSize: '12px',
                          padding: '8px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="present" 
                        stackId="1"
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="late" 
                        stackId="1"
                        stroke="#f59e0b" 
                        fill="#f59e0b" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="absent" 
                        stackId="1"
                        stroke="#ef4444" 
                        fill="#ef4444" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Ringkasan Kehadiran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Hadir</span>
                    <span className="text-sm text-green-600">
                      {attendanceStats?.present || 0} hari
                    </span>
                  </div>
                  <Progress value={attendancePercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-xl md:text-2xl font-bold text-yellow-600">
                      {attendanceStats?.late || 0}
                    </div>
                    <div className="text-xs text-yellow-600">Terlambat</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xl md:text-2xl font-bold text-red-600">
                      {attendanceStats?.absent || 0}
                    </div>
                    <div className="text-xs text-red-600">Tidak Hadir</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Discipline & Achievement Tab */}
        <TabsContent value="discipline" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Prestasi Terbaru
                </CardTitle>
                <CardDescription>
                  Daftar prestasi yang telah dicapai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {disciplineData?.achievements?.slice(0, 5).map((achievement: any) => (
                    <div key={achievement.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <Award className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {achievement.achievement_types?.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {format(new Date(achievement.achievement_date), 'dd MMM yyyy', { locale: id })}
                        </div>
                        <Badge variant="secondary" className="mt-1">
                          +{achievement.achievement_types?.point_reward} poin
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Belum ada prestasi</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Catatan Pelanggaran
                </CardTitle>
                <CardDescription>
                  Riwayat pelanggaran yang perlu diperbaiki
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {disciplineData?.violations?.slice(0, 5).map((violation: any) => (
                    <div key={violation.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {violation.violation_types?.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {format(new Date(violation.violation_date), 'dd MMM yyyy', { locale: id })}
                        </div>
                        <Badge variant="destructive" className="mt-1">
                          -{violation.point_deduction} poin
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Tidak ada pelanggaran</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities?.map((activity: any) => (
              <Card key={activity.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {activity.extracurriculars?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {activity.extracurriculars?.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    {activity.extracurriculars?.schedule_day} - {activity.extracurriculars?.schedule_time}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    {activity.extracurriculars?.location}
                  </div>
                  <Badge className="mt-2">
                    Aktif sejak {format(new Date(activity.enrollment_date), 'MMM yyyy', { locale: id })}
                  </Badge>
                </CardContent>
              </Card>
            )) || (
              <Card className="col-span-3">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Belum mengikuti kegiatan ekstrakurikuler</p>
                  <Button className="mt-4" size="sm">
                    Daftar Ekstrakurikuler
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Permits Tab */}
        <TabsContent value="permits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Riwayat Perizinan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {permits?.map((permit: any) => (
                  <div key={permit.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <div className="font-medium">{permit.permit_type}</div>
                        <div className="text-sm text-gray-600">{permit.reason}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(permit.start_date), 'dd MMM yyyy', { locale: id })} - 
                          {format(new Date(permit.end_date), 'dd MMM yyyy', { locale: id })}
                        </div>
                      </div>
                      <Badge 
                        variant={
                          permit.status === 'approved' ? 'default' :
                          permit.status === 'rejected' ? 'destructive' : 'secondary'
                        }
                      >
                        {permit.status === 'approved' ? 'Disetujui' :
                         permit.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                      </Badge>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Belum ada riwayat perizinan</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
