
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Award, AlertTriangle, Calendar, FileText, MessageCircle, TrendingUp, BookOpen } from 'lucide-react';

interface StudentData {
  id: string;
  full_name: string;
  nis: string;
  class?: {
    name: string;
    grade: number;
  };
}

interface ViolationData {
  id: string;
  violation_date: string;
  point_deduction: number;
  violation_types: {
    name: string;
    category: string;
  };
}

interface AchievementData {
  id: string;
  achievement_date: string;
  point_reward: number;
  achievement_types: {
    name: string;
    level: string;
  };
}

interface PermitData {
  id: string;
  permit_type: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface AttendanceData {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  percentage: number;
}

export const ParentDashboard = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [violations, setViolations] = useState<ViolationData[]>([]);
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [permits, setPermits] = useState<PermitData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [disciplinePoints, setDisciplinePoints] = useState<number>(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    if (!user?.id) return;

    try {
      // Cari siswa berdasarkan parent access
      const { data: parentAccess, error: parentError } = await supabase
        .from('parent_access')
        .select(`
          student:students(
            id, full_name, nis,
            student_enrollments(
              class:classes(name, grade)
            )
          )
        `)
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .single();

      if (parentError) throw parentError;

      const student = parentAccess.student;
      setStudentData({
        ...student,
        class: student.student_enrollments?.[0]?.class || null
      });

      // Fetch violations
      const { data: violationsData } = await supabase
        .from('student_violations')
        .select(`
          *,
          violation_types(name, category)
        `)
        .eq('student_id', student.id)
        .order('violation_date', { ascending: false })
        .limit(10);

      setViolations(violationsData || []);

      // Fetch achievements
      const { data: achievementsData } = await supabase
        .from('student_achievements')
        .select(`
          *,
          achievement_types(name, level)
        `)
        .eq('student_id', student.id)
        .eq('status', 'verified')
        .order('achievement_date', { ascending: false })
        .limit(10);

      setAchievements(achievementsData || []);

      // Fetch permits
      const { data: permitsData } = await supabase
        .from('student_permits')
        .select('*')
        .eq('student_id', student.id)
        .order('submitted_at', { ascending: false })
        .limit(10);

      setPermits(permitsData || []);

      // Fetch attendance summary
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: attendanceData } = await supabase
        .from('student_attendances')
        .select('status')
        .eq('student_id', student.id)
        .gte('attendance_date', `${currentMonth}-01`)
        .lt('attendance_date', `${currentMonth}-32`);

      if (attendanceData) {
        const totalDays = attendanceData.length;
        const presentDays = attendanceData.filter(a => a.status === 'present').length;
        const absentDays = attendanceData.filter(a => a.status === 'absent').length;
        const lateDays = attendanceData.filter(a => a.status === 'late').length;
        
        setAttendance({
          total_days: totalDays,
          present_days: presentDays,
          absent_days: absentDays,
          late_days: lateDays,
          percentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
        });
      }

      // Fetch discipline points
      const { data: disciplineData } = await supabase
        .from('student_discipline_points')
        .select('final_score')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (disciplineData) {
        setDisciplinePoints(disciplineData.final_score);
      }

    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">Disetujui</Badge>;
      case 'pending':
        return <Badge variant="secondary">Menunggu</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPermitTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      sick_leave: 'Izin Sakit',
      family_leave: 'Izin Keluarga',
      school_activity: 'Kegiatan Sekolah',
      other: 'Lainnya'
    };
    return types[type] || type;
  };

  const getDisciplineStatus = (score: number) => {
    if (score >= 90) return { label: 'Sangat Baik', color: 'text-green-600' };
    if (score >= 75) return { label: 'Baik', color: 'text-blue-600' };
    if (score >= 60) return { label: 'Cukup', color: 'text-yellow-600' };
    return { label: 'Perlu Perhatian', color: 'text-red-600' };
  };

  if (loading) {
    return <div>Memuat data siswa...</div>;
  }

  if (!studentData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Tidak ada data siswa yang terkait dengan akun Anda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const disciplineStatus = getDisciplineStatus(disciplinePoints);

  return (
    <div className="space-y-6">
      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informasi Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Nama Lengkap</div>
              <div className="font-semibold">{studentData.full_name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">NIS</div>
              <div className="font-semibold">{studentData.nis}</div>
            </div>
            {studentData.class && (
              <div>
                <div className="text-sm text-muted-foreground">Kelas</div>
                <div className="font-semibold">{studentData.class.grade} {studentData.class.name}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Kehadiran</div>
                <div className="text-xl font-bold">{attendance?.percentage || 0}%</div>
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
                <div className={`text-xl font-bold ${disciplineStatus.color}`}>{disciplinePoints}</div>
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
                <div className="text-sm text-muted-foreground">Prestasi</div>
                <div className="text-xl font-bold">{achievements.length}</div>
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
                <div className="text-sm text-muted-foreground">Pelanggaran</div>
                <div className="text-xl font-bold">{violations.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
          <TabsTrigger value="achievements">Prestasi</TabsTrigger>
          <TabsTrigger value="violations">Pelanggaran</TabsTrigger>
          <TabsTrigger value="permits">Izin</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Prestasi Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achievements.slice(0, 3).length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Belum ada prestasi
                  </p>
                ) : (
                  <div className="space-y-3">
                    {achievements.slice(0, 3).map((achievement) => (
                      <div key={achievement.id} className="border-l-4 border-green-500 pl-3">
                        <div className="font-medium">{achievement.achievement_types.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {achievement.achievement_types.level} • +{achievement.point_reward} poin
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(achievement.achievement_date).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Violations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Pelanggaran Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                {violations.slice(0, 3).length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Tidak ada pelanggaran
                  </p>
                ) : (
                  <div className="space-y-3">
                    {violations.slice(0, 3).map((violation) => (
                      <div key={violation.id} className="border-l-4 border-red-500 pl-3">
                        <div className="font-medium">{violation.violation_types.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {violation.violation_types.category} • -{violation.point_deduction} poin
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(violation.violation_date).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Kehadiran Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent>
              {attendance ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{attendance.present_days}</div>
                      <div className="text-sm text-muted-foreground">Hadir</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded">
                      <div className="text-2xl font-bold text-red-600">{attendance.absent_days}</div>
                      <div className="text-sm text-muted-foreground">Tidak Hadir</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded">
                      <div className="text-2xl font-bold text-yellow-600">{attendance.late_days}</div>
                      <div className="text-sm text-muted-foreground">Terlambat</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{attendance.percentage}%</div>
                      <div className="text-sm text-muted-foreground">Persentase</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">Tidak ada data kehadiran</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Prestasi</CardTitle>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada prestasi yang dicatat
                </p>
              ) : (
                <div className="space-y-4">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="flex justify-between items-center p-4 border rounded">
                      <div>
                        <div className="font-medium">{achievement.achievement_types.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Level: {achievement.achievement_types.level}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(achievement.achievement_date).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      <Badge variant="default">+{achievement.point_reward} poin</Badge>
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
              <CardTitle>Riwayat Pelanggaran</CardTitle>
            </CardHeader>
            <CardContent>
              {violations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Tidak ada catatan pelanggaran
                </p>
              ) : (
                <div className="space-y-4">
                  {violations.map((violation) => (
                    <div key={violation.id} className="flex justify-between items-center p-4 border rounded">
                      <div>
                        <div className="font-medium">{violation.violation_types.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Kategori: {violation.violation_types.category}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(violation.violation_date).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      <Badge variant="destructive">-{violation.point_deduction} poin</Badge>
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
              <CardTitle>Riwayat Perizinan</CardTitle>
            </CardHeader>
            <CardContent>
              {permits.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada pengajuan izin
                </p>
              ) : (
                <div className="space-y-4">
                  {permits.map((permit) => (
                    <div key={permit.id} className="flex justify-between items-center p-4 border rounded">
                      <div>
                        <div className="font-medium">{getPermitTypeLabel(permit.permit_type)}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(permit.start_date).toLocaleDateString('id-ID')} - {new Date(permit.end_date).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      {getStatusBadge(permit.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <FileText className="w-6 h-6" />
              <span className="text-sm">Ajukan Izin</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Award className="w-6 h-6" />
              <span className="text-sm">Input Prestasi</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm">Hubungi Wali Kelas</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <BookOpen className="w-6 h-6" />
              <span className="text-sm">Lihat Jurnal</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
