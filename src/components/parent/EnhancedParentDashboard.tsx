import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ParentNotificationCenter } from './ParentNotificationCenter';
import { 
  User, Award, AlertTriangle, Calendar, FileText, MessageCircle, 
  TrendingUp, BookOpen, Clock, MapPin, Phone, Mail, Home,
  GraduationCap, Target, Star, Users, Activity
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

interface StudentData {
  id: string;
  full_name: string;
  nis: string;
  class?: {
    name: string;
    grade: number;
    homeroom_teacher?: {
      full_name: string;
      phone?: string;
    };
  };
  extracurriculars?: Array<{
    name: string;
    coach_name?: string;
  }>;
}

interface AcademicSummary {
  current_semester: string;
  academic_year: string;
  class_rank?: number;
  total_students?: number;
  gpa?: number;
}

interface AttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  sick_days: number;
  permission_days: number;
  percentage: number;
  monthly_trend: Array<{ month: string; percentage: number }>;
}

interface DisciplineData {
  current_points: number;
  total_violations: number;
  total_achievements: number;
  status: 'excellent' | 'good' | 'warning' | 'probation' | 'critical';
  recent_violations: Array<{
    id: string;
    violation_type: string;
    date: string;
    points: number;
  }>;
  recent_achievements: Array<{
    id: string;
    achievement_type: string;
    date: string;
    points: number;
    level: string;
  }>;
}

interface UpcomingEvents {
  exams: Array<{
    subject: string;
    date: string;
    type: string;
  }>;
  activities: Array<{
    name: string;
    date: string;
    location: string;
  }>;
  permits: Array<{
    type: string;
    start_date: string;
    end_date: string;
    status: string;
  }>;
}

