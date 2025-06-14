
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StatsCard } from './StatsCard';
import { 
  Users, 
  BookOpen, 
  Shield, 
  Calendar, 
  Trophy, 
  AlertTriangle,
  FileText,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

export const RoleBasedStats = () => {
  const { user } = useAuth();

  // Get student statistics
  const { data: studentStats, isLoading: loadingStudents } = useQuery({
    queryKey: ['student-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, status');
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const active = data?.filter(s => s.status === 'active').length || 0;
      const inactive = data?.filter(s => s.status === 'inactive').length || 0;
      
      return { total, active, inactive };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('waka_kesiswaan')),
  });

  // Get attendance statistics for today
  const { data: attendanceStats, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('student_attendances')
        .select('status')
        .eq('attendance_date', today);
      
      if (error) throw error;
      
      const present = data?.filter(a => a.status === 'present').length || 0;
      const absent = data?.filter(a => a.status === 'absent').length || 0;
      const late = data?.filter(a => a.status === 'late').length || 0;
      const total = data?.length || 0;
      
      return { present, absent, late, total };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('wali_kelas')),
  });

  // Get violation statistics
  const { data: violationStats, isLoading: loadingViolations } = useQuery({
    queryKey: ['violation-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_violations')
        .select('id, status, violation_date')
        .eq('status', 'active');
      
      if (error) throw error;
      
      const total = data?.length || 0;
      
      // Get this week's violations
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeek = data?.filter(v => 
        new Date(v.violation_date) >= oneWeekAgo
      ).length || 0;
      
      return { total, thisWeek };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('tppk') || user.roles?.includes('wali_kelas')),
  });

  // Get achievement statistics
  const { data: achievementStats, isLoading: loadingAchievements } = useQuery({
    queryKey: ['achievement-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_achievements')
        .select('id, status, achievement_date')
        .eq('status', 'verified');
      
      if (error) throw error;
      
      const total = data?.length || 0;
      
      // Get this month's achievements
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const thisMonth = data?.filter(a => 
        new Date(a.achievement_date) >= oneMonthAgo
      ).length || 0;
      
      return { total, thisMonth };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('wali_kelas')),
  });

  // Get case statistics
  const { data: caseStats, isLoading: loadingCases } = useQuery({
    queryKey: ['case-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_cases')
        .select('id, status, created_at');
      
      if (error) throw error;
      
      const pending = data?.filter(c => c.status === 'pending').length || 0;
      const investigating = data?.filter(c => c.status === 'investigating').length || 0;
      const resolved = data?.filter(c => c.status === 'resolved').length || 0;
      const total = data?.length || 0;
      
      return { pending, investigating, resolved, total };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('guru_bk') || user.roles?.includes('tppk')),
  });

  // Get permit statistics
  const { data: permitStats, isLoading: loadingPermits } = useQuery({
    queryKey: ['permit-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_permits')
        .select('id, status, created_at');
      
      if (error) throw error;
      
      const pending = data?.filter(p => p.status === 'pending').length || 0;
      const approved = data?.filter(p => p.status === 'approved').length || 0;
      const rejected = data?.filter(p => p.status === 'rejected').length || 0;
      const total = data?.length || 0;
      
      return { pending, approved, rejected, total };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('wali_kelas')),
  });

  // Get extracurricular statistics
  const { data: extracurricularStats, isLoading: loadingExtracurricular } = useQuery({
    queryKey: ['extracurricular-stats'],
    queryFn: async () => {
      const { data: enrollments, error } = await supabase
        .from('extracurricular_enrollments')
        .select('id, status')
        .eq('status', 'active');
      
      if (error) throw error;
      
      const { data: activities, error: activitiesError } = await supabase
        .from('extracurriculars')
        .select('id')
        .eq('is_active', true);
      
      if (activitiesError) throw activitiesError;
      
      return { 
        totalEnrollments: enrollments?.length || 0,
        totalActivities: activities?.length || 0
      };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('koordinator_ekstrakurikuler')),
  });

  // Get counseling session statistics
  const { data: counselingStats, isLoading: loadingCounseling } = useQuery({
    queryKey: ['counseling-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select('id, status, session_date');
      
      if (error) throw error;
      
      const scheduled = data?.filter(s => s.status === 'scheduled').length || 0;
      const completed = data?.filter(s => s.status === 'completed').length || 0;
      const total = data?.length || 0;
      
      return { scheduled, completed, total };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('guru_bk')),
  });

  if (!user?.roles) return null;

  const renderStatsForRole = () => {
    const stats = [];
    const isLoading = loadingStudents || loadingAttendance || loadingViolations || loadingAchievements || loadingCases || loadingPermits || loadingExtracurricular || loadingCounseling;

    // Admin stats
    if (user.roles.includes('admin')) {
      stats.push(
        <StatsCard
          key="total-students"
          title="Total Siswa"
          value={isLoading ? "..." : (studentStats?.total || 0)}
          description={`${studentStats?.active || 0} siswa aktif`}
          icon={Users}
          trend="neutral"
        />,
        <StatsCard
          key="total-violations"
          title="Pelanggaran Aktif"
          value={isLoading ? "..." : (violationStats?.total || 0)}
          description={`${violationStats?.thisWeek || 0} minggu ini`}
          icon={AlertTriangle}
          trend={violationStats?.thisWeek && violationStats.thisWeek > 10 ? "up" : "neutral"}
          className="border-red-200"
        />,
        <StatsCard
          key="total-achievements"
          title="Prestasi Terverifikasi"
          value={isLoading ? "..." : (achievementStats?.total || 0)}
          description={`${achievementStats?.thisMonth || 0} bulan ini`}
          icon={Trophy}
          trend="up"
          className="border-yellow-200"
        />,
        <StatsCard
          key="total-cases"
          title="Kasus Pending"
          value={isLoading ? "..." : (caseStats?.pending || 0)}
          description="Perlu ditangani"
          icon={FileText}
          trend={caseStats?.pending && caseStats.pending > 5 ? "up" : "neutral"}
        />
      );
    }

    // Wali Kelas stats
    if (user.roles.includes('wali_kelas')) {
      stats.push(
        <StatsCard
          key="attendance-present"
          title="Hadir Hari Ini"
          value={isLoading ? "..." : (attendanceStats?.present || 0)}
          description={`Dari ${attendanceStats?.total || 0} siswa`}
          icon={CheckCircle}
          trend="up"
          className="border-green-200"
        />,
        <StatsCard
          key="attendance-absent"
          title="Tidak Hadir"
          value={isLoading ? "..." : (attendanceStats?.absent || 0)}
          description="Hari ini"
          icon={AlertTriangle}
          trend={attendanceStats?.absent && attendanceStats.absent > 3 ? "up" : "neutral"}
          className="border-red-200"
        />,
        <StatsCard
          key="permits-pending"
          title="Izin Pending"
          value={isLoading ? "..." : (permitStats?.pending || 0)}
          description="Perlu persetujuan"
          icon={Clock}
          trend="neutral"
        />
      );
    }

    // Guru BK stats
    if (user.roles.includes('guru_bk')) {
      stats.push(
        <StatsCard
          key="cases-investigating"
          title="Kasus Ditangani"
          value={isLoading ? "..." : (caseStats?.investigating || 0)}
          description="Sedang diselidiki"
          icon={FileText}
          trend="neutral"
        />,
        <StatsCard
          key="counseling-scheduled"
          title="Sesi Terjadwal"
          value={isLoading ? "..." : (counselingStats?.scheduled || 0)}
          description="Konseling mendatang"
          icon={Calendar}
          trend="neutral"
        />,
        <StatsCard
          key="cases-resolved"
          title="Kasus Selesai"
          value={isLoading ? "..." : (caseStats?.resolved || 0)}
          description="Total diselesaikan"
          icon={CheckCircle}
          trend="up"
          className="border-green-200"
        />
      );
    }

    // Koordinator Ekstrakurikuler stats
    if (user.roles.includes('koordinator_ekstrakurikuler')) {
      stats.push(
        <StatsCard
          key="extracurricular-activities"
          title="Kegiatan Aktif"
          value={isLoading ? "..." : (extracurricularStats?.totalActivities || 0)}
          description="Ekstrakurikuler"
          icon={BookOpen}
          trend="neutral"
        />,
        <StatsCard
          key="extracurricular-enrollments"
          title="Total Peserta"
          value={isLoading ? "..." : (extracurricularStats?.totalEnrollments || 0)}
          description="Terdaftar aktif"
          icon={Users}
          trend="up"
          className="border-blue-200"
        />
      );
    }

    // TPPK stats
    if (user.roles.includes('tppk')) {
      stats.push(
        <StatsCard
          key="security-violations"
          title="Pelanggaran Keamanan"
          value={isLoading ? "..." : (violationStats?.total || 0)}
          description={`${violationStats?.thisWeek || 0} minggu ini`}
          icon={Shield}
          trend={violationStats?.thisWeek && violationStats.thisWeek > 5 ? "up" : "neutral"}
          className="border-orange-200"
        />
      );
    }

    // Waka Kesiswaan stats
    if (user.roles.includes('waka_kesiswaan')) {
      stats.push(
        <StatsCard
          key="overall-students"
          title="Siswa Keseluruhan"
          value={isLoading ? "..." : (studentStats?.total || 0)}
          description={`${studentStats?.active || 0} aktif, ${studentStats?.inactive || 0} tidak aktif`}
          icon={Users}
          trend="neutral"
        />,
        <StatsCard
          key="overall-discipline"
          title="Tingkat Disiplin"
          value={isLoading ? "..." : `${violationStats?.total ? Math.max(0, 100 - (violationStats.total * 2)) : 100}%`}
          description="Skor disiplin rata-rata"
          icon={BarChart3}
          trend={violationStats?.total && violationStats.total > 20 ? "down" : "up"}
          className="border-purple-200"
        />
      );
    }

    return stats;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
      {renderStatsForRole()}
    </div>
  );
};
