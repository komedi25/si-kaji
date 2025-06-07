
import { AppLayout } from '@/components/layout/AppLayout';
import { CounselingManagement as CounselingManagementComponent } from '@/components/counseling/CounselingManagement';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CounselingManagement() {
  const { hasRole } = useAuth();

  if (!hasRole('guru_bk')) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md">
            <AlertDescription>
              Anda tidak memiliki akses ke halaman ini. Hanya Guru BK yang dapat mengakses manajemen konseling.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Konseling</h1>
          <p className="text-gray-600">Kelola sesi konseling dan bimbingan siswa</p>
        </div>
        <CounselingManagementComponent />
      </div>
    </AppLayout>
  );
}
