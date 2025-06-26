
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, BookOpen, AlertCircle, Trophy, Users, FileText } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';

interface StudentActivityOverviewProps {
  studentId: string;
}

export const StudentActivityOverview = ({ studentId }: StudentActivityOverviewProps) => {
  // Query untuk overview mingguan
  const { data: weeklyOverview, isLoading } = useQuery({
    queryKey: ['student-weekly-overview', studentId],
    queryFn: async () => {
      const startWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      const endWeek = endOfWeek(new Date(), { weekStartsOn: 1 });
      
      // Attendance this week
      const { data: attendance } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('student_id', studentId)
        .gte('attendance_date', format(startWeek, 'yyyy-MM-dd'))
        .lte('attendance_date', format(endWeek, 'yyyy-MM-dd'));

      // Violations this week
      const { data: violations } = await supabase
        .from('student_violations')
        .select('*')
        .eq('student_id', studentId)
        .gte('violation_date', format(startWeek, 'yyyy-MM-dd'))
        .lte('violation_date', format(endWeek, 'yyyy-MM-dd'));

      // Achievements this week
      const { data: achievements } = await supabase
        .from('student_achievements')
        .select('*')
        .eq('student_id', studentId)
        .gte('achievement_date', format(startWeek, 'yyyy-MM-dd'))
        .lte('achievement_date', format(endWeek, 'yyyy-MM-dd'));

      // Extracurricular activities
      const { data: extracurriculars } = await supabase
        .from('extracurricular_enrollments')
        .select(`
          *,
          extracurriculars (
            name,
            schedule_day,
            schedule_time
          )
        `)
        .eq('student_id', studentId)
        .eq('status', 'active');

      // Recent cases
      const { data: cases } = await supabase
        .from('student_cases')
        .select('*')
        .eq('reported_student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        attendance: attendance || [],
        violations: violations || [],
        achievements: achievements || [],
        extracurriculars: extracurriculars || [],
        cases: cases || []
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const attendanceThisWeek = weeklyOverview?.attendance.length || 0;
  const violationsThisWeek = weeklyOverview?.violations.length || 0;
  const achievementsThisWeek = weeklyOverview?.achievements.length || 0;
  const activeExtracurriculars = weeklyOverview?.extracurriculars.length || 0;
  const recentCases = weeklyOverview?.cases.length || 0;

  return (
    <div className="space-y-6">
      {/* Weekly Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kehadiran Minggu Ini</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{attendanceThisWeek}</div>
            <p className="text-xs text-muted-foreground">Hari hadir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestasi Minggu Ini</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{achievementsThisWeek}</div>
            <p className="text-xs text-muted-foreground">Prestasi baru</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggaran Minggu Ini</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{violationsThisWeek}</div>
            <p className="text-xs text-muted-foreground">Pelanggaran</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ekstrakurikuler Aktif</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeExtracurriculars}</div>
            <p className="text-xs text-muted-foreground">Kegiatan diikuti</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Kasus</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{recentCases}</div>
            <p className="text-xs text-muted-foreground">Kasus terkait</p>
          </CardContent>
        </Card>
      </div>

      {/* Extracurricular Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Ekstrakurikuler yang Diikuti</CardTitle>
        </CardHeader>
        <CardContent>
          {activeExtracurriculars === 0 ? (
            <div className="text-center py-4">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-muted-foreground">Belum mengikuti ekstrakurikuler</p>
            </div>
          ) : (
            <div className="space-y-2">
              {weeklyOverview?.extracurriculars.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{enrollment.extracurriculars?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {enrollment.extracurriculars?.schedule_day} • {enrollment.extracurriculars?.schedule_time}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyOverview?.achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3 p-2 border-l-4 border-yellow-500 bg-yellow-50">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Prestasi baru ditambahkan</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(achievement.achievement_date), 'dd MMM yyyy', { locale: id })}
                  </p>
                </div>
              </div>
            ))}

            {weeklyOverview?.violations.map((violation) => (
              <div key={violation.id} className="flex items-center gap-3 p-2 border-l-4 border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Pelanggaran tercatat</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(violation.violation_date), 'dd MMM yyyy', { locale: id })}
                  </p>
                </div>
              </div>
            ))}

            {weeklyOverview?.attendance.map((attendance) => (
              <div key={attendance.id} className="flex items-center gap-3 p-2 border-l-4 border-blue-500 bg-blue-50">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">
                    Hadir {attendance.status === 'late' ? '(Terlambat)' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(attendance.attendance_date), 'dd MMM yyyy', { locale: id })}
                  </p>
                </div>
              </div>
            ))}

            {(!weeklyOverview?.achievements.length && !weeklyOverview?.violations.length && !weeklyOverview?.attendance.length) && (
              <div className="text-center py-4">
                <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-muted-foreground">Belum ada aktivitas minggu ini</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
