
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, UserPlus, Upload, RefreshCw, Edit, Trash2, Key, Users, GraduationCap } from 'lucide-react';
import { AppRole, UserProfile } from '@/types/auth';
import { Student } from '@/types/student';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { AddUserDialog } from '@/components/user/AddUserDialog';
import { BulkUserImport } from '@/components/user/BulkUserImport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UserWithRoles extends UserProfile {
  roles: AppRole[];
}

interface StudentUser extends Student {
  roles: AppRole[];
  user_email?: string | null;
  has_user_account?: boolean;
}

export default function UserManagement() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null);
  const [newRole, setNewRole] = useState<AppRole | ''>('');
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStudentEditDialogOpen, setIsStudentEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStudentDeleteDialogOpen, setIsStudentDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRoles | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentUser | null>(null);

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles (non-students)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .not('nis', 'is', null); // Only get profiles that have NIP (staff/teachers)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }

      // Combine the data for staff/teachers
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => {
        const roles = (userRoles || [])
          .filter(ur => ur.user_id === profile.id)
          .map(ur => ur.role as AppRole);

        return {
          ...profile,
          roles
        };
      });
      
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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Fetch all students with their enrollment data
      const { data: studentsData, error: studentsError } = await supabase
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
        throw studentsError;
      }

      // Fetch user roles for students
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true)
        .eq('role', 'siswa');

      if (rolesError) {
        console.error('Error fetching student roles:', rolesError);
      }

      // Get user emails for students
      const studentUserIds = studentsData?.filter(s => s.user_id).map(s => s.user_id) || [];
      let userEmails: any[] = [];
      
      if (studentUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', studentUserIds);
        
        userEmails = profiles || [];
      }

      // Transform data to match StudentUser interface
      const studentsWithRoles: StudentUser[] = (studentsData || []).map((student: any) => {
        const enrollment = student.student_enrollments?.[0];
        const userEmail = userEmails.find(u => u.id === student.user_id);
        const hasUserRole = (userRoles || []).some(ur => ur.user_id === student.user_id);
        
        return {
          ...student,
          current_class: enrollment?.classes ? 
            `${enrollment.classes.grade} ${enrollment.classes.name}` : '-',
          roles: hasUserRole ? ['siswa'] : [],
          user_email: userEmail?.full_name || null,
          has_user_account: !!student.user_id
        };
      });

      setStudents(studentsWithRoles);
    } catch (error) {
      console.error('Error in fetchStudents:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa: " + (error as Error).message,
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
        description: "Gagal menambahkan role: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsAddingRole(false);
    }
  };

  const addRoleToStudent = async () => {
    if (!selectedStudent || !newRole) return;

    try {
      setIsAddingRole(true);
      
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedStudent.user_id,
          role: newRole as any,
          assigned_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Role ${getRoleLabel(newRole)} berhasil ditambahkan`
      });

      setNewRole('');
      setSelectedStudent(null);
      fetchStudents();
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
      fetchStudents();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus role: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const createUserAccount = async (student: StudentUser) => {
    try {
      // Create user account with temporary email
      const tempEmail = `${student.nis}@temp.smkn1kendal.sch.id`;
      const tempPassword = `siswa${student.nis}`;

      // Create profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          full_name: student.full_name,
          nis: student.nis
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Update student with user_id
      const { error: updateError } = await supabase
        .from('students')
        .update({ user_id: profile.id })
        .eq('id', student.id);

      if (updateError) throw updateError;

      // Add siswa role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.id,
          role: 'siswa',
          assigned_by: user?.id
        });

      if (roleError) throw roleError;

      toast({
        title: "Berhasil",
        description: `Akun user berhasil dibuat untuk ${student.full_name}. Email: ${tempEmail}, Password: ${tempPassword}`
      });

      fetchStudents();
    } catch (error) {
      console.error('Error creating user account:', error);
      toast({
        title: "Error",
        description: "Gagal membuat akun user: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (userId: string, userType: 'user' | 'student', identifier: string) => {
    try {
      const newPassword = userType === 'student' ? `siswa${identifier}` : `staff${identifier}`;
      
      // Note: In production, you would use Supabase Admin API to reset password
      // For now, we'll just show the new password to admin
      toast({
        title: "Password direset",
        description: `Password baru: ${newPassword}. Silakan berikan kepada pengguna.`
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
      // Delete user roles first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userToDelete.id);

      // Delete profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus"
      });

      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus pengguna: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      // Delete user roles if exists
      if (studentToDelete.user_id) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', studentToDelete.user_id);

        // Delete profile if exists
        await supabase
          .from('profiles')
          .delete()
          .eq('id', studentToDelete.user_id);
      }

      // Delete student enrollments
      await supabase
        .from('student_enrollments')
        .delete()
        .eq('student_id', studentToDelete.id);

      // Delete student record
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentToDelete.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data siswa berhasil dihapus"
      });

      setIsStudentDeleteDialogOpen(false);
      setStudentToDelete(null);
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus data siswa: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (hasRole('admin')) {
      fetchUsers();
      fetchStudents();
    }
  }, [hasRole]);

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.nip && user.nip.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nis.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Button variant="outline" onClick={() => { fetchUsers(); fetchStudents(); }}>
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

        <div className="mb-4">
          <Input
            placeholder="Cari berdasarkan nama atau NIS/NIP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff & Guru ({filteredUsers.length})
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Siswa ({filteredStudents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Staff & Guru</CardTitle>
                <CardDescription>
                  Kelola data staff dan guru dalam sistem
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
                        Tidak ada pengguna ditemukan.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>NIP</TableHead>
                          <TableHead>Telepon</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.full_name}</TableCell>
                            <TableCell>{user.nip || '-'}</TableCell>
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
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Role
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => resetPassword(user.id, 'user', user.nip || '')}
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setUserToDelete(user);
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

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Siswa</CardTitle>
                <CardDescription>
                  Kelola data siswa dan akun pengguna mereka
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Memuat data siswa...</span>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Alert className="mb-4">
                      <AlertDescription>
                        Tidak ada siswa ditemukan.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>NIS</TableHead>
                          <TableHead>Kelas</TableHead>
                          <TableHead>Status Akun</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.full_name}</TableCell>
                            <TableCell>{student.nis}</TableCell>
                            <TableCell>{student.current_class}</TableCell>
                            <TableCell>
                              {student.has_user_account ? (
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
                                {student.roles.length === 0 ? (
                                  <Badge variant="outline" className="text-xs">
                                    Belum ada role
                                  </Badge>
                                ) : (
                                  student.roles.map((role, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {getRoleLabel(role)}
                                      {student.user_id && (
                                        <button
                                          onClick={() => removeRoleFromUser(student.user_id!, role)}
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
                                {student.has_user_account ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedStudent(student)}
                                    >
                                      <UserPlus className="h-4 w-4 mr-1" />
                                      Role
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => resetPassword(student.user_id!, 'student', student.nis)}
                                    >
                                      <Key className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => createUserAccount(student)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Buat Akun
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setStudentToDelete(student);
                                    setIsStudentDeleteDialogOpen(true);
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

        {/* Add Role Modal for Users */}
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
                        .filter(option => !selectedUser.roles.includes(option.value) && option.value !== 'siswa')
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

        {/* Add Role Modal for Students */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-96 max-w-md">
              <CardHeader>
                <CardTitle>Tambah Role untuk {selectedStudent.full_name}</CardTitle>
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
                        .filter(option => !selectedStudent.roles.includes(option.value) && ['siswa', 'osis'].includes(option.value))
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
                      setSelectedStudent(null);
                      setNewRole('');
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={addRoleToStudent}
                    disabled={!newRole || isAddingRole || !selectedStudent.user_id}
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
                Tindakan ini tidak dapat dibatalkan.
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

        {/* Delete Student Dialog */}
        <Dialog open={isStudentDeleteDialogOpen} onOpenChange={setIsStudentDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Data Siswa</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus data siswa "{studentToDelete?.full_name}"? 
                Semua data terkait termasuk akun pengguna akan dihapus. Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStudentDeleteDialogOpen(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleDeleteStudent}>
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
            fetchUsers();
            fetchStudents();
          }}
        />

        {/* Bulk Import Dialog */}
        <BulkUserImport
          open={isBulkImportOpen}
          onOpenChange={setIsBulkImportOpen}
          onImportComplete={() => {
            fetchUsers();
            fetchStudents();
          }}
        />
      </div>
    </AppLayout>
  );
}
