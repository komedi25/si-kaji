
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export const Header = () => {
  const { user, signOut } = useAuth();

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'admin_sistem': 'Admin Sistem',
      'admin_kesiswaan': 'Admin Kesiswaan',
      'kepala_sekolah': 'Kepala Sekolah',
      'tppk': 'TPPK',
      'arps': 'ARPS',
      'p4gn': 'P4GN',
      'koordinator_ekstrakurikuler': 'Koordinator Ekstrakurikuler',
      'wali_kelas': 'Wali Kelas',
      'guru_bk': 'Guru BK',
      'waka_kesiswaan': 'Waka Kesiswaan',
      'pelatih_ekstrakurikuler': 'Pelatih Ekstrakurikuler',
      'siswa': 'Siswa',
      'orang_tua': 'Orang Tua',
      'penanggung_jawab_sarpras': 'Penanggung Jawab Sarpras'
    };
    return roleNames[role] || role;
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              SMK Negeri 1 Kendal - Sistem Kesiswaan
            </h1>
            <Badge variant="secondary" className="ml-3 text-xs">
              Phase 1
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:block">
                    {user?.profile?.full_name || user?.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-sm text-gray-600">
                  <div className="font-medium">{user?.profile?.full_name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                  {user?.profile?.nip && (
                    <div className="text-xs text-gray-500">NIP: {user.profile.nip}</div>
                  )}
                  {user?.profile?.nis && (
                    <div className="text-xs text-gray-500">NIS: {user.profile.nis}</div>
                  )}
                  {user?.roles && user.roles.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-700">Role:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.roles.map((role, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {getRoleDisplayName(role)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profil Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
