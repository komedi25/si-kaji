
import { useAuth } from '@/hooks/useAuth';
import { StudentDashboard } from './StudentDashboard';
import { HomeroomTeacherDashboard } from './HomeroomTeacherDashboard';
import { ResponsiveStatsGrid } from './ResponsiveStatsGrid';
import { ResponsiveDashboardCharts } from './ResponsiveDashboardCharts';
import { RealtimeUpdates } from './RealtimeUpdates';
import { Button } from '@/components/ui/button';
import { RefreshCw, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const DashboardHome = () => {
  const { user, loading, refreshUserData } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await refreshUserData();
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  // Show specialized dashboard for students
  if (user?.roles?.includes('siswa')) {
    return <StudentDashboard />;
  }

  // Show specialized dashboard for homeroom teachers
  if (user?.roles?.includes('wali_kelas')) {
    return <HomeroomTeacherDashboard />;
  }

  // Default responsive dashboard for other roles
  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
            Selamat Datang di Si-Kaji
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Sistem Informasi Kesiswaan SMK Negeri 1 Kendal
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button 
            onClick={handleRefreshData}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <ResponsiveStatsGrid />

      {/* Charts Section */}
      {user?.roles && user.roles.length > 0 && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <span className="truncate">Analisis Data & Visualisasi</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Grafik dan analisis data berdasarkan role dan kewenangan Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <ResponsiveDashboardCharts />
          </CardContent>
        </Card>
      )}

      {/* Realtime Updates */}
      <div className="hidden sm:block">
        <RealtimeUpdates />
      </div>
    </div>
  );
};
