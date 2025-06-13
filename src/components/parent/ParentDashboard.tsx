
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Award, AlertTriangle, Calendar, FileText, MessageCircle } from 'lucide-react';

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

export const ParentDashboard = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [violations, setViolations] = useState<ViolationData[]>([]);
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [permits, setPermits] = useState<PermitData[]>([]);
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
        .limit(5);

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
        .limit(5);

      setAchievements(achievementsData || []);

      // Fetch permits
      const { data: permitsData } = await supabase
        .from('student_permits')
        .select('*')
        .eq('student_id', student.id)
        .order('submitted_at', { ascending: false })
        .limit(5);

      setPermits(permitsData || []);
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

  return (
    <div className="space-y-6">
      {/* Student Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informasi Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Nama:</span> {studentData.full_name}
            </div>
            <div>
              <span className="font-semibold">NIS:</span> {studentData.nis}
            </div>
            {studentData.class && (
              <div>
                <span className="font-semibold">Kelas:</span> {studentData.class.grade} {studentData.class.name}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
            {achievements.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Belum ada prestasi
              </p>
            ) : (
              <div className="space-y-3">
                {achievements.map((achievement) => (
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
            {violations.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Tidak ada pelanggaran
              </p>
            ) : (
              <div className="space-y-3">
                {violations.map((violation) => (
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

      {/* Recent Permits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Izin Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {permits.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Belum ada pengajuan izin
            </p>
          ) : (
            <div className="space-y-3">
              {permits.map((permit) => (
                <div key={permit.id} className="flex justify-between items-center p-3 border rounded">
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Calendar className="w-6 h-6" />
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
              <FileText className="w-6 h-6" />
              <span className="text-sm">Riwayat Lengkap</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
