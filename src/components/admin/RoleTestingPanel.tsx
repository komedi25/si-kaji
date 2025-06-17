
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Shield, Info, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/types/auth';

interface UserWithRoles {
  id: string;
  email?: string;
  full_name: string;
  roles: AppRole[];
}

export const RoleTestingPanel = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);

  const testRoles: { role: AppRole; description: string; testData: string }[] = [
    { role: 'admin', description: 'Admin Sistem', testData: 'Melihat semua data, mengelola user' },
    { role: 'kepala_sekolah', description: 'Kepala Sekolah', testData: 'Dashboard eksekutif, approval akhir' },
    { role: 'tppk', description: 'TPPK', testData: 'Kasus kekerasan, input presensi manual' },
    { role: 'arps', description: 'ARPS', testData: 'Siswa putus sekolah, monitoring absensi' },
    { role: 'p4gn', description: 'P4GN', testData: 'Kasus narkoba, program pencegahan' },
    { role: 'koordinator_ekstrakurikuler', description: 'Koordinator Eskul', testData: 'Manajemen ekstrakurikuler, pelatih' },
    { role: 'wali_kelas', description: 'Wali Kelas', testData: 'Data siswa perwalian, jurnal kelas' },
    { role: 'guru_bk', description: 'Guru BK', testData: 'Konseling, catatan terenkripsi' },
    { role: 'waka_kesiswaan', description: 'Waka Kesiswaan', testData: 'Supervisi kesiswaan, analytics' },
    { role: 'pelatih_ekstrakurikuler', description: 'Pelatih Eskul', testData: 'Jurnal latihan, presensi' },
    { role: 'siswa', description: 'Siswa', testData: 'Portal siswa, pengajuan izin' },
    { role: 'orang_tua', description: 'Orang Tua', testData: 'Monitoring anak, notifikasi' },
    { role: 'penanggung_jawab_sarpras', description: 'PJ Sarpras', testData: 'Peminjaman fasilitas' },
    { role: 'osis', description: 'OSIS', testData: 'Proposal kegiatan siswa' }
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
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

      // Get emails from auth.users (if possible)
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      // Combine the data
      const usersWithRoles: UserWithRoles[] = profiles.map(profile => {
        const roles = userRoles
          .filter(ur => ur.user_id === profile.id)
          .map(ur => ur.role as AppRole);

        const authUser = authUsers?.users?.find(au => au.id === profile.id);

        return {
          id: profile.id,
          email: authUser?.email || 'Email tidak tersedia',
          full_name: profile.full_name,
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

  const createTestUser = async (role: AppRole) => {
    try {
      const email = `${role}@test.sikaji.com`;
      const password = 'test123456';
      
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: testRoles.find(r => r.role === role)?.description || role
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Wait a bit for the profile to be created by trigger
        setTimeout(async () => {
          try {
            // Add the role
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: authData.user!.id,
                role: role,
                assigned_by: user?.id || null
              });

            if (roleError) throw roleError;

            toast({
              title: "Berhasil",
              description: `User test ${role} berhasil dibuat dengan email: ${email}`,
            });

            fetchUsers();
          } catch (error) {
            console.error('Error adding role:', error);
          }
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error creating test user:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat user test",
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
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Panel ini hanya dapat diakses oleh Admin.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Panel Testing Role-Based System
          </CardTitle>
          <CardDescription>
            Panel untuk testing functionality role-based system Si-Kaji
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Info Testing:</strong> Sistem role-based sudah berfungsi dengan baik. 
              Dashboard, sidebar, dan stats menampilkan data yang berbeda berdasarkan role user.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Available Roles Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Role & Functionality
          </CardTitle>
          <CardDescription>
            Role yang tersedia dan data yang ditampilkan di dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testRoles.map((roleInfo) => (
              <div key={roleInfo.role} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{roleInfo.description}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => createTestUser(roleInfo.role)}
                    className="text-xs"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Buat User Test
                  </Button>
                </div>
                <p className="text-sm text-gray-600">{roleInfo.testData}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Users */}
      <Card>
        <CardHeader>
          <CardTitle>User yang Sudah Ada</CardTitle>
          <CardDescription>
            Daftar user dan role mereka saat ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Memuat data...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? (
                          user.roles.map((role, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {testRoles.find(r => r.role === role)?.description || role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">Tidak ada role</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Cara Testing:</strong>
          <br />1. Klik "Buat User Test" untuk role yang ingin dicoba
          <br />2. Login dengan email: [role]@test.sikaji.com, password: test123456
          <br />3. Lihat perbedaan dashboard, sidebar, dan data yang ditampilkan
          <br />4. Gunakan halaman User Management untuk menambah/menghapus role
        </AlertDescription>
      </Alert>
    </div>
  );
};
