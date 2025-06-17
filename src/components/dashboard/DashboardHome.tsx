
import { useAuth } from '@/hooks/useAuth';
import { RoleBasedStats } from './RoleBasedStats';
import { RealtimeUpdates } from './RealtimeUpdates';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

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

      {/* Realtime Updates */}
      <RealtimeUpdates />
    </div>
  );
};
