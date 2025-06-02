
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Calendar, Award, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const ParentDashboard = () => {
  const { user } = useAuth();

  // Get student data for this parent
  const { data: studentAccess } = useQuery({
    queryKey: ['parent-student-access', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parent_access')
        .select(`
          *,
          student:students!parent_access_student_id_fkey(
            id,
            full_name,
            nis,
            current_class:student_enrollments!inner(
              class:classes!inner(name, grade)
            )
          )
        `)
        .eq('parent_user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      
      return data?.map(access => ({
        ...access,
        student: {
          ...access.student,
          current_class: access.student.current_class?.[0]?.class
        }
      }));
    },
    enabled: !!user?.id,
  });

  const studentId = studentAccess?.[0]?.student_id;

  // Get recent attendance
  const { data: recentAttendance } = useQuery({
    queryKey: ['parent-student-attendance', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from('student_attendances')
        .select('*')
        .eq('student_id', studentId)
        .order('attendance_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  // Get recent achievements
  const { data: recentAchievements } = useQuery({
    queryKey: ['parent-student-achievements', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from('student_achievements')
        .select(`
          *,
          achievement_type:achievement_types!student_achievements_achievement_type_id_fkey(name, category, level)
        `)
        .eq('student_id', studentId)
        .eq('status', 'verified')
        .order('achievement_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  // Get recent violations
  const { data: recentViolations } = useQuery({
    queryKey: ['parent-student-violations', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from('student_violations')
        .select(`
          *,
          violation_type:violation_types!student_violations_violation_type_id_fkey(name, category, point_deduction)
        `)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .order('violation_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  // Get active permits
  const { data: activePermits } = useQuery({
    queryKey: ['parent-student-permits', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from('student_permits')
        .select('*')
        .eq('student_id', studentId)
        .in('status', ['pending', 'approved'])
        .order('submitted_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  // Get discipline points
  const { data: disciplinePoints } = useQuery({
    queryKey: ['parent-student-discipline', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const { data, error } = await supabase
        .from('student_discipline_points')
        .select('*')
        .eq('student_id', studentId)
        .order('last_updated', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0];
    },
    enabled: !!studentId,
  });

  const student = studentAccess?.[0]?.student;

  if (!student) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Tidak ada akses ke data siswa</p>
        </CardContent>
      </Card>
    );
  }

  const getAttendanceStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: 'Hadir', variant: 'outline' as const, icon: CheckCircle },
      absent: { label: 'Tidak Hadir', variant: 'destructive' as const, icon: AlertTriangle },
      late: { label: 'Terlambat', variant: 'secondary' as const, icon: Clock },
      excused: { label: 'Izin', variant: 'default' as const, icon: CheckCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.present;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPermitStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const },
      approved: { label: 'Disetujui', variant: 'outline' as const },
      rejected: { label: 'Ditolak', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDisciplineStatusBadge = (status: string) => {
    const statusConfig = {
      excellent: { label: 'Sangat Baik', variant: 'outline' as const },
      good: { label: 'Baik', variant: 'default' as const },
      warning: { label: 'Peringatan', variant: 'secondary' as const },
      probation: { label: 'Masa Percobaan', variant: 'destructive' as const },
      critical: { label: 'Kritis', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.good;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Portal Orang Tua</h1>
          <p className="text-muted-foreground">
            Monitoring perkembangan {student.full_name}
          </p>
        </div>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nama Lengkap</p>
              <p className="font-medium">{student.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">NIS</p>
              <p className="font-medium">{student.nis}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kelas</p>
              <p className="font-medium">
                {student.current_class?.name || 'Belum Ada Kelas'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discipline Points Summary */}
      {disciplinePoints && (
        <Card>
          <CardHeader>
            <CardTitle>Status Disiplin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">+{disciplinePoints.total_achievement_points}</p>
                <p className="text-sm text-muted-foreground">Poin Prestasi</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">-{disciplinePoints.total_violation_points}</p>
                <p className="text-sm text-muted-foreground">Poin Pelanggaran</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{disciplinePoints.final_score}</p>
                <p className="text-sm text-muted-foreground">Skor Akhir</p>
              </div>
              <div className="text-center">
                {getDisciplineStatusBadge(disciplinePoints.discipline_status)}
                <p className="text-sm text-muted-foreground mt-1">Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">Presensi</TabsTrigger>
          <TabsTrigger value="achievements">Prestasi</TabsTrigger>
          <TabsTrigger value="violations">Pelanggaran</TabsTrigger>
          <TabsTrigger value="permits">Perizinan</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Presensi Terbaru
              </CardTitle>
              <CardDescription>10 catatan presensi terbaru</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAttendance?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Belum ada data presensi</p>
              ) : (
                <div className="space-y-3">
                  {recentAttendance?.map((attendance) => (
                    <div key={attendance.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">
                          {format(new Date(attendance.attendance_date), 'dd MMMM yyyy', { locale: id })}
                        </p>
                        {attendance.notes && (
                          <p className="text-sm text-muted-foreground">{attendance.notes}</p>
                        )}
                      </div>
                      <div>
                        {getAttendanceStatusBadge(attendance.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Prestasi Terbaru
              </CardTitle>
              <CardDescription>5 prestasi terbaru yang telah diverifikasi</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAchievements?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Belum ada prestasi tercatat</p>
              ) : (
                <div className="space-y-3">
                  {recentAchievements?.map((achievement) => (
                    <div key={achievement.id} className="flex justify-between items-start p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{achievement.achievement_type?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {achievement.achievement_type?.category} • {achievement.achievement_type?.level}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(achievement.achievement_date), 'dd MMMM yyyy', { locale: id })}
                        </p>
                        {achievement.description && (
                          <p className="text-sm mt-1">{achievement.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-green-600">
                          +{achievement.point_reward}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Pelanggaran Terbaru
              </CardTitle>
              <CardDescription>5 pelanggaran terbaru yang masih aktif</CardDescription>
            </CardHeader>
            <CardContent>
              {recentViolations?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Tidak ada pelanggaran tercatat</p>
              ) : (
                <div className="space-y-3">
                  {recentViolations?.map((violation) => (
                    <div key={violation.id} className="flex justify-between items-start p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{violation.violation_type?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {violation.violation_type?.category}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(violation.violation_date), 'dd MMMM yyyy', { locale: id })}
                        </p>
                        {violation.description && (
                          <p className="text-sm mt-1">{violation.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          -{violation.point_deduction}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perizinan Aktif</CardTitle>
              <CardDescription>Daftar perizinan yang sedang berlangsung atau menunggu persetujuan</CardDescription>
            </CardHeader>
            <CardContent>
              {activePermits?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Tidak ada perizinan aktif</p>
              ) : (
                <div className="space-y-3">
                  {activePermits?.map((permit) => (
                    <div key={permit.id} className="flex justify-between items-start p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">
                          {permit.permit_type === 'sick_leave' ? 'Sakit' : 
                           permit.permit_type === 'family_leave' ? 'Keperluan Keluarga' :
                           permit.permit_type === 'school_activity' ? 'Kegiatan Sekolah' : 'Lainnya'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(permit.start_date), 'dd MMM', { locale: id })} - {format(new Date(permit.end_date), 'dd MMM yyyy', { locale: id })}
                        </p>
                        <p className="text-sm mt-1">{permit.reason}</p>
                      </div>
                      <div className="text-right">
                        {getPermitStatusBadge(permit.status)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(permit.submitted_at), 'dd MMM', { locale: id })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
