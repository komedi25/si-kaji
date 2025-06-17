
import { useAuth } from '@/hooks/useAuth';
import { RoleBasedStats } from './RoleBasedStats';
import { RealtimeUpdates } from './RealtimeUpdates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, Shield, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

export const DashboardHome = () => {
  const { user, loading, refreshUserData } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await refreshUserData();
    setIsRefreshing(false);
  };

  const handleDebugRoles = async () => {
    if (!user) return;
    
    try {
      console.log('=== DEBUG: Checking roles for user ===');
      console.log('User ID:', user.id);
      console.log('User Email:', user.email);
      
      // Check if user exists in user_roles table
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);
      
      console.log('Roles query result:', { rolesData, rolesError });
      
      // Check all roles in the table
      const { data: allRoles, error: allRolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      console.log('All roles in table:', { allRoles, allRolesError });
      
      // Try to manually insert admin role if it doesn't exist
      if (!rolesData || rolesData.length === 0) {
        console.log('No roles found, attempting to insert admin role...');
        
        const { data: insertResult, error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'admin',
            assigned_by: user.id,
            is_active: true
          })
          .select();
        
        console.log('Insert result:', { insertResult, insertError });
        
        setDebugInfo({
          userRoles: rolesData,
          allRoles: allRoles,
          insertAttempt: { insertResult, insertError },
          timestamp: new Date().toISOString()
        });
      } else {
        setDebugInfo({
          userRoles: rolesData,
          allRoles: allRoles,
          timestamp: new Date().toISOString()
        });
      }
      
      // Refresh user data after debug
      await refreshUserData();
      
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: error.message });
    }
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
          <Button 
            onClick={handleDebugRoles}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Debug Roles
          </Button>
        </div>
      </div>

      {/* User Info Debug Card */}
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
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <strong>User ID:</strong> 
                  <code className="text-xs bg-gray-200 px-1 rounded">{user.id}</code>
                </div>
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
              </div>
              
              {debugInfo && (
                <div className="space-y-2">
                  <strong>Debug Info:</strong>
                  <pre className="text-xs bg-gray-200 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
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
