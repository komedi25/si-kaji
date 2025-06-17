
import { useAuth } from '@/hooks/useAuth';
import { RoleBasedStats } from './RoleBasedStats';
import { RealtimeUpdates } from './RealtimeUpdates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, Shield, Database, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

export const DashboardHome = () => {
  const { user, loading, refreshUserData } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await refreshUserData();
    setIsRefreshing(false);
  };

  const handleDebugRoles = async () => {
    if (!user) return;
    
    try {
      console.log('=== DEBUG: Comprehensive role check ===');
      
      // Check if user exists in user_roles table
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);
      
      console.log('User roles query:', { userRoles, userRolesError });
      
      // Check all roles in the table
      const { data: allRoles, error: allRolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      console.log('All roles in table:', { allRoles, allRolesError });
      
      // Check if the user can access the table at all
      const { data: testAccess, error: testAccessError } = await supabase
        .from('user_roles')
        .select('id')
        .limit(1);
      
      console.log('Table access test:', { testAccess, testAccessError });
      
      // Get current auth user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('Current auth user:', { authData, authError });
      
      setDebugInfo({
        currentUser: {
          id: user.id,
          email: user.email,
          roles: user.roles
        },
        userRolesQuery: { userRoles, userRolesError },
        allRolesQuery: { allRoles, allRolesError },
        tableAccessTest: { testAccess, testAccessError },
        authUserCheck: { authData, authError },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: error.message });
    }
  };

  const handleForceAssignAdminRole = async () => {
    if (!user) return;
    
    try {
      setIsAssigningRole(true);
      console.log('=== FORCE ASSIGNING ADMIN ROLE ===');
      
      // First, try to delete any existing role for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);
      
      // Then insert the admin role
      const { data: insertData, error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'admin',
          assigned_by: user.id,
          is_active: true
        })
        .select();
      
      console.log('Force assign result:', { insertData, insertError });
      
      if (!insertError) {
        console.log('Admin role force assigned successfully');
        // Wait a moment then refresh
        setTimeout(async () => {
          await refreshUserData();
        }, 1000);
      } else {
        console.error('Failed to force assign admin role:', insertError);
      }
      
    } catch (error) {
      console.error('Error in force assign:', error);
    } finally {
      setIsAssigningRole(false);
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
          {user?.email === 'admin@smkn1kendal.sch.id' && (
            <Button 
              onClick={handleForceAssignAdminRole}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isAssigningRole}
            >
              <UserPlus className="h-4 w-4" />
              Force Admin Role
            </Button>
          )}
        </div>
      </div>

      {/* User Info Debug Card */}
      {user && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi User & Role Status
            </CardTitle>
            <CardDescription>
              Debug informasi untuk troubleshooting role assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <strong>User ID:</strong> 
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded">{user.id}</code>
                </div>
                <div className="flex items-center gap-2">
                  <strong>Email:</strong> 
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <strong>Nama:</strong> 
                  <span className="text-sm">{user.profile?.full_name || 'Belum diset'}</span>
                </div>
                <div className="space-y-1">
                  <strong>Roles saat ini:</strong>
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
                        Tidak ada role ditemukan
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {debugInfo && (
                <div className="space-y-2">
                  <strong>Debug Information:</strong>
                  <div className="max-h-64 overflow-auto">
                    <pre className="text-xs bg-gray-200 p-3 rounded whitespace-pre-wrap">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            {(!user.roles || user.roles.length === 0) && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Peringatan:</strong> User tidak memiliki role. Ini bisa disebabkan oleh:
                </p>
                <ul className="text-xs text-yellow-700 mt-1 ml-4 list-disc">
                  <li>RLS (Row Level Security) yang memblokir akses ke tabel user_roles</li>
                  <li>Data role belum tersimpan di database</li>
                  <li>Masalah sinkronisasi data setelah login</li>
                </ul>
              </div>
            )}
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
