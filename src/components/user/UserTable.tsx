
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Key, Plus, Trash2, Eye, Edit, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AppRole } from '@/types/auth';
import { AllUserData } from '@/types/user';

interface UserTableProps {
  users: AllUserData[];
  getRoleLabel: (role: AppRole) => string;
  onAddRole: (userData: AllUserData) => void;
  onRemoveRole: (userData: AllUserData, role: AppRole) => void;
  onCreateAccount: (userData: AllUserData) => void;
  onResetPassword: (userData: AllUserData) => void;
  onDeleteUser: (userData: AllUserData) => void;
  onEditStudentData?: (userData: AllUserData) => void;
}

export const UserTable = ({ 
  users, 
  getRoleLabel, 
  onAddRole, 
  onRemoveRole, 
  onCreateAccount, 
  onResetPassword, 
  onDeleteUser,
  onEditStudentData 
}: UserTableProps) => {
  const getStatusBadge = (userData: AllUserData) => {
    if (userData.has_user_account) {
      return <Badge variant="default" className="text-xs bg-green-100 text-green-800">Aktif</Badge>;
    }
    return <Badge variant="outline" className="text-xs text-gray-600">Belum ada akun</Badge>;
  };

  const getUserTypeBadge = (userType: string) => {
    if (userType === 'staff') {
      return <Badge className="text-xs bg-blue-100 text-blue-800">Staff/Guru</Badge>;
    }
    return <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">Siswa</Badge>;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold">Identitas</TableHead>
            <TableHead className="font-semibold">Kontak</TableHead>
            <TableHead className="font-semibold">Tipe & Status</TableHead>
            <TableHead className="font-semibold">Role & Akses</TableHead>
            <TableHead className="font-semibold text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((userData) => (
            <TableRow key={`${userData.user_type}-${userData.id}`} className="hover:bg-gray-50">
              {/* Identitas */}
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">{userData.full_name}</div>
                  <div className="text-sm text-gray-500">
                    {userData.nip && `NIP: ${userData.nip}`}
                    {userData.nis && `NIS: ${userData.nis}`}
                  </div>
                  {userData.current_class && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                      Kelas: {userData.current_class}
                    </div>
                  )}
                  {userData.student_status && userData.student_status !== 'active' && (
                    <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                      Status: {userData.student_status}
                    </div>
                  )}
                </div>
              </TableCell>

              {/* Kontak */}
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm text-gray-900">
                    {userData.email || <span className="text-gray-400 italic">Tidak ada email</span>}
                  </div>
                  <div className="text-sm text-gray-500">
                    {userData.phone || <span className="text-gray-400 italic">Tidak ada telepon</span>}
                  </div>
                </div>
              </TableCell>

              {/* Tipe & Status */}
              <TableCell>
                <div className="space-y-2">
                  {getUserTypeBadge(userData.user_type)}
                  {getStatusBadge(userData)}
                </div>
              </TableCell>

              {/* Role & Akses */}
              <TableCell>
                <div className="space-y-1">
                  {userData.roles.length === 0 ? (
                    <Badge variant="outline" className="text-xs text-gray-500">
                      Belum ada role
                    </Badge>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {userData.roles.map((role, index) => (
                        <div key={index} className="flex items-center">
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                            {getRoleLabel(role)}
                            {userData.has_user_account && (
                              <button
                                onClick={() => onRemoveRole(userData, role)}
                                className="ml-1 hover:text-red-600 text-gray-500"
                                title="Hapus role"
                              >
                                ×
                              </button>
                            )}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TableCell>

              {/* Aksi */}
              <TableCell>
                <div className="flex justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {userData.has_user_account ? (
                        <>
                          <DropdownMenuItem onClick={() => onAddRole(userData)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Kelola Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onResetPassword(userData)}>
                            <Key className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                        </>
                      ) : userData.user_type === 'student' ? (
                        <DropdownMenuItem onClick={() => onCreateAccount(userData)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Buat Akun User
                        </DropdownMenuItem>
                      ) : null}
                      
                      {userData.user_type === 'student' && onEditStudentData && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEditStudentData(userData)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Data Siswa
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => onDeleteUser(userData)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus {userData.user_type === 'student' ? 'Siswa' : 'Staff'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
