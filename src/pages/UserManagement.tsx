
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AddUserDialog } from '@/components/user/AddUserDialog';
import { BulkUserImport } from '@/components/user/BulkUserImport';
import { EditStudentDataDialog } from '@/components/user/EditStudentDataDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useUserFilters } from '@/hooks/useUserFilters';
import { UserTable } from '@/components/user/UserTable';
import { UserFilters } from '@/components/user/UserFilters';
import { UserActions } from '@/components/user/UserActions';
import { UserStats } from '@/components/user/UserStats';
import { AllUserData } from '@/types/user';
import { useToast } from '@/hooks/use-toast';

export default function UserManagement() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditStudentDialogOpen, setIsEditStudentDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AllUserData | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<AllUserData | null>(null);

  // Use custom hooks
  const {
    allUsers,
    loading,
    fetchAllUsers,
    createStudentUserAccount,
    resetPassword,
    handleDeleteUser
  } = useUserManagement();

  const {
    selectedUser,
    setSelectedUser,
    newRole,
    setNewRole,
    isAddingRole,
    roleOptions,
    getRoleLabel,
    addRoleToUser,
    removeRoleFromUser
  } = useUserRoles();

  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    filteredUsers
  } = useUserFilters(allUsers);

  // Handle URL parameters for role-based access
  useEffect(() => {
    const tab = searchParams.get('tab');
    const filter = searchParams.get('filter');
    
    if (hasRole('siswa')) {
      // Student can only see their own profile
      setActiveTab('students');
      if (filter === 'my-profile' && user?.id) {
        // Filter to show only current student's data
        setSearchTerm(user.id);
      }
    } else if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams, hasRole, user?.id, setActiveTab, setSearchTerm]);

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    await handleDeleteUser(userToDelete);
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleEditStudentData = (userData: AllUserData) => {
    if (userData.user_type === 'student' && userData.student_id) {
      setStudentToEdit(userData);
      setIsEditStudentDialogOpen(true);
    }
  };

  const handleExportData = () => {
    const dataToExport = filteredUsers.map(user => ({
      nama: user.full_name,
      email: user.email || '-',
      nip_nis: user.nip || user.nis || '-',
      tipe: user.user_type === 'staff' ? 'Staff/Guru' : 'Siswa',
      kelas: user.current_class || '-',
      roles: user.roles.map(role => getRoleLabel(role)).join(', '),
      status_akun: user.has_user_account ? 'Aktif' : 'Belum ada akun'
    }));

    const csv = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `data_pengguna_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Export Berhasil",
      description: "Data pengguna berhasil diexport ke file CSV"
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: "Generate Laporan",
      description: "Fitur laporan akan segera tersedia"
    });
  };

  // Role-based access control
  if (hasRole('siswa')) {
    // Students can only see their own data
    const studentData = allUsers.filter(userData => 
      userData.user_type === 'student' && 
      (userData.id === user?.id || userData.roles.some(role => role === 'siswa'))
    );

    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data Pribadi Saya</h1>
              <p className="text-gray-600">Lihat dan kelola data pribadi Anda</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Informasi Pribadi
              </CardTitle>
              <CardDescription>
                Data pribadi dan informasi akademik Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Memuat data...</span>
                </div>
              ) : studentData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Data tidak ditemukan</h3>
                  <p className="text-gray-500">Data pribadi Anda belum tersedia dalam sistem.</p>
                </div>
              ) : (
                <UserTable
                  users={studentData}
                  getRoleLabel={getRoleLabel}
                  onAddRole={() => {}} // Disabled for students
                  onRemoveRole={() => {}} // Disabled for students
                  onCreateAccount={() => {}} // Disabled for students
                  onResetPassword={() => {}} // Disabled for students
                  onDeleteUser={() => {}} // Disabled for students
                />
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // For admin, wali_kelas, and guru_bk - full user management
  if (!hasRole('admin') && !hasRole('wali_kelas') && !hasRole('guru_bk')) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md">
            <AlertDescription>
              Anda tidak memiliki akses ke halaman ini.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna Terpadu</h1>
            <p className="text-gray-600">Kelola semua pengguna sistem, data siswa, dan pengaturan akun dalam satu tempat</p>
          </div>
          {hasRole('admin') && (
            <UserActions
              onAddUser={() => setIsAddUserDialogOpen(true)}
              onBulkImport={() => setIsBulkImportOpen(true)}
              onRefresh={fetchAllUsers}
              onExportData={handleExportData}
              onGenerateReport={handleGenerateReport}
            />
          )}
        </div>

        {/* Statistics */}
        <UserStats users={allUsers} />

        {/* Filters and Search */}
        <UserFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filteredUsers={filteredUsers}
          roleOptions={roleOptions}
        />

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {activeTab === 'all' && 'Semua Pengguna Sistem'}
              {activeTab === 'staff' && 'Data Staff & Guru'}
              {activeTab === 'students' && 'Data Siswa & Akun'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'all' && 'Lihat dan kelola semua pengguna dalam sistem terpadu'}
              {activeTab === 'staff' && 'Kelola data staff, guru, dan role mereka dalam sistem'}
              {activeTab === 'students' && 'Kelola data siswa lengkap dan akun pengguna mereka'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Memuat data pengguna...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data ditemukan</h3>
                <p className="text-gray-500 mb-4">
                  Tidak ada pengguna yang sesuai dengan kriteria pencarian saat ini.
                </p>
                <Button onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setActiveTab('all');
                }} variant="outline">
                  Reset Filter
                </Button>
              </div>
            ) : (
              <UserTable
                users={filteredUsers}
                getRoleLabel={getRoleLabel}
                onAddRole={setSelectedUser}
                onRemoveRole={(userData, role) => removeRoleFromUser(userData, role, fetchAllUsers)}
                onCreateAccount={createStudentUserAccount}
                onResetPassword={resetPassword}
                onDeleteUser={(userData) => {
                  setUserToDelete(userData);
                  setIsDeleteDialogOpen(true);
                }}
                onEditStudentData={handleEditStudentData}
              />
            )}
          </CardContent>
        </Card>

        {/* Add Role Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-96 max-w-md">
              <CardHeader>
                <CardTitle>Tambah Role untuk {selectedUser.full_name}</CardTitle>
                <CardDescription>
                  {selectedUser.user_type === 'student' ? 'Pilih role untuk siswa' : 'Pilih role untuk staff/guru'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium mb-2">Pilih Role</label>
                  <Select value={newRole} onValueChange={(value) => setNewRole(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions
                        .filter(option => {
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
                    onClick={() => addRoleToUser(fetchAllUsers)}
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
                Apakah Anda yakin ingin menghapus "{userToDelete?.full_name}"? 
                {userToDelete?.user_type === 'student' 
                  ? ' Semua data siswa dan akun akan dihapus permanent.' 
                  : ' Semua data staff/guru akan dihapus permanent.'
                } Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleDeleteUserConfirm}>
                Hapus Permanent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Student Data Dialog */}
        {studentToEdit && (
          <EditStudentDataDialog
            open={isEditStudentDialogOpen}
            onOpenChange={setIsEditStudentDialogOpen}
            studentData={studentToEdit}
            onSuccess={() => {
              fetchAllUsers();
              setIsEditStudentDialogOpen(false);
              setStudentToEdit(null);
            }}
          />
        )}

        {/* Add User Dialog - Only for Admin */}
        {hasRole('admin') && (
          <>
            <AddUserDialog
              open={isAddUserDialogOpen}
              onOpenChange={setIsAddUserDialogOpen}
              onSuccess={fetchAllUsers}
            />

            <BulkUserImport
              open={isBulkImportOpen}
              onOpenChange={setIsBulkImportOpen}
              onImportComplete={fetchAllUsers}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
