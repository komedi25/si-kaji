
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Key, Plus, Trash2 } from 'lucide-react';
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
}

export const UserTable = ({ 
  users, 
  getRoleLabel, 
  onAddRole, 
  onRemoveRole, 
  onCreateAccount, 
  onResetPassword, 
  onDeleteUser 
}: UserTableProps) => {
  return (
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
          {users.map((userData) => (
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
                            onClick={() => onRemoveRole(userData, role)}
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
                        onClick={() => onAddRole(userData)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Role
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResetPassword(userData)}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                    </>
                  ) : userData.user_type === 'student' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCreateAccount(userData)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Buat Akun
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteUser(userData)}
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
  );
};
