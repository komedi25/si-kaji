
import { useAuth } from '@/hooks/useAuth';
import { RoleBasedStats } from './RoleBasedStats';
import { DashboardCharts } from './DashboardCharts';
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Selamat Datang di Si-Kaji SMKN 1 Kendal
          </h1>
          <p className="text-gray-600 mt-1">
            Sistem Informasi Kesiswaan SMK Negeri 1 Kendal
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefreshData}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <RoleBasedStats />

      {/* Charts Section */}
      {user?.roles && user.roles.length > 0 && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Analisis Data & Visualisasi
            </CardTitle>
            <CardDescription>
              Grafik dan analisis data berdasarkan role dan kewenangan Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardCharts />
          </CardContent>
        </Card>
      )}

      {/* Realtime Updates */}
      <RealtimeUpdates />
    </div>
  );
};
