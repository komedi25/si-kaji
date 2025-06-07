
import { AppLayout } from '@/components/layout/AppLayout';
import { CaseManagement as CaseManagementComponent } from '@/components/cases/CaseManagement';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CaseManagement() {
  const { hasRole } = useAuth();

  if (!hasRole('guru_bk') && !hasRole('tppk') && !hasRole('arps') && !hasRole('p4gn')) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md">
            <AlertDescription>
              Anda tidak memiliki akses ke halaman ini. Hanya Guru BK, TPPK, ARPS, dan P4GN yang dapat mengakses manajemen kasus.
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
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Kasus</h1>
          <p className="text-gray-600">Kelola kasus dan penanganan siswa</p>
        </div>
        <CaseManagementComponent />
      </div>
    </AppLayout>
  );
}
