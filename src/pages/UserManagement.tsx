
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Edit, Trash2, UserPlus } from 'lucide-react';
import { AppRole, UserProfile, UserRole } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { AppLayout } from '@/components/layout/AppLayout';

interface UserWithRoles extends UserProfile {
  email?: string;
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

  const roleOptions: { value: AppRole; label: string }[] = [
    { value: 'admin_sistem', label: 'Admin Sistem' },
    { value: 'admin_kesiswaan', label: 'Admin Kesiswaan' },
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
    { value: 'penanggung_jawab_sarpras', label: 'Penanggung Jawab Sarpras' }
  ];

  const getRoleLabel = (role: AppRole) => {
    return roleOptions.find(r => r.value === role)?.label || role;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with their auth user data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true);

      if (rolesError) throw rolesError;

      // Fetch auth users to get email
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Combine the data
      const usersWithRoles: UserWithRoles[] = profiles.map(profile => {
        const authUser: User | undefined = authData.users?.find((u: User) => u.id === profile.id);
        const roles = userRoles
          .filter(ur => ur.user_id === profile.id)
          .map(ur => ur.role as AppRole);

        return {
          ...profile,
          email: authUser?.email,
          roles
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
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
          role: newRole,
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
        .eq('role', role);

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
    if (hasRole('admin_sistem')) {
      fetchUsers();
    }
  }, [hasRole]);

  if (!hasRole('admin_sistem')) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md">
            <AlertDescription>
              Anda tidak memiliki akses ke halaman ini. Hanya Admin Sistem yang dapat mengakses manajemen pengguna.
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pengguna
          </Button>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengguna</CardTitle>
            <CardDescription>
              Kelola role dan akses pengguna dalam sistem
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
                      <TableHead>Email</TableHead>
                      <TableHead>NIP/NIS</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.nip || user.nis || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {getRoleLabel(role)}
                                <button
                                  onClick={() => removeRoleFromUser(user.id, role)}
                                  className="ml-1 hover:text-red-600"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
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
          <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg w-96 max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Tambah Role untuk {selectedUser.full_name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="role">Pilih Role</Label>
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
      </div>
    </AppLayout>
  );
}
