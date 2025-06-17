import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, UserPlus, Upload, AlertCircle, Database } from 'lucide-react';
import { AppRole, UserProfile } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { AddUserDialog } from '@/components/user/AddUserDialog';
import { BulkUserImport } from '@/components/user/BulkUserImport';

interface UserWithRoles extends UserProfile {
  email?: string;
  roles: AppRole[];
}

interface DatabaseStats {
  profilesCount: number;
  userRolesCount: number;
  studentsCount: number;
}

export default function UserManagement() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [newRole, setNewRole] = useState<AppRole | ''>('');
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);

  const roleOptions: { value: AppRole; label: string }[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'kepala_sekolah', label: 'Kepala Sekolah' },
    { value: 'tppk', label: 'TPPK' },
    { value: 'arps', label: 'ARPS' },
    { value: 'p4gn', label: 'P4GN' },
    { value: 'koordinator_ekstrakurikuler', label: 'Koordinator Ekstrakurikuler' },
    { value: 'wali_kelas', label: 'Wali Kelas' },
    { value: 'guru_bk', label: 'Guru BK' },
    { value: 'waka_kesiswaan', label: 'Waka Kesiswaan' },
    { value: 'pelatih_ekstrakurikuler', label: 'Pelatih Ekstrakurikuler' },
    { value: 'siswa', label: 'Siswa' },
    { value: 'orang_tua', label: 'Orang Tua' },
    { value: 'penanggung_jawab_sarpras', label: 'Penanggung Jawab Sarpras' },
    { value: 'osis', label: 'OSIS' }
  ];

  const getRoleLabel = (role: AppRole) => {
    return roleOptions.find(r => r.value === role)?.label || role;
  };

  const fetchDatabaseStats = async () => {
    try {
      console.log('📊 Fetching database statistics...');
      
      // Count profiles
      const { count: profilesCount, error: profilesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (profilesError) {
        console.error('Error counting profiles:', profilesError);
      }

      // Count user roles
      const { count: userRolesCount, error: rolesError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });
      
      if (rolesError) {
        console.error('Error counting user roles:', rolesError);
      }

      // Count students (alternative source of users)
      const { count: studentsCount, error: studentsError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
      
      if (studentsError) {
        console.error('Error counting students:', studentsError);
      }

      const stats = {
        profilesCount: profilesCount || 0,
        userRolesCount: userRolesCount || 0,
        studentsCount: studentsCount || 0
      };

      console.log('📊 Database Stats:', stats);
      setDbStats(stats);
      
      return stats;
    } catch (error) {
      console.error('Error fetching database stats:', error);
      return null;
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching users data...');
      
      // Get database stats first
      const stats = await fetchDatabaseStats();
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      console.log('📋 Profiles data:', profiles);
      if (profilesError) {
        console.error('❌ Profiles error:', profilesError);
        setDebugInfo(`Error fetching profiles: ${profilesError.message}`);
        throw profilesError;
      }

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true);

      console.log('🎭 User roles data:', userRoles);
      if (rolesError) {
        console.error('❌ Roles error:', rolesError);
        setDebugInfo(prev => prev + `\nError fetching roles: ${rolesError.message}`);
        throw rolesError;
      }

      // Fetch students to see if there are users there
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, nis, phone, user_id')
        .limit(5);

      console.log('👨‍🎓 Sample students data:', students);
      if (studentsError) {
        console.error('❌ Students error:', studentsError);
      }

      // Combine the data
      const usersWithRoles: UserWithRoles[] = profiles?.map(profile => {
        const roles = userRoles
          ?.filter(ur => ur.user_id === profile.id)
          .map(ur => ur.role as AppRole) || [];

        return {
          ...profile,
          email: 'Email tersembunyi (perlu service role)',
          roles
        };
      }) || [];

      console.log('✅ Final users with roles:', usersWithRoles);
      
      // Update debug info with comprehensive information
      setDebugInfo(`
Database Statistics:
- Profiles table: ${stats?.profilesCount || 0} records
- User roles table: ${stats?.userRolesCount || 0} records
- Students table: ${stats?.studentsCount || 0} records

Fetching Results:
- Profiles fetched: ${profiles?.length || 0}
- User roles fetched: ${userRoles?.length || 0}
- Final users with roles: ${usersWithRoles.length}

Note: Users appear in this list only if they have a record in the 'profiles' table.
If you have users in other tables (like 'students'), they need profiles to appear here.
      `.trim());
      
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('❌ Critical error:', error);
      setDebugInfo(`Critical error: ${error}`);
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addRoleToUser = async () => {
    if (!selectedUser || !newRole) return;

    try {
      setIsAddingRole(true);
      
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.id,
          role: newRole as any,
          assigned_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Role ${getRoleLabel(newRole)} berhasil ditambahkan`
      });

      setNewRole('');
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan role",
        variant: "destructive"
      });
    } finally {
      setIsAddingRole(false);
    }
  };

  const removeRoleFromUser = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role', role as any);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Role ${getRoleLabel(role)} berhasil dihapus`
      });

      fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus role",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (hasRole('admin')) {
      fetchUsers();
    }
  }, [hasRole]);

  if (!hasRole('admin')) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md">
            <AlertDescription>
              Anda tidak memiliki akses ke halaman ini. Hanya Admin yang dapat mengakses manajemen pengguna.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
            <p className="text-gray-600">Kelola pengguna dan role dalam sistem</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import Excel
            </Button>
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pengguna
            </Button>
          </div>
        </div>

        {/* Database Statistics Card */}
        {dbStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Statistik Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{dbStats.profilesCount}</div>
                  <div className="text-gray-600">Profiles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{dbStats.userRolesCount}</div>
                  <div className="text-gray-600">User Roles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{dbStats.studentsCount}</div>
                  <div className="text-gray-600">Students</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Information */}
        {debugInfo && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Debug Info:</strong>
              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                {debugInfo}
              </pre>
            </AlertDescription>
          </Alert>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengguna</CardTitle>
            <CardDescription>
              Kelola role dan akses pengguna dalam sistem ({users.length} pengguna ditemukan)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>NIP/NIS</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="space-y-2">
                            <div className="text-gray-500">
                              Tidak ada pengguna ditemukan di tabel profiles.
                            </div>
                            {dbStats && dbStats.studentsCount > 0 && (
                              <div className="text-sm text-amber-600">
                                💡 Ada {dbStats.studentsCount} siswa di database. Mereka perlu profil untuk muncul di sini.
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.nip || user.nis || '-'}</TableCell>
                          <TableCell>{user.phone || '-'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.roles.length === 0 ? (
                                <Badge variant="outline" className="text-xs">
                                  Belum ada role
                                </Badge>
                              ) : (
                                user.roles.map((role, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {getRoleLabel(role)}
                                    <button
                                      onClick={() => removeRoleFromUser(user.id, role)}
                                      className="ml-1 hover:text-red-600"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Tambah Role
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Role Modal */}
        {selectedUser && (
          <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg w-96 max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Tambah Role untuk {selectedUser.full_name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium mb-2">Pilih Role</label>
                  <Select value={newRole} onValueChange={(value) => setNewRole(value as AppRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions
                        .filter(option => !selectedUser.roles.includes(option.value))
                        .map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(null);
                      setNewRole('');
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={addRoleToUser}
                    disabled={!newRole || isAddingRole}
                  >
                    {isAddingRole && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Tambah Role
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Add User Dialog */}
        <AddUserDialog
          open={isAddUserDialogOpen}
          onOpenChange={setIsAddUserDialogOpen}
          onSuccess={fetchUsers}
        />

        {/* Bulk Import Dialog */}
        <BulkUserImport
          open={isBulkImportOpen}
          onOpenChange={setIsBulkImportOpen}
          onImportComplete={fetchUsers}
        />
      </div>
    </AppLayout>
  );
}
