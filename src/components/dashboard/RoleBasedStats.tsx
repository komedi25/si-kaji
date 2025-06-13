import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StatisticsCard } from './StatisticsCard';
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
  const { data: studentStats } = useQuery({
    queryKey: ['student-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, status')
        .eq('status', 'active');
      
      if (error) throw error;
      return { total: data?.length || 0 };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('waka_kesiswaan')),
  });

  // Get attendance statistics
  const { data: attendanceStats } = useQuery({
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
      
      return { present, absent, late, total: data?.length || 0 };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('wali_kelas')),
  });

  // Get violation statistics
  const { data: violationStats } = useQuery({
    queryKey: ['violation-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_violations')
        .select('id, status')
        .eq('status', 'active');
      
      if (error) throw error;
      return { total: data?.length || 0 };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('tppk') || user.roles?.includes('wali_kelas')),
  });

  // Get achievement statistics
  const { data: achievementStats } = useQuery({
    queryKey: ['achievement-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_achievements')
        .select('id, status')
        .eq('status', 'verified');
      
      if (error) throw error;
      return { total: data?.length || 0 };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('wali_kelas')),
  });

  // Get case statistics
  const { data: caseStats } = useQuery({
    queryKey: ['case-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_cases')
        .select('id, status');
      
      if (error) throw error;
      
      const pending = data?.filter(c => c.status === 'pending').length || 0;
      const investigating = data?.filter(c => c.status === 'investigating').length || 0;
      const resolved = data?.filter(c => c.status === 'resolved').length || 0;
      
      return { pending, investigating, resolved, total: data?.length || 0 };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('guru_bk') || user.roles?.includes('tppk')),
  });

  // Get permit statistics
  const { data: permitStats } = useQuery({
    queryKey: ['permit-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_permits')
        .select('id, status');
      
      if (error) throw error;
      
      const pending = data?.filter(p => p.status === 'pending').length || 0;
      const approved = data?.filter(p => p.status === 'approved').length || 0;
      const rejected = data?.filter(p => p.status === 'rejected').length || 0;
      
      return { pending, approved, rejected, total: data?.length || 0 };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('wali_kelas')),
  });

  // Get extracurricular statistics
  const { data: extracurricularStats } = useQuery({
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

  if (!user?.roles) return null;

  const renderStatsForRole = () => {
    const stats = [];

    // Admin stats
    if (user.roles.includes('admin')) {
      stats.push(
        <StatisticsCard
          key="total-students"
          title="Total Siswa"
          value={studentStats?.total || 0}
          description="Siswa aktif"
          icon={Users}
          trend="neutral"
        />,
        <StatisticsCard
          key="total-violations"
          title="Pelanggaran Aktif"
          value={violationStats?.total || 0}
          description="Butuh tindak lanjut"
          icon={AlertTriangle}
          trend={violationStats?.total && violationStats.total > 10 ? "up" : "neutral"}
          className="border-red-200"
        />,
        <StatisticsCard
          key="total-achievements"
          title="Prestasi Terverifikasi"
          value={achievementStats?.total || 0}
          description="Prestasi siswa"
          icon={Trophy}
          trend="up"
          className="border-yellow-200"
        />,
        <StatisticsCard
          key="total-cases"
          title="Kasus Pending"
          value={caseStats?.pending || 0}
          description="Perlu ditangani"
          icon={FileText}
          trend={caseStats?.pending && caseStats.pending > 5 ? "up" : "neutral"}
        />
      );
    }

    // Wali Kelas stats
    if (user.roles.includes('wali_kelas')) {
      stats.push(
        <StatisticsCard
          key="attendance-present"
          title="Hadir Hari Ini"
          value={attendanceStats?.present || 0}
          description="Dari total presensi"
          icon={CheckCircle}
          trend="up"
          className="border-green-200"
        />,
        <StatisticsCard
          key="attendance-absent"
          title="Tidak Hadir"
          value={attendanceStats?.absent || 0}
          description="Hari ini"
          icon={AlertTriangle}
          trend={attendanceStats?.absent && attendanceStats.absent > 3 ? "up" : "neutral"}
          className="border-red-200"
        />,
        <StatisticsCard
          key="permits-pending"
          title="Izin Pending"
          value={permitStats?.pending || 0}
          description="Perlu persetujuan"
          icon={Clock}
          trend="neutral"
        />
      );
    }

    // Guru BK stats
    if (user.roles.includes('guru_bk')) {
      stats.push(
        <StatisticsCard
          key="cases-investigating"
          title="Kasus Ditangani"
          value={caseStats?.investigating || 0}
          description="Sedang diselidiki"
          icon={FileText}
          trend="neutral"
        />,
        <StatisticsCard
          key="cases-resolved"
          title="Kasus Selesai"
          value={caseStats?.resolved || 0}
          description="Bulan ini"
          icon={CheckCircle}
          trend="up"
          className="border-green-200"
        />
      );
    }

    // Koordinator Ekstrakurikuler stats
    if (user.roles.includes('koordinator_ekstrakurikuler')) {
      stats.push(
        <StatisticsCard
          key="extracurricular-activities"
          title="Kegiatan Aktif"
          value={extracurricularStats?.totalActivities || 0}
          description="Ekstrakurikuler"
          icon={BookOpen}
          trend="neutral"
        />,
        <StatisticsCard
          key="extracurricular-enrollments"
          title="Total Peserta"
          value={extracurricularStats?.totalEnrollments || 0}
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
        <StatisticsCard
          key="security-violations"
          title="Pelanggaran Keamanan"
          value={violationStats?.total || 0}
          description="Perlu tindakan"
          icon={Shield}
          trend={violationStats?.total && violationStats.total > 5 ? "up" : "neutral"}
          className="border-orange-200"
        />
      );
    }

    return stats;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {renderStatsForRole()}
    </div>
  );
};
