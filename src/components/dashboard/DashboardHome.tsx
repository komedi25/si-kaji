
import { useAuth } from '@/hooks/useAuth';
import { RoleBasedStats } from './RoleBasedStats';
import { RealtimeUpdates } from './RealtimeUpdates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const DashboardHome = () => {
  const { user, loading, refreshUserData } = useAuth();

  const handleRefreshData = async () => {
    await refreshUserData();
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
            Selamat Datang di SIAKAD SMKN 1 Kendal
          </h1>
          <p className="text-gray-600 mt-1">
            Sistem Informasi Akademik dan Kesiswaan
          </p>
        </div>
        <Button 
          onClick={handleRefreshData}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* User Info Debug Card - Remove this in production */}
      {user && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi User (Debug)
            </CardTitle>
            <CardDescription>
              Informasi untuk debugging - akan dihapus di production
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <strong>Email:</strong> {user.email}
            </div>
            <div className="flex items-center gap-2">
              <strong>Nama:</strong> {user.profile?.full_name || 'Tidak tersedia'}
            </div>
            <div className="flex items-center gap-2">
              <strong>Roles:</strong> 
              {user.roles && user.roles.length > 0 ? (
                <div className="flex gap-1">
                  {user.roles.map((role, index) => (
                    <Badge key={index} variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      {role}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Badge variant="destructive">Tidak ada role</Badge>
              )}
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
