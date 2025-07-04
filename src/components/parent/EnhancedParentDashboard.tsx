import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  User, Award, AlertTriangle, Calendar, FileText, MessageCircle, 
  TrendingUp, BookOpen, Clock, MapPin, Phone, Mail, Bell,
  CheckCircle, XCircle, Users, Target, Star
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { ParentHeader } from './ParentHeader';
import { ParentQuickStats } from './ParentQuickStats';
import { ParentOverviewTab } from './ParentOverviewTab';

interface StudentData {
  id: string;
  full_name: string;
  nis: string;
  user_id?: string;
  class?: {
    name: string;
    grade: number;
  };
}

interface AttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  percentage: number;
  weekly_trend: Array<{
    date: string;
    status: string;
  }>;
}

interface DisciplineData {
  final_score: number;
  total_violations: number;
  total_achievements: number;
  status: string;
  recent_violations: Array<{
    id: string;
    violation_date: string;
    violation_type: string;
    point_deduction: number;
  }>;
  recent_achievements: Array<{
    id: string;
    achievement_date: string;
    achievement_type: string;
    point_reward: number;
  }>;
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export const EnhancedParentDashboard = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [disciplineData, setDisciplineData] = useState<DisciplineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Fetch student data
      const { data: parentAccess } = await supabase
        .from('parent_access')
        .select(`
          student:students(
            id, full_name, nis, user_id,
            student_enrollments(
              class:classes(name, grade)
            )
          )
        `)
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!parentAccess?.student) {
        setLoading(false);
        return;
      }

      const student = parentAccess.student as any;
      setStudentData({
        ...student,
        class: student.student_enrollments?.[0]?.class || null
      });

      // Fetch comprehensive attendance stats
      await fetchAttendanceStats(student.id);
      
      // Fetch discipline data
      await fetchDisciplineData(student.id);
      
      // Fetch notifications
      await fetchNotifications(student.user_id);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async (studentId: string) => {
    const now = new Date();
    const startMonth = startOfMonth(now);
    const endMonth = endOfMonth(now);
    
    // Get this month's attendance
    const { data: monthlyAttendance } = await supabase
      .from('student_self_attendances')
      .select('attendance_date, check_in_time, check_out_time, status')
      .eq('student_id', studentId)
      .gte('attendance_date', format(startMonth, 'yyyy-MM-dd'))
      .lte('attendance_date', format(endMonth, 'yyyy-MM-dd'))
      .order('attendance_date', { ascending: false });

    // Get weekly trend (last 7 days)
    const weekAgo = subDays(now, 7);
    const { data: weeklyData } = await supabase
      .from('student_self_attendances')
      .select('attendance_date, status')
      .eq('student_id', studentId)
      .gte('attendance_date', format(weekAgo, 'yyyy-MM-dd'))
      .order('attendance_date', { ascending: true });

    if (monthlyAttendance) {
      const totalDays = monthlyAttendance.length;
      const presentDays = monthlyAttendance.filter(a => a.status === 'present').length;
      const absentDays = monthlyAttendance.filter(a => a.status === 'absent').length;
      const lateDays = monthlyAttendance.filter(a => a.status === 'late').length;
      
      setAttendanceStats({
        total_days: totalDays,
        present_days: presentDays,
        absent_days: absentDays,
        late_days: lateDays,
        percentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
        weekly_trend: (weeklyData || []).map(item => ({
          date: item.attendance_date,
          status: item.status
        }))
      });
    }
  };

  const fetchDisciplineData = async (studentId: string) => {
    // Get current discipline points
    const { data: disciplinePoints } = await supabase
      .from('student_discipline_points')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get recent violations
    const { data: violations } = await supabase
      .from('student_violations')
      .select(`
        id, violation_date, point_deduction,
        violation_types(name)
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('violation_date', { ascending: false })
      .limit(5);

    // Get recent achievements
    const { data: achievements } = await supabase
      .from('student_achievements')
      .select(`
        id, achievement_date, point_reward,
        achievement_types(name)
      `)
      .eq('student_id', studentId)
      .eq('status', 'verified')
      .order('achievement_date', { ascending: false })
      .limit(5);

    if (disciplinePoints) {
      setDisciplineData({
        final_score: disciplinePoints.final_score,
        total_violations: disciplinePoints.total_violation_points,
        total_achievements: disciplinePoints.total_achievement_points,
        status: disciplinePoints.discipline_status,
        recent_violations: (violations || []).map((v: any) => ({
          id: v.id,
          violation_date: v.violation_date,
          violation_type: v.violation_types?.name || '',
          point_deduction: v.point_deduction
        })),
        recent_achievements: (achievements || []).map((a: any) => ({
          id: a.id,
          achievement_date: a.achievement_date,
          achievement_type: a.achievement_types?.name || '',
          point_reward: a.point_reward
        }))
      });
    }
  };

  const fetchNotifications = async (studentUserId?: string) => {
    if (!studentUserId) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', studentUserId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    setNotifications(data || []);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Tidak ada data siswa yang terkait dengan akun Anda. Silakan hubungi administrator sekolah.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Student Info */}
      <ParentHeader studentData={studentData} />

      {/* Quick Stats */}
      <ParentQuickStats 
        attendanceStats={attendanceStats}
        disciplineData={disciplineData}
        notifications={notifications}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
          <TabsTrigger value="discipline">Disiplin</TabsTrigger>
          <TabsTrigger value="communication">Komunikasi</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ParentOverviewTab 
            attendanceStats={attendanceStats}
            disciplineData={disciplineData}
          />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detail Kehadiran Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{attendanceStats?.present_days || 0}</div>
                  <div className="text-sm text-muted-foreground">Hari Hadir</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded">
                  <div className="text-2xl font-bold text-yellow-600">{attendanceStats?.late_days || 0}</div>
                  <div className="text-sm text-muted-foreground">Hari Terlambat</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">{attendanceStats?.absent_days || 0}</div>
                  <div className="text-sm text-muted-foreground">Hari Tidak Hadir</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{attendanceStats?.percentage || 0}%</div>
                  <div className="text-sm text-muted-foreground">Persentase</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Tren Kehadiran 7 Hari Terakhir</h4>
                <div className="space-y-2">
                  {attendanceStats?.weekly_trend.map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                      <span className="text-sm">{format(new Date(day.date), 'EEEE, dd MMM', { locale: id })}</span>
                      <Badge 
                        variant={day.status === 'present' ? 'default' : day.status === 'late' ? 'secondary' : 'destructive'}
                      >
                        {day.status === 'present' ? 'Hadir' : day.status === 'late' ? 'Terlambat' : 'Tidak Hadir'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discipline" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Prestasi</CardTitle>
              </CardHeader>
              <CardContent>
                {disciplineData?.recent_achievements.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada prestasi yang dicatat</p>
                ) : (
                  <div className="space-y-4">
                    {disciplineData?.recent_achievements.map((achievement) => (
                      <div key={achievement.id} className="flex justify-between items-start p-4 border rounded">
                        <div>
                          <div className="font-medium">{achievement.achievement_type}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(achievement.achievement_date), 'dd MMMM yyyy', { locale: id })}
                          </div>
                        </div>
                        <Badge variant="default">+{achievement.point_reward} poin</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Riwayat Pelanggaran</CardTitle>
              </CardHeader>
              <CardContent>
                {disciplineData?.recent_violations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Tidak ada catatan pelanggaran</p>
                ) : (
                  <div className="space-y-4">
                    {disciplineData?.recent_violations.map((violation) => (
                      <div key={violation.id} className="flex justify-between items-start p-4 border rounded">
                        <div>
                          <div className="font-medium">{violation.violation_type}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(violation.violation_date), 'dd MMMM yyyy', { locale: id })}
                          </div>
                        </div>
                        <Badge variant="destructive">-{violation.point_deduction} poin</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hubungi Wali Kelas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="font-medium">Pak/Bu Wali Kelas</div>
                    <div className="text-sm text-muted-foreground">
                      Kelas {studentData.class?.grade} {studentData.class?.name}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telepon
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Pesan
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifikasi Terbaru</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Tidak ada notifikasi baru</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="p-3 border rounded">
                        <div className="font-medium text-sm">{notification.title}</div>
                        <div className="text-sm text-muted-foreground">{notification.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(notification.created_at), 'dd MMM, HH:mm', { locale: id })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Bulanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <FileText className="w-6 h-6" />
                  <span className="text-sm">Laporan Kehadiran</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Target className="w-6 h-6" />
                  <span className="text-sm">Laporan Disiplin</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Award className="w-6 h-6" />
                  <span className="text-sm">Laporan Prestasi</span>
                </Button>
              </div>
              
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Laporan bulanan akan dikirimkan secara otomatis setiap awal bulan ke email yang terdaftar.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
