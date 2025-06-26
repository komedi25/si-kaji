
import { AppLayout } from '@/components/layout/AppLayout';
import { StudentProfile } from '@/components/student/StudentProfile';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, AlertTriangle } from 'lucide-react';

const ProfilePage = () => {
  const { user, hasRole } = useAuth();

  if (!user) {
    return (
      <AppLayout>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-red-800">Akses Ditolak</h3>
              <p className="text-red-700">
                Anda harus login untuk mengakses halaman profil.
              </p>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <User className="h-6 w-6" />
            Profil Pengguna
          </h1>
          <p className="opacity-90">
            Kelola informasi profil dan data pribadi Anda
          </p>
        </div>

        {hasRole('siswa') ? (
          <StudentProfile />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Profil Umum</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-lg">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                  <p className="text-lg">{user.profile?.full_name || 'Belum diatur'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <p className="text-lg">{user.roles?.join(', ') || 'Tidak ada role'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
