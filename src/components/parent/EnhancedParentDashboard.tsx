
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ParentNotificationCenter } from './ParentNotificationCenter';
import { 
  User, Award, AlertTriangle, Calendar, TrendingUp, Clock, 
  Phone, Users, Activity
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

export const EnhancedParentDashboard = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [academicSummary, setAcademicSummary] = useState<AcademicSummary | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [discipline, setDiscipline] = useState<DisciplineData | null>(null);
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
        fetchDisciplineData()
      ]);
    } catch (error) {
      console.error('Error fetching parent dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async () => {
    try {
      // Get parent access to student using raw query to avoid type issues
      const { data: parentAccess, error: accessError } = await supabase
        .rpc('debug_user_schedule_permissions')
        .single();

      if (accessError) {
        console.error('Error getting parent access:', accessError);
        return;
      }

      // For now, let's use a simpler approach with mock data until types are updated
      // This simulates the parent having access to a student
      const mockStudentData: StudentData = {
        id: 'mock-student-id',
        full_name: 'Student Name',
        nis: '2024001',
        class: {
          name: 'XII RPL 1',
          grade: 12,
          homeroom_teacher: {
            full_name: 'Pak Guru',
            phone: '08123456789'
          }
        },
        extracurriculars: [
          {
            name: 'Programming Club',
            coach_name: 'Bu Coach'
          }
        ]
      };

      setStudentData(mockStudentData);
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
        current_semester: currentSemester?.name || 'Semester Ganjil',
        academic_year: currentYear?.name || '2024/2025'
      });
    } catch (error) {
      console.error('Error fetching academic summary:', error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      // Mock attendance data for now
      const mockAttendance: AttendanceSummary = {
        total_days: 20,
        present_days: 18,
        absent_days: 1,
        late_days: 1,
        sick_days: 0,
        permission_days: 0,
        percentage: 90,
        monthly_trend: []
      };

      setAttendance(mockAttendance);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const fetchDisciplineData = async () => {
    try {
      // Mock discipline data for now
      const mockDiscipline: DisciplineData = {
        current_points: 95,
        total_violations: 1,
        total_achievements: 2,
        status: 'good',
        recent_violations: [
          {
            id: 'v1',
            violation_type: 'Terlambat',
            date: '2024-07-01',
            points: 5
          }
        ],
        recent_achievements: [
          {
            id: 'a1',
            achievement_type: 'Juara Lomba Programming',
            date: '2024-06-15',
            points: 10,
            level: 'Sekolah'
          }
        ]
      };

      setDiscipline(mockDiscipline);
    } catch (error) {
      console.error('Error fetching discipline data:', error);
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
