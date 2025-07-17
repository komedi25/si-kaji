
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Trophy,
  Calendar,
  BookOpen,
  FileText,
  Clock,
  Target,
  Award
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

export const HomeroomTeacherDashboard = () => {
  const { user } = useAuth();

  // Get homeroom class data
  const { data: classData, isLoading: loadingClass } = useQuery({
    queryKey: ['homeroom-class', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          majors (name, code),
          academic_years (name)
        `)
        .eq('homeroom_teacher_id', user?.id)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && user.roles?.includes('wali_kelas'),
  });

  // Get students in class
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['class-students', classData?.id],
    queryFn: async () => {
      if (!classData?.id) return [];

      const { data, error } = await supabase
        .from('student_enrollments')
        .select(`
          students (
            id,
            nis,
            full_name,
            gender,
            phone,
            status,
            photo_url
          )
        `)
        .eq('class_id', classData.id)
        .eq('status', 'active');
      
      if (error) throw error;
      return data?.map(enrollment => enrollment.students).filter(Boolean) || [];
    },
    enabled: !!classData?.id,
  });

  // Get class attendance statistics
  const { data: attendanceStats, isLoading: loadingAttendance } = useQuery({
    queryKey: ['class-attendance-stats', classData?.id],
    queryFn: async () => {
      if (!classData?.id) return null;

      // Get last 30 days attendance
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('unified_attendances')
        .select('status, attendance_date, student_id')
        .eq('class_id', classData.id)
        .gte('attendance_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('attendance_date', { ascending: false });
      
      if (error) throw error;
      
      const stats = {
        present: data?.filter(a => a.status === 'present').length || 0,
        absent: data?.filter(a => a.status === 'absent').length || 0,
        late: data?.filter(a => a.status === 'late').length || 0,
        permission: data?.filter(a => a.status === 'permission').length || 0,
        total: data?.length || 0
      };
      
      // Daily trend for last 7 days
      const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        const dayData = data?.filter(a => a.attendance_date === dateStr);
        
        return {
          date: format(date, 'dd/MM'),
          day: format(date, 'EEE', { locale: id }),
          present: dayData?.filter(a => a.status === 'present').length || 0,
          absent: dayData?.filter(a => a.status === 'absent').length || 0,
          late: dayData?.filter(a => a.status === 'late').length || 0,
          total: dayData?.length || 0
        };
      });
      
      return { ...stats, weeklyData };
    },
    enabled: !!classData?.id,
  });

  // Get class discipline data
  const { data: disciplineData, isLoading: loadingDiscipline } = useQuery({
    queryKey: ['class-discipline', classData?.id],
    queryFn: async () => {
      if (!classData?.id || !students?.length) return null;

      const studentIds = students.map((s: any) => s.id);

      const [violationsRes, achievementsRes] = await Promise.all([
        supabase
          .from('student_violations')
          .select(`
            *,
            violation_types (name, category, point_deduction),
            students (full_name, nis)
          `)
          .in('student_id', studentIds)
          .eq('status', 'active')
          .order('violation_date', { ascending: false })
          .limit(20),
        
        supabase
          .from('student_achievements')
          .select(`
            *,
            achievement_types (name, category, level, point_reward),
            students (full_name, nis)
          `)
          .in('student_id', studentIds)
          .eq('status', 'verified')
          .order('achievement_date', { ascending: false })
          .limit(20)
      ]);

      if (violationsRes.error) throw violationsRes.error;
      if (achievementsRes.error) throw achievementsRes.error;

      // Calculate class averages
      const totalViolationPoints = violationsRes.data?.reduce((sum, v) => sum + (v.point_deduction || 0), 0) || 0;
      const totalAchievementPoints = achievementsRes.data?.reduce((sum, a) => sum + (a.achievement_types?.point_reward || 0), 0) || 0;
      const averageDisciplineScore = students?.length 
        ? Math.max(0, 100 - (totalViolationPoints / students.length) + (totalAchievementPoints / students.length))
        : 100;

      // Violation categories
      const violationsByCategory = violationsRes.data?.reduce((acc: any, v) => {
        const category = v.violation_types?.category || 'lainnya';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        violations: violationsRes.data || [],
        achievements: achievementsRes.data || [],
        totalViolationPoints,
        totalAchievementPoints,
        averageDisciplineScore,
        violationsByCategory
      };
    },
    enabled: !!classData?.id && !!students?.length,
  });

  // Get pending permits
  const { data: pendingPermits, isLoading: loadingPermits } = useQuery({
    queryKey: ['pending-permits', classData?.id],
    queryFn: async () => {
      if (!classData?.id || !students?.length) return [];

      const studentIds = students.map((s: any) => s.id);

      const { data, error } = await supabase
        .from('student_permits')
        .select(`
          *,
          students (full_name, nis)
        `)
        .in('student_id', studentIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!classData?.id && !!students?.length,
  });

  if (loadingClass) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const attendancePercentage = attendanceStats?.total 
    ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
    : 0;

  const violationChartData = Object.entries(disciplineData?.violationsByCategory || {}).map(([category, count]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    count,
    fill: COLORS[Math.floor(Math.random() * COLORS.length)]
  }));

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Class Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Kelas Perwalian: {classData?.name}
            </h1>
            <p className="text-blue-100">
              {classData?.majors?.name} ({classData?.majors?.code}) - {classData?.academic_years?.name}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Badge className="bg-white/20 text-white border-white/20">
              {students?.length || 0} Siswa
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Siswa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {students?.length || 0}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Siswa aktif
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Rata-rata Kehadiran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {attendancePercentage}%
            </div>
            <p className="text-xs text-green-600 mt-1">
              30 hari terakhir
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
              {Math.round(disciplineData?.averageDisciplineScore || 100)}
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Rata-rata kelas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Izin Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {pendingPermits?.length || 0}
            </div>
            <p className="text-xs text-red-600 mt-1">
              Perlu persetujuan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
          <TabsTrigger value="discipline">Disiplin</TabsTrigger>
          <TabsTrigger value="students">Siswa</TabsTrigger>
          <TabsTrigger value="permits">Perizinan</TabsTrigger>
        </TabsList>

        {/* Attendance Analysis */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tren Kehadiran Harian
                </CardTitle>
                <CardDescription>7 hari terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceStats?.weeklyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
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
                <CardTitle>Distribusi Kehadiran</CardTitle>
                <CardDescription>30 hari terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Hadir</span>
                    <span className="text-sm text-green-600">
                      {attendanceStats?.present || 0}
                    </span>
                  </div>
                  <Progress value={attendancePercentage} className="h-2" />
                  
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-xl font-bold text-yellow-600">
                        {attendanceStats?.late || 0}
                      </div>
                      <div className="text-xs text-yellow-600">Terlambat</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-xl font-bold text-red-600">
                        {attendanceStats?.absent || 0}
                      </div>
                      <div className="text-xs text-red-600">Tidak Hadir</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">
                        {attendanceStats?.permission || 0}
                      </div>
                      <div className="text-xs text-blue-600">Izin</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Discipline Analysis */}
        <TabsContent value="discipline" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Kategori Pelanggaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={violationChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, count }) => `${category}: ${count}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {violationChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Prestasi Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {disciplineData?.achievements?.slice(0, 10).map((achievement: any) => (
                    <div key={achievement.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <Award className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {achievement.students?.full_name} ({achievement.students?.nis})
                        </div>
                        <div className="text-xs text-gray-600">
                          {achievement.achievement_types?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(achievement.achievement_date), 'dd MMM yyyy', { locale: id })}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        +{achievement.achievement_types?.point_reward}
                      </Badge>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Belum ada prestasi tercatat</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Students List */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Daftar Siswa Kelas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students?.map((student: any) => (
                  <Card key={student.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {student.photo_url ? (
                            <img 
                              src={student.photo_url} 
                              alt={student.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {student.full_name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{student.full_name}</div>
                          <div className="text-xs text-gray-600">NIS: {student.nis}</div>
                          <Badge 
                            variant={student.status === 'active' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {student.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Belum ada siswa terdaftar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permits Management */}
        <TabsContent value="permits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Perizinan Menunggu Persetujuan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPermits?.map((permit: any) => (
                  <div key={permit.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium">
                          {permit.students?.full_name} ({permit.students?.nis})
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {permit.permit_type}: {permit.reason}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(permit.start_date), 'dd MMM yyyy', { locale: id })} - 
                          {format(new Date(permit.end_date), 'dd MMM yyyy', { locale: id })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Lihat Detail
                        </Button>
                        <Button size="sm">
                          Setujui
                        </Button>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Tidak ada perizinan yang menunggu persetujuan</p>
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
