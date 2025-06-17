
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, UserPlus, Upload, RefreshCw } from 'lucide-react';
import { AppRole, UserProfile } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { AddUserDialog } from '@/components/user/AddUserDialog';
import { BulkUserImport } from '@/components/user/BulkUserImport';

interface UserWithRoles extends UserProfile {
  roles: AppRole[];
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

  const roleOptions: { value: AppRole; label: string }[] = [
    { value: 'admin', label: 'admin' },
    { value: 'kepala_sekolah', label: 'kepala_sekolah' },
    { value: 'tppk', label: 'tppk' },
    { value: 'arps', label: 'arps' },
    { value: 'p4gn', label: 'p4gn' },
    { value: 'koordinator_ekstrakurikuler', label: 'koordinator_ekstrakurikuler' },
    { value: 'wali_kelas', label: 'wali_kelas' },
    { value: 'guru_bk', label: 'guru_bk' },
    { value: 'waka_kesiswaan', label: 'waka_kesiswaan' },
    { value: 'pelatih_ekstrakurikuler', label: 'pelatih_ekstrakurikuler' },
    { value: 'siswa', label: 'siswa' },
    { value: 'orang_tua', label: 'orang_tua' },
    { value: 'penanggung_jawab_sarpras', label: 'penanggung_jawab_sarpras' },
    { value: 'osis', label: 'osis' }
  ];

  const getRoleLabel = (role: AppRole) => {
    return role;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users for admin:', user?.id);
      
      // Fetch profiles - admin should be able to see all profiles now
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles fetched:', profiles?.length || 0, 'profiles');

      // Fetch user roles - admin should be able to see all roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        // Don't throw error here, just log it and continue with empty roles
        console.warn('Could not fetch user roles, continuing with empty roles');
      }

      console.log('User roles fetched:', userRoles?.length || 0, 'role assignments');

      // Combine the data
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => {
        const roles = (userRoles || [])
          .filter(ur => ur.user_id === profile.id && ur.is_active === true)
          .map(ur => ur.role as AppRole);

        return {
          ...profile,
          roles
        };
      });
      
      console.log('Combined users with roles:', usersWithRoles.length, 'users');
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna: " + (error as Error).message,
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
      console.log('User has admin role, fetching users...');
      fetchUsers();
    } else {
      console.log('User does not have admin role');
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
            <Button variant="outline" onClick={fetchUsers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
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
                <span className="ml-2">Memuat data pengguna...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Alert className="mb-4">
                  <AlertDescription>
                    Tidak ada pengguna ditemukan. Silakan tambah pengguna baru atau periksa koneksi database.
                  </AlertDescription>
                </Alert>
                <Button onClick={fetchUsers} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Coba Lagi
                </Button>
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
                    {users.map((user) => (
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Role Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-96 max-w-md">
              <CardHeader>
                <CardTitle>Tambah Role untuk {selectedUser.full_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          </div>
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
