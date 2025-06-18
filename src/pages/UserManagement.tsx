
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Upload, RefreshCw, Shield, Users, GraduationCap } from 'lucide-react';
import { AppRole } from '@/types/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { AddUserDialog } from '@/components/user/AddUserDialog';
import { BulkUserImport } from '@/components/user/BulkUserImport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useUserFilters } from '@/hooks/useUserFilters';
import { UserTable } from '@/components/user/UserTable';
import { AllUserData } from '@/types/user';

export default function UserManagement() {
  const { hasRole } = useAuth();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AllUserData | null>(null);

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

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    await handleDeleteUser(userToDelete);
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

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
                  />
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
              <Button variant="destructive" onClick={handleDeleteUserConfirm}>
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
