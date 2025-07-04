
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, FileText, Target, Award, Phone, MessageCircle, Users
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { ParentHeader } from './ParentHeader';
import { ParentQuickStats } from './ParentQuickStats';
import { ParentOverviewTab } from './ParentOverviewTab';

// Simple, clean interfaces to avoid deep type instantiation
interface Student {
  id: string;
  full_name: string;
  nis: string;
  user_id?: string;
  class?: {
    name: string;
    grade: number;
  } | null;
}

interface AttendanceData {
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

interface DisciplineInfo {
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

interface NotificationInfo {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export const EnhancedParentDashboard = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceData | null>(null);
  const [disciplineData, setDisciplineData] = useState<DisciplineInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationInfo[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Fetch student data with explicit type handling
      const { data: parentAccess, error: parentError } = await supabase
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

      if (parentError) {
        console.error('Parent access error:', parentError);
        setLoading(false);
        return;
      }

      if (!parentAccess?.student) {
        setLoading(false);
        return;
      }

      // Type-safe data processing
      const rawStudent = parentAccess.student as any;
      const processedStudent: Student = {
        id: rawStudent.id,
        full_name: rawStudent.full_name,
        nis: rawStudent.nis,
        user_id: rawStudent.user_id,
        class: rawStudent.student_enrollments?.[0]?.class || null
      };
      
      setStudentData(processedStudent);

      // Fetch other data
      await Promise.all([
        fetchAttendanceStats(processedStudent.id),
        fetchDisciplineData(processedStudent.id),
        fetchNotifications(processedStudent.user_id)
      ]);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async (studentId: string) => {
    try {
      const now = new Date();
      const startMonth = startOfMonth(now);
      const endMonth = endOfMonth(now);
      
      const { data: monthlyAttendance, error: monthlyError } = await supabase
        .from('student_self_attendances')
        .select('attendance_date, check_in_time, check_out_time, status')
        .eq('student_id', studentId)
        .gte('attendance_date', format(startMonth, 'yyyy-MM-dd'))
        .lte('attendance_date', format(endMonth, 'yyyy-MM-dd'))
        .order('attendance_date', { ascending: false });

      if (monthlyError) {
        console.error('Monthly attendance error:', monthlyError);
        return;
      }

      const weekAgo = subDays(now, 7);
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('student_self_attendances')
        .select('attendance_date, status')
        .eq('student_id', studentId)
        .gte('attendance_date', format(weekAgo, 'yyyy-MM-dd'))
        .order('attendance_date', { ascending: true });

      if (weeklyError) {
        console.error('Weekly attendance error:', weeklyError);
        return;
      }

      if (monthlyAttendance) {
        const totalDays = monthlyAttendance.length;
        const presentDays = monthlyAttendance.filter(a => a.status === 'present').length;
        const absentDays = monthlyAttendance.filter(a => a.status === 'absent').length;
        const lateDays = monthlyAttendance.filter(a => a.status === 'late').length;
        
        const attendanceData: AttendanceData = {
          total_days: totalDays,
          present_days: presentDays,
          absent_days: absentDays,
          late_days: lateDays,
          percentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
          weekly_trend: (weeklyData || []).map(item => ({
            date: item.attendance_date,
            status: item.status
          }))
        };
        
        setAttendanceStats(attendanceData);
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const fetchDisciplineData = async (studentId: string) => {
    try {
      const { data: disciplinePoints, error: disciplineError } = await supabase
        .from('student_discipline_points')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (disciplineError) {
        console.error('Discipline points error:', disciplineError);
        return;
      }

      const { data: violations, error: violationsError } = await supabase
        .from('student_violations')
        .select(`
          id, violation_date, point_deduction,
          violation_types(name)
        `)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .order('violation_date', { ascending: false })
        .limit(5);

      if (violationsError) {
        console.error('Violations error:', violationsError);
      }

      const { data: achievements, error: achievementsError } = await supabase
        .from('student_achievements')
        .select(`
          id, achievement_date, point_reward,
          achievement_types(name)
        `)
        .eq('student_id', studentId)
        .eq('status', 'verified')
        .order('achievement_date', { ascending: false })
        .limit(5);

      if (achievementsError) {
        console.error('Achievements error:', achievementsError);
      }

      const disciplineInfo: DisciplineInfo = {
        final_score: disciplinePoints?.final_score || 100,
        total_violations: disciplinePoints?.total_violation_points || 0,
        total_achievements: disciplinePoints?.total_achievement_points || 0,
        status: disciplinePoints?.discipline_status || 'good',
        recent_violations: (violations || []).map((v: any) => ({
          id: v.id,
          violation_date: v.violation_date,
          violation_type: v.violation_types?.name || 'Unknown',
          point_deduction: v.point_deduction
        })),
        recent_achievements: (achievements || []).map((a: any) => ({
          id: a.id,
          achievement_date: a.achievement_date,
          achievement_type: a.achievement_types?.name || 'Unknown',
          point_reward: a.point_reward
        }))
      };

      setDisciplineData(disciplineInfo);
    } catch (error) {
      console.error('Error fetching discipline data:', error);
    }
  };

  const fetchNotifications = async (studentUserId?: string) => {
    if (!studentUserId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', studentUserId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Notifications error:', error);
        return;
      }

      const processedNotifications: NotificationInfo[] = (data || []).map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        created_at: n.created_at || new Date().toISOString()
      }));

      setNotifications(processedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
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
      <ParentHeader studentData={studentData} />
      <ParentQuickStats 
        attendanceStats={attendanceStats}
        disciplineData={disciplineData}
        notifications={notifications}
      />

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
                  {attendanceStats?.weekly_trend.map((day, index) => (
                    <div key={`${day.date}-${index}`} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
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
                    {disciplineData?.recent_achievements.map((achievement, index) => (
                      <div key={`${achievement.id}-${index}`} className="flex justify-between items-start p-4 border rounded">
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
                    {disciplineData?.recent_violations.map((violation, index) => (
                      <div key={`${violation.id}-${index}`} className="flex justify-between items-start p-4 border rounded">
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
                      Kelas {studentData.class?.grade || ''} {studentData.class?.name || ''}
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
                    {notifications.slice(0, 5).map((notification, index) => (
                      <div key={`${notification.id}-${index}`} className="p-3 border rounded">
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
