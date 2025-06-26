
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Trophy, AlertTriangle, BookOpen, Users } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface StudentActivityOverviewProps {
  studentId: string;
}

export const StudentActivityOverview = ({ studentId }: StudentActivityOverviewProps) => {
  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['student-activity-overview', studentId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's attendance
      const { data: todayAttendance } = await supabase
        .from('student_self_attendances')
        .select('*')
        .eq('student_id', studentId)
        .eq('attendance_date', today)
        .single();

      // Get this week's statistics
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const [
        { data: weekAttendance },
        { data: weekViolations },
        { data: weekAchievements },
        { data: extracurriculars },
        { data: pendingPermits },
        { data: upcomingEvents }
      ] = await Promise.all([
        supabase
          .from('student_self_attendances')
          .select('*')
          .eq('student_id', studentId)
          .gte('attendance_date', weekAgo.toISOString().split('T')[0]),
        
        supabase
          .from('student_violations')
          .select('*')
          .eq('student_id', studentId)
          .gte('violation_date', weekAgo.toISOString().split('T')[0]),
        
        supabase
          .from('student_achievements')
          .select('*')
          .eq('student_id', studentId)
          .eq('status', 'verified')
          .gte('achievement_date', weekAgo.toISOString().split('T')[0]),
        
        supabase
          .from('extracurricular_enrollments')
          .select(`
            *,
            extracurriculars(name, schedule_day, schedule_time)
          `)
          .eq('student_id', studentId)
          .eq('status', 'active'),
        
        supabase
          .from('student_permits')
          .select('*')
          .eq('student_id', studentId)
          .eq('status', 'pending'),
        
        // Mock upcoming events - in real app this would come from activities/events table
        Promise.resolve({ data: [] })
      ]);

      return {
        todayAttendance,
        weekStats: {
          attendance: weekAttendance?.length || 0,
          violations: weekViolations?.length || 0,
          achievements: weekAchievements?.length || 0
        },
        extracurriculars: extracurriculars || [],
        pendingPermits: pendingPermits || [],
        upcomingEvents: upcomingEvents || []
      };
    },
    enabled: !!studentId
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { todayAttendance, weekStats, extracurriculars, pendingPermits } = overviewData || {};

  return (
    <div className="space-y-6">
      {/* Today's Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Status Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Kehadiran</p>
                <p className={`text-sm ${
                  todayAttendance ? 
                    (todayAttendance.status === 'present' ? 'text-green-600' :
                     todayAttendance.status === 'late' ? 'text-yellow-600' : 'text-red-600') :
                    'text-gray-600'
                }`}>
                  {todayAttendance ? 
                    (todayAttendance.status === 'present' ? 'Hadir' :
                     todayAttendance.status === 'late' ? 'Terlambat' : 'Tidak Hadir') :
                    'Belum Absen'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
              <Trophy className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Prestasi Minggu Ini</p>
                <p className="text-sm text-green-600">{weekStats?.achievements || 0} prestasi</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-red-50">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="font-medium text-gray-900">Pelanggaran Minggu Ini</p>
                <p className="text-sm text-red-600">{weekStats?.violations || 0} pelanggaran</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Minggu Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{weekStats?.attendance || 0}</div>
              <p className="text-gray-600">Hari Hadir</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{weekStats?.achievements || 0}</div>
              <p className="text-gray-600">Prestasi</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{weekStats?.violations || 0}</div>
              <p className="text-gray-600">Pelanggaran</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Extracurriculars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ekstrakurikuler Aktif
          </CardTitle>
        </CardHeader>
        <CardContent>
          {extracurriculars?.length > 0 ? (
            <div className="space-y-3">
              {extracurriculars.map((enrollment, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {enrollment.extracurriculars?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {enrollment.extracurriculars?.schedule_day} • {enrollment.extracurriculars?.schedule_time}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Belum mengikuti ekstrakurikuler</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Permits */}
      {pendingPermits?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pengajuan Izin Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPermits.map((permit, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                  <div>
                    <p className="font-medium text-gray-900">{permit.permit_type}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(permit.start_date), 'dd MMMM yyyy', { locale: localeId })}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    Menunggu
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
