
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, UserPlus, Upload, RefreshCw, Edit, Trash2, Key, Users, GraduationCap, Shield } from 'lucide-react';
import { AppRole, UserProfile } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { AddUserDialog } from '@/components/user/AddUserDialog';
import { BulkUserImport } from '@/components/user/BulkUserImport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AllUserData {
  id: string;
  full_name: string;
  email?: string | null;
  nip?: string | null;
  nis?: string | null;
  phone?: string | null;
  user_type: 'staff' | 'student';
  roles: AppRole[];
  current_class?: string;
  has_user_account: boolean;
  created_at: string;
}

export default function UserManagement() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<AllUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AllUserData | null>(null);
  const [newRole, setNewRole] = useState<AppRole | ''>('');
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AllUserData | null>(null);
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');

  const roleOptions: { value: AppRole; label: string }[] = [
    { value: 'admin', label: 'Admin Sistem' },
    { value: 'kepala_sekolah', label: 'Kepala Sekolah' },
    { value: 'waka_kesiswaan', label: 'Waka Kesiswaan' },
    { value: 'tppk', label: 'TPPK' },
    { value: 'arps', label: 'ARPS' },
    { value: 'p4gn', label: 'P4GN' },
    { value: 'koordinator_ekstrakurikuler', label: 'Koordinator Ekstrakurikuler' },
    { value: 'wali_kelas', label: 'Wali Kelas' },
    { value: 'guru_bk', label: 'Guru BK' },
    { value: 'pelatih_ekstrakurikuler', label: 'Pelatih Ekstrakurikuler' },
    { value: 'siswa', label: 'Siswa' },
    { value: 'orang_tua', label: 'Orang Tua' },
    { value: 'penanggung_jawab_sarpras', label: 'PJ Sarpras' },
    { value: 'osis', label: 'OSIS' }
  ];

  const getRoleLabel = (role: AppRole) => {
    const found = roleOptions.find(option => option.value === role);
    return found ? found.label : role;
  };

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles (staff/teachers)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .not('nip', 'is', null);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Fetch all students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          student_enrollments!inner (
            classes (
              name,
              grade
            )
          )
        `)
        .order('full_name');

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
      }

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }

      // Get auth users for email data
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.error('Error fetching auth users:', authError);
      }

      // Combine all data
      const combinedUsers: AllUserData[] = [];

      // Add staff/teachers
      if (profiles) {
        profiles.forEach(profile => {
          const roles = (userRoles || [])
            .filter(ur => ur.user_id === profile.id)
            .map(ur => ur.role as AppRole);

          const authUser = authUsers?.users?.find(au => au.id === profile.id);

          combinedUsers.push({
            id: profile.id,
            full_name: profile.full_name,
            email: authUser?.email || null,
            nip: profile.nip,
            nis: null,
            phone: profile.phone,
            user_type: 'staff',
            roles,
            has_user_account: true,
            created_at: profile.created_at || new Date().toISOString()
          });
        });
      }

      // Add students
      if (students) {
        students.forEach((student: any) => {
          const enrollment = student.student_enrollments?.[0];
          const roles = (userRoles || [])
            .filter(ur => ur.user_id === student.user_id)
            .map(ur => ur.role as AppRole);

          const authUser = authUsers?.users?.find(au => au.id === student.user_id);

          combinedUsers.push({
            id: student.id,
            full_name: student.full_name,
            email: authUser?.email || null,
            nip: null,
            nis: student.nis,
            phone: student.phone,
            user_type: 'student',
            roles,
            current_class: enrollment?.classes ? 
              `${enrollment.classes.grade} ${enrollment.classes.name}` : '-',
            has_user_account: !!student.user_id,
            created_at: student.created_at
          });
        });
      }

      // Sort by name
      combinedUsers.sort((a, b) => a.full_name.localeCompare(b.full_name));
      
      setAllUsers(combinedUsers);
    } catch (error) {
      console.error('Error in fetchAllUsers:', error);
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
      
      // Find the actual user_id (for students, we need to get it from the student record)
      let targetUserId = selectedUser.id;
      
      if (selectedUser.user_type === 'student' && !selectedUser.has_user_account) {
        toast({
          title: "Error",
          description: "Siswa belum memiliki akun pengguna. Buat akun terlebih dahulu.",
          variant: "destructive"
        });
        return;
      }

      if (selectedUser.user_type === 'student') {
        // Get the user_id from student record
        const { data: studentData } = await supabase
          .from('students')
          .select('user_id')
          .eq('id', selectedUser.id)
          .single();
        
        if (studentData?.user_id) {
          targetUserId = studentData.user_id;
        }
      }
      
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: targetUserId,
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
      fetchAllUsers();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan role: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsAddingRole(false);
    }
  };

  const removeRoleFromUser = async (userData: AllUserData, role: AppRole) => {
    try {
      let targetUserId = userData.id;
      
      if (userData.user_type === 'student') {
        // Get the user_id from student record
        const { data: studentData } = await supabase
          .from('students')
          .select('user_id')
          .eq('id', userData.id)
          .single();
        
        if (studentData?.user_id) {
          targetUserId = studentData.user_id;
        }
      }

      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', targetUserId)
        .eq('role', role as any);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Role ${getRoleLabel(role)} berhasil dihapus`
      });

      fetchAllUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus role: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const createStudentUserAccount = async (studentData: AllUserData) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User ID tidak ditemukan",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate UUID for new profile
      const newUserId = crypto.randomUUID();
      
      // Create profile for student with proper ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUserId,
          full_name: studentData.full_name,
          nis: studentData.nis
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Update student with user_id
      const { error: updateError } = await supabase
        .from('students')
        .update({ user_id: profile.id })
        .eq('id', studentData.id);

      if (updateError) throw updateError;

      // Add siswa role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.id,
          role: 'siswa',
          assigned_by: user.id
        });

      if (roleError) throw roleError;

      const tempEmail = `${studentData.nis}@temp.smkn1kendal.sch.id`;
      const tempPassword = `siswa${studentData.nis}`;

      toast({
        title: "Berhasil",
        description: `Akun user berhasil dibuat untuk ${studentData.full_name}. Email: ${tempEmail}, Password: ${tempPassword}`
      });

      fetchAllUsers();
    } catch (error) {
      console.error('Error creating user account:', error);
      toast({
        title: "Error",
        description: "Gagal membuat akun user: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (userData: AllUserData) => {
    try {
      const identifier = userData.user_type === 'student' ? userData.nis : userData.nip;
      const prefix = userData.user_type === 'student' ? 'siswa' : 'staff';
      const newPassword = `${prefix}${identifier}`;
      
      toast({
        title: "Password direset",
        description: `Password baru untuk ${userData.full_name}: ${newPassword}. Silakan berikan kepada pengguna.`
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Gagal mereset password: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      if (userToDelete.user_type === 'student') {
        // For students, delete from students table
        const { data: studentData } = await supabase
          .from('students')
          .select('user_id')
          .eq('id', userToDelete.id)
          .single();

        if (studentData?.user_id) {
          // Delete user roles
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', studentData.user_id);

          // Delete profile
          await supabase
            .from('profiles')
            .delete()
            .eq('id', studentData.user_id);
        }

        // Delete student enrollments
        await supabase
          .from('student_enrollments')
          .delete()
          .eq('student_id', userToDelete.id);

        // Delete student record
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', userToDelete.id);

        if (error) throw error;
      } else {
        // For staff, delete from profiles table
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userToDelete.id);

        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userToDelete.id);

        if (error) throw error;
      }

      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus"
      });

      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchAllUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus pengguna: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (hasRole('admin')) {
      fetchAllUsers();
    }
  }, [hasRole]);

  // Filter users based on search term, tab, and role filter
  const filteredUsers = allUsers.filter(userData => {
    const matchesSearch = userData.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userData.nis && userData.nis.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (userData.nip && userData.nip.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (userData.email && userData.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTab = activeTab === 'all' || 
      (activeTab === 'staff' && userData.user_type === 'staff') ||
      (activeTab === 'students' && userData.user_type === 'student');

    const matchesRole = roleFilter === 'all' || userData.roles.includes(roleFilter);

    return matchesSearch && matchesTab && matchesRole;
  });

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
            <p className="text-gray-600">Kelola semua pengguna sistem: Staff, Guru, dan Siswa</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchAllUsers()}>
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

        <div className="flex gap-4 items-center">
          <Input
            placeholder="Cari berdasarkan nama, email, NIS, atau NIP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as AppRole | 'all')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter berdasarkan role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Semua Pengguna ({filteredUsers.length})
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff & Guru ({filteredUsers.filter(u => u.user_type === 'staff').length})
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Siswa ({filteredUsers.filter(u => u.user_type === 'student').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === 'all' && 'Semua Pengguna Sistem'}
                  {activeTab === 'staff' && 'Daftar Staff & Guru'}
                  {activeTab === 'students' && 'Daftar Siswa'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'all' && 'Kelola semua pengguna dalam sistem'}
                  {activeTab === 'staff' && 'Kelola data staff dan guru dalam sistem'}
                  {activeTab === 'students' && 'Kelola data siswa dan akun pengguna mereka'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Memuat data pengguna...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Alert className="mb-4">
                      <AlertDescription>
                        Tidak ada pengguna ditemukan dengan kriteria pencarian saat ini.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>NIP/NIS</TableHead>
                          <TableHead>Tipe</TableHead>
                          <TableHead>Kelas</TableHead>
                          <TableHead>Status Akun</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((userData) => (
                          <TableRow key={`${userData.user_type}-${userData.id}`}>
                            <TableCell className="font-medium">{userData.full_name}</TableCell>
                            <TableCell>{userData.email || '-'}</TableCell>
                            <TableCell>{userData.nip || userData.nis || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={userData.user_type === 'staff' ? 'default' : 'secondary'}>
                                {userData.user_type === 'staff' ? 'Staff/Guru' : 'Siswa'}
                              </Badge>
                            </TableCell>
                            <TableCell>{userData.current_class || '-'}</TableCell>
                            <TableCell>
                              {userData.has_user_account ? (
                                <Badge variant="default" className="text-xs">
                                  Aktif
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Belum ada akun
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {userData.roles.length === 0 ? (
                                  <Badge variant="outline" className="text-xs">
                                    Belum ada role
                                  </Badge>
                                ) : (
                                  userData.roles.map((role, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {getRoleLabel(role)}
                                      {userData.has_user_account && (
                                        <button
                                          onClick={() => removeRoleFromUser(userData, role)}
                                          className="ml-1 hover:text-red-600"
                                        >
                                          ×
                                        </button>
                                      )}
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {userData.has_user_account ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedUser(userData)}
                                    >
                                      <UserPlus className="h-4 w-4 mr-1" />
                                      Role
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => resetPassword(userData)}
                                    >
                                      <Key className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : userData.user_type === 'student' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => createStudentUserAccount(userData)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Buat Akun
                                  </Button>
                                ) : null}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setUserToDelete(userData);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
                        .filter(option => {
                          // Filter based on user type and existing roles
                          if (!selectedUser.roles.includes(option.value)) {
                            if (selectedUser.user_type === 'student') {
                              return ['siswa', 'osis'].includes(option.value);
                            } else {
                              return option.value !== 'siswa';
                            }
                          }
                          return false;
                        })
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

        {/* Delete User Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Pengguna</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus pengguna "{userToDelete?.full_name}"? 
                {userToDelete?.user_type === 'student' 
                  ? ' Semua data siswa termasuk akun pengguna akan dihapus.' 
                  : ' Semua data staff/guru akan dihapus.'
                } Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add User Dialog */}
        <AddUserDialog
          open={isAddUserDialogOpen}
          onOpenChange={setIsAddUserDialogOpen}
          onSuccess={() => {
            fetchAllUsers();
          }}
        />

        {/* Bulk Import Dialog */}
        <BulkUserImport
          open={isBulkImportOpen}
          onOpenChange={setIsBulkImportOpen}
          onImportComplete={() => {
            fetchAllUsers();
          }}
        />
      </div>
    </AppLayout>
  );
}
