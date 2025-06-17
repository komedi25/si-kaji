
import { useAuth } from '@/hooks/useAuth';
import { RoleBasedStats } from './RoleBasedStats';
import { RealtimeUpdates } from './RealtimeUpdates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

      {/* User Info Card */}
      {user && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi User
            </CardTitle>
            <CardDescription>
              Status login dan role pengguna saat ini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <strong>Email:</strong> 
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <strong>Nama:</strong> 
                  <span className="text-sm">{user.profile?.full_name || 'Belum diset'}</span>
                </div>
                <div className="space-y-1">
                  <strong>Roles:</strong>
                  <div className="flex flex-wrap gap-1">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        Tidak ada role
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Section */}
      <RoleBasedStats />

      {/* Realtime Updates */}
      <RealtimeUpdates />
    </div>
  );
};
