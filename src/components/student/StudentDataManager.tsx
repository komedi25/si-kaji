import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, Search, Plus, Upload, Edit, Trash2, RotateCcw, FileDown, UserPlus } from 'lucide-react';
import { AddStudentDialog } from './AddStudentDialog';
import { EditStudentDialog } from './EditStudentDialog';
import { ExcelImport } from './ExcelImport';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Major, Class } from '@/types/student';

interface StudentEnrollment {
  classes: {
    name: string;
    grade: number;
  } | null;
}

interface StudentData {
  id: string;
  user_id?: string | null;
  nis: string;
  nisn?: string | null;
  full_name: string;
  gender: string;
  birth_place?: string | null;
  birth_date?: string | null;
  phone?: string | null;
  address?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  status: string;
  student_enrollments?: StudentEnrollment[];
}

interface Student extends StudentData {
  current_class?: string;
  user_email?: string | null;
  has_user_account: boolean;
}

export const StudentDataManager = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
    if (hasRole('admin')) {
      fetchMajorsAndClasses();
    }
  }, [hasRole]);

  const fetchMajorsAndClasses = async () => {
    try {
      // Fetch majors
      const { data: majorsData, error: majorsError } = await supabase
        .from('majors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (majorsError) throw majorsError;

      // Fetch classes with major info
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          major:majors(*)
        `)
        .eq('is_active', true)
        .order('name');

      if (classesError) throw classesError;

      setMajors(majorsData || []);
      setClasses(classesData || []);
    } catch (error) {
      console.error('Error fetching majors and classes:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data jurusan dan kelas",
        variant: "destructive"
      });
    }
  };

  const fetchStudents = async () => {
    try {
      // Fetch students with enrollment and user data
      const { data, error } = await supabase
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
        .eq('student_enrollments.status', 'active')
        .order('full_name');

      if (error) throw error;

      // Get user accounts for students
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      const studentsWithUserInfo = (data as StudentData[] || []).map((student: StudentData): Student => {
        const enrollments = student.student_enrollments as StudentEnrollment[];
        const enrollment = enrollments && enrollments.length > 0 ? enrollments[0] : null;
        
        // Safely handle the users array and find operation
        const users = authUsers?.users || [];
        const userAccount = users.find(u => u.id === student.user_id) || null;
        
        return {
          ...student,
          current_class: enrollment?.classes ? 
            `${enrollment.classes.grade} ${enrollment.classes.name}` : '-',
          user_email: userAccount?.email || null,
          has_user_account: !!userAccount
        };
      });

      setStudents(studentsWithUserInfo);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    setShowAddDialog(true);
  };

  const handleImportExcel = () => {
    setShowImportDialog(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowEditDialog(true);
  };

  const handleCreateUserAccount = async (student: Student) => {
    if (student.has_user_account) {
      toast({
        title: "Info",
        description: "Siswa sudah memiliki akun user",
      });
      return;
    }

    try {
      setActionLoading(`create-${student.id}`);

      // Generate email from NIS
      const email = `${student.nis}@smkn1kendal.sch.id`;
      const password = `${student.nis}2024`; // Default password

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: student.full_name,
          nis: student.nis
        }
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          // User exists, try to link by finding the user
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(u => u.email === email);
          
          if (existingUser) {
            // Link existing user to student
            const { error: linkError } = await supabase
              .from('students')
              .update({ user_id: existingUser.id })
              .eq('id', student.id);

            if (linkError) throw linkError;

            // Add student role
            await supabase.from('user_roles').insert({
              user_id: existingUser.id,
              role: 'siswa',
              assigned_by: (await supabase.auth.getUser()).data.user?.id
            });

            toast({
              title: "Berhasil",
              description: `Akun yang sudah ada berhasil dihubungkan dengan siswa ${student.full_name}`,
            });
          }
        } else {
          throw authError;
        }
      } else if (authData.user) {
        // Link new user to student
        const { error: linkError } = await supabase
          .from('students')
          .update({ user_id: authData.user.id })
          .eq('id', student.id);

        if (linkError) throw linkError;

        // Add student role
        await supabase.from('user_roles').insert({
          user_id: authData.user.id,
          role: 'siswa',
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

        toast({
          title: "Berhasil",
          description: `Akun user berhasil dibuat untuk siswa ${student.full_name}. Email: ${email}, Password: ${password}`,
        });
      }

      fetchStudents();
    } catch (error) {
      console.error('Error creating user account:', error);
      toast({
        title: "Error",
        description: "Gagal membuat akun user untuk siswa",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleLinkExistingAccount = async (student: Student) => {
    if (student.has_user_account) {
      toast({
        title: "Info",
        description: "Siswa sudah memiliki akun user",
      });
      return;
    }

    try {
      setActionLoading(`link-${student.id}`);

      // Try to find user by email pattern or NIS
      const possibleEmails = [
        `${student.nis}@smkn1kendal.sch.id`,
        `${student.nis}@student.smkn1kendal.sch.id`,
        `${student.full_name.replace(/\s+/g, '.').toLowerCase()}@smkn1kendal.sch.id`
      ];

      const { data: allUsers } = await supabase.auth.admin.listUsers();
      let foundUser = null;

      // Search by email patterns
      for (const email of possibleEmails) {
        foundUser = allUsers.users.find(u => u.email === email);
        if (foundUser) break;
      }

      // Search by NIS in user metadata
      if (!foundUser) {
        foundUser = allUsers.users.find(u => 
          u.user_metadata?.nis === student.nis || 
          u.user_metadata?.full_name === student.full_name
        );
      }

      if (!foundUser) {
        toast({
          title: "Tidak Ditemukan",
          description: "Tidak ditemukan akun user yang cocok. Silakan buat akun baru.",
        });
        return;
      }

      // Link found user to student
      const { error: linkError } = await supabase
        .from('students')
        .update({ user_id: foundUser.id })
        .eq('id', student.id);

      if (linkError) throw linkError;

      // Add student role if not exists
      await supabase.from('user_roles').upsert({
        user_id: foundUser.id,
        role: 'siswa',
        assigned_by: (await supabase.auth.getUser()).data.user?.id
      });

      toast({
        title: "Berhasil",
        description: `Akun user ${foundUser.email} berhasil dihubungkan dengan siswa ${student.full_name}`,
      });

      fetchStudents();
    } catch (error) {
      console.error('Error linking existing account:', error);
      toast({
        title: "Error",
        description: "Gagal menghubungkan akun user yang sudah ada",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteDialog(true);
  };

  const confirmDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      setActionLoading('delete');

      // Delete student enrollments first
      const { error: enrollmentError } = await supabase
        .from('student_enrollments')
        .delete()
        .eq('student_id', selectedStudent.id);

      if (enrollmentError) throw enrollmentError;

      // Delete student record
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', selectedStudent.id);

      if (studentError) throw studentError;

      // If student has user account, delete it
      if (selectedStudent.user_id) {
        const { error: userError } = await supabase.auth.admin.deleteUser(selectedStudent.user_id);
        if (userError) {
          console.warn('Failed to delete user account:', userError);
        }
      }

      toast({
        title: "Berhasil",
        description: "Data siswa berhasil dihapus"
      });

      fetchStudents();
      setShowDeleteDialog(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus data siswa",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (student: Student) => {
    if (!student.user_id) {
      toast({
        title: "Error",
        description: "Siswa belum memiliki akun user",
        variant: "destructive"
      });
      return;
    }

    try {
      setActionLoading(`reset-${student.id}`);

      // Generate temporary password
      const tempPassword = `${student.nis}2024`;

      // Update user password
      const { error } = await supabase.auth.admin.updateUserById(student.user_id, {
        password: tempPassword
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Password siswa ${student.full_name} berhasil direset. Password baru: ${tempPassword}`,
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Gagal mereset password siswa",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditSuccess = () => {
    fetchStudents();
    setShowEditDialog(false);
    setSelectedStudent(null);
    toast({
      title: "Berhasil",
      description: "Data siswa berhasil diperbarui"
    });
  };

  const handleAddSuccess = () => {
    fetchStudents();
    setShowAddDialog(false);
    toast({
      title: "Berhasil",
      description: "Data siswa berhasil ditambahkan"
    });
  };

  const handleImportSuccess = () => {
    fetchStudents();
    setShowImportDialog(false);
    toast({
      title: "Berhasil",
      description: "Import data siswa berhasil"
    });
  };

  const exportToExcel = () => {
    // Simple CSV export
    const headers = ['NIS', 'NISN', 'Nama Lengkap', 'Jenis Kelamin', 'Kelas', 'No. Telepon', 'Status', 'Email User'];
    const csvData = [
      headers.join(','),
      ...students.map(student => [
        student.nis,
        student.nisn || '',
        student.full_name,
        student.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        student.current_class,
        student.phone || '',
        student.status,
        student.user_email || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `data-siswa-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nis.includes(searchTerm) ||
    (student.current_class && student.current_class.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span className="font-medium">Data Siswa ({filteredStudents.length})</span>
        </div>
        
        {hasRole('admin') && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel}>
              <FileDown className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={handleImportExcel}>
              <Upload className="h-4 w-4 mr-2" />
              Import Excel
            </Button>
            <Button onClick={handleAddStudent}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Siswa
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari siswa berdasarkan nama, NIS, atau kelas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Tidak ada data siswa yang ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>No. Telepon</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Akun User</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.nis}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>
                        {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </TableCell>
                      <TableCell>{student.current_class}</TableCell>
                      <TableCell>{student.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                          {student.status === 'active' ? 'Aktif' : student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.has_user_account ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs">
                              ✓ Ada Akun
                            </Badge>
                            {student.user_email && (
                              <div className="text-xs text-gray-500">{student.user_email}</div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Belum Ada Akun
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                            title="Edit Data Siswa"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          {!student.has_user_account ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCreateUserAccount(student)}
                                disabled={actionLoading === `create-${student.id}`}
                                title="Buat Akun User Baru"
                              >
                                <UserPlus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLinkExistingAccount(student)}
                                disabled={actionLoading === `link-${student.id}`}
                                title="Hubungkan Akun User yang Ada"
                              >
                                <Users className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetPassword(student)}
                              disabled={actionLoading === `reset-${student.id}`}
                              title="Reset Password"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStudent(student)}
                            disabled={actionLoading === 'delete'}
                            title="Hapus Siswa"
                          >
                            <Trash2 className="h-3 w-3" />
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

      {/* Add Student Dialog */}
      {showAddDialog && (
        <AddStudentDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={handleAddSuccess}
          majors={majors}
          classes={classes}
        />
      )}

      {/* Edit Student Dialog */}
      {showEditDialog && selectedStudent && (
        <EditStudentDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          student={selectedStudent}
          onSuccess={handleEditSuccess}
          majors={majors}
          classes={classes}
        />
      )}

      {/* Import Excel Dialog */}
      {showImportDialog && (
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Data Siswa dari Excel</DialogTitle>
              <DialogDescription>
                Import data siswa secara massal menggunakan file Excel/CSV
              </DialogDescription>
            </DialogHeader>
            <ExcelImport onImportComplete={handleImportSuccess} />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedStudent && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Data Siswa</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus data siswa <strong>{selectedStudent.full_name}</strong>?
                {selectedStudent.has_user_account && (
                  <div className="mt-2 text-red-600">
                    Perhatian: Akun user siswa ini juga akan dihapus.
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteStudent}
                disabled={actionLoading === 'delete'}
              >
                {actionLoading === 'delete' ? 'Menghapus...' : 'Hapus'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