export const EnhancedParentDashboard = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [academicSummary, setAcademicSummary] = useState<AcademicSummary | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [discipline, setDiscipline] = useState<DisciplineData | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvents | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    if (!user?.id) return;

    try {
      await Promise.all([
        fetchStudentData(),
        fetchAcademicSummary(),
        fetchAttendanceData(),
        fetchDisciplineData(),
        fetchUpcomingEvents()
      ]);
    } catch (error) {
      console.error('Error fetching parent dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async () => {
    try {
      // Get parent access to student
      const { data: parentAccess, error: accessError } = await supabase
        .from('parent_access')
        .select('student_id')
        .eq('parent_user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (accessError || !parentAccess) {
        console.error('No student access found for parent');
        return;
      }

      // Get student basic data
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, full_name, nis')
        .eq('id', parentAccess.student_id)
        .single();

      if (studentError || !student) {
        console.error('Student not found');
        return;
      }

      // Get class enrollment data
      const { data: enrollment } = await supabase
        .from('student_enrollments')
        .select('class_id')
        .eq('student_id', student.id)
        .eq('status', 'active')
        .single();

      let classData = null;
      if (enrollment) {
        // Get class and homeroom teacher info
        const { data: classInfo } = await supabase
          .from('classes')
          .select('name, grade, homeroom_teacher_id')
          .eq('id', enrollment.class_id)
          .single();

        if (classInfo) {
          // Get homeroom teacher profile
          const { data: teacher } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', classInfo.homeroom_teacher_id)
            .single();

          classData = {
            name: classInfo.name,
            grade: classInfo.grade,
            homeroom_teacher: teacher ? {
              full_name: teacher.full_name,
              phone: teacher.phone
            } : undefined
          };
        }
      }

      // Get extracurricular activities
      const { data: extracurriculars } = await supabase
        .from('student_extracurriculars')
        .select(`
          extracurricular:extracurriculars(
            name,
            coach:profiles(full_name)
          )
        `)
        .eq('student_id', student.id)
        .eq('status', 'active');

      const extracurricularList = extracurriculars?.map(e => ({
        name: (e.extracurricular as any)?.name || 'Unknown',
        coach_name: (e.extracurricular as any)?.coach?.full_name
      })) || [];

      setStudentData({
        ...student,
        class: classData || undefined,
        extracurriculars: extracurricularList
      });
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const fetchAcademicSummary = async () => {
    try {
      // Get current academic year and semester
      const { data: currentYear } = await supabase
        .from('academic_years')
        .select('name')
        .eq('is_active', true)
        .single();

      const { data: currentSemester } = await supabase
        .from('semesters')
        .select('name')
        .eq('is_active', true)
        .single();

      setAcademicSummary({
        current_semester: currentSemester?.name || 'Tidak diketahui',
        academic_year: currentYear?.name || 'Tidak diketahui'
      });
    } catch (error) {
      console.error('Error fetching academic summary:', error);
    }
  };

  const fetchAttendanceData = async () => {
    if (!studentData?.id) return;

    try {
      const currentMonth = new Date();
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const { data: attendanceData } = await supabase
        .from('student_attendances')
        .select('status, attendance_date')
        .eq('student_id', studentData.id)
        .gte('attendance_date', monthStart.toISOString().split('T')[0])
        .lte('attendance_date', monthEnd.toISOString().split('T')[0]);

      if (attendanceData) {
        const totalDays = attendanceData.length;
        const present = attendanceData.filter(a => a.status === 'present').length;
        const absent = attendanceData.filter(a => a.status === 'absent').length;
        const late = attendanceData.filter(a => a.status === 'late').length;
        const sick = attendanceData.filter(a => a.status === 'sick').length;
        const permission = attendanceData.filter(a => a.status === 'permission').length;

        setAttendance({
          total_days: totalDays,
          present_days: present,
          absent_days: absent,
          late_days: late,
          sick_days: sick,
          permission_days: permission,
          percentage: totalDays > 0 ? Math.round((present / totalDays) * 100) : 0,
          monthly_trend: [] // Could be implemented with historical data
        });
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const fetchDisciplineData = async () => {
    if (!studentData?.id) return;

    try {
      // Get current discipline points
      const { data: disciplinePoints } = await supabase
        .from('student_discipline_points')
        .select('final_score, discipline_status')
        .eq('student_id', studentData.id)
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
        .eq('student_id', studentData.id)
        .eq('status', 'active')
        .order('violation_date', { ascending: false })
        .limit(5);

      // Get recent achievements
      const { data: achievements } = await supabase
        .from('student_achievements')
        .select(`
          id, achievement_date, point_reward,
          achievement_types(name, level)
        `)
        .eq('student_id', studentData.id)
        .eq('status', 'verified')
        .order('achievement_date', { ascending: false })
        .limit(5);

      const disciplineStatus = disciplinePoints?.discipline_status as 'excellent' | 'good' | 'warning' | 'probation' | 'critical' || 'good';

      setDiscipline({
        current_points: disciplinePoints?.final_score || 100,
        total_violations: violations?.length || 0,
        total_achievements: achievements?.length || 0,
        status: disciplineStatus,
        recent_violations: violations?.map(v => ({
          id: v.id,
          violation_type: (v.violation_types as any)?.name || 'Unknown',
          date: v.violation_date,
          points: v.point_deduction
        })) || [],
        recent_achievements: achievements?.map(a => ({
          id: a.id,
          achievement_type: (a.achievement_types as any)?.name || 'Unknown',
          date: a.achievement_date,
          points: a.point_reward,
          level: (a.achievement_types as any)?.level || 'Unknown'
        })) || []
      });
    } catch (error) {
      console.error('Error fetching discipline data:', error);
    }
  };

  const fetchUpcomingEvents = async () => {
    if (!studentData?.id) return;

    try {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Get upcoming permits
      const { data: permits } = await supabase
        .from('student_permits')
        .select('permit_type, start_date, end_date, status')
        .eq('student_id', studentData.id)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .lte('start_date', nextWeek.toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      setUpcomingEvents({
        exams: [], // Could be implemented with exam schedule
        activities: [], // Could be implemented with school activities
        permits: permits?.map(p => ({
          type: p.permit_type,
          start_date: p.start_date,
          end_date: p.end_date,
          status: p.status
        })) || []
      });
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  };

  const getDisciplineStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'probation': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDisciplineStatusLabel = (status: string) => {
    const labels = {
      excellent: 'Sangat Baik',
      good: 'Baik',
      warning: 'Perlu Perhatian',
      probation: 'Masa Percobaan',
      critical: 'Kritis'
    };
    return labels[status as keyof typeof labels] || 'Tidak Diketahui';
  };

  if (loading) {
    return <div>Memuat dashboard orang tua...</div>;
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
      {/* Student Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profil Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Nama Lengkap</div>
              <div className="font-semibold">{studentData.full_name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">NIS</div>
              <div className="font-semibold">{studentData.nis}</div>
            </div>
            {studentData.class && (
              <>
                <div>
                  <div className="text-sm text-muted-foreground">Kelas</div>
                  <div className="font-semibold">
                    {studentData.class.grade} {studentData.class.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Wali Kelas</div>
                  <div className="font-semibold">
                    {studentData.class.homeroom_teacher?.full_name || 'Belum ditentukan'}
                  </div>
                  {studentData.class.homeroom_teacher?.phone && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {studentData.class.homeroom_teacher.phone}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {academicSummary && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Tahun Ajaran</div>
                  <div className="font-semibold">{academicSummary.academic_year}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Semester</div>
                  <div className="font-semibold">{academicSummary.current_semester}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Kehadiran Bulan Ini</div>
                <div className="text-2xl font-bold">{attendance?.percentage || 0}%</div>
                <div className="text-xs text-muted-foreground">
                  {attendance?.present_days || 0}/{attendance?.total_days || 0} hari
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Poin Disiplin</div>
                <div className="text-2xl font-bold">{discipline?.current_points || 100}</div>
                <div className={`text-xs px-2 py-1 rounded-full ${getDisciplineStatusColor(discipline?.status || 'good')}`}>
                  {getDisciplineStatusLabel(discipline?.status || 'good')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Prestasi</div>
                <div className="text-2xl font-bold">{discipline?.total_achievements || 0}</div>
                <div className="text-xs text-muted-foreground">Achievement terkonfirmasi</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pelanggaran Aktif</div>
                <div className="text-2xl font-bold">{discipline?.total_violations || 0}</div>
                <div className="text-xs text-muted-foreground">Perlu perhatian</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
          <TabsTrigger value="discipline">Disiplin</TabsTrigger>
          <TabsTrigger value="achievements">Prestasi</TabsTrigger>
          <TabsTrigger value="activities">Kegiatan</TabsTrigger>
          <TabsTrigger value="communication">Komunikasi</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Ringkasan Kehadiran
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendance && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Persentase Kehadiran</span>
                      <span className="font-bold">{attendance.percentage}%</span>
                    </div>
                    <Progress value={attendance.percentage} className="w-full" />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="font-bold text-green-600">{attendance.present_days}</div>
                        <div className="text-muted-foreground">Hadir</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded">
                        <div className="font-bold text-red-600">{attendance.absent_days}</div>
                        <div className="text-muted-foreground">Tidak Hadir</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded">
                        <div className="font-bold text-yellow-600">{attendance.late_days}</div>
                        <div className="text-muted-foreground">Terlambat</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="font-bold text-blue-600">{attendance.sick_days + attendance.permission_days}</div>
                        <div className="text-muted-foreground">Izin/Sakit</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Aktivitas Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {discipline?.recent_violations.slice(0, 3).map((violation) => (
                    <div key={violation.id} className="flex items-center gap-3 p-2 bg-red-50 rounded">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{violation.violation_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(violation.date), 'dd MMM yyyy', { locale: id })}
                        </div>
                      </div>
                      <Badge variant="destructive">-{violation.points}</Badge>
                    </div>
                  ))}
                  
                  {discipline?.recent_achievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-2 bg-green-50 rounded">
                      <Award className="w-4 h-4 text-green-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{achievement.achievement_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(achievement.date), 'dd MMM yyyy', { locale: id })} • {achievement.level}
                        </div>
                      </div>
                      <Badge variant="default">+{achievement.points}</Badge>
                    </div>
                  ))}
                  
                  {(!discipline?.recent_violations.length && !discipline?.recent_achievements.length) && (
                    <div className="text-center py-4 text-muted-foreground">
                      Belum ada aktivitas terbaru
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Extracurricular Activities */}
          {studentData.extracurriculars && studentData.extracurriculars.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Kegiatan Ekstrakurikuler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentData.extracurriculars.map((extracurricular, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="font-medium">{extracurricular.name}</div>
                      {extracurricular.coach_name && (
                        <div className="text-sm text-muted-foreground">
                          Pelatih: {extracurricular.coach_name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Other tabs content would go here - attendance, discipline, etc. */}
        <TabsContent value="notifications">
          <ParentNotificationCenter />
        </TabsContent>

        {/* Placeholder for other tabs */}
        {['attendance', 'discipline', 'achievements', 'activities', 'communication'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">
                  Konten {tab} akan dikembangkan lebih lanjut
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
