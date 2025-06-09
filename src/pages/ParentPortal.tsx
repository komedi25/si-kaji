
import { AppLayout } from '@/components/layout/AppLayout';
import { ParentDashboard } from '@/components/parent/ParentDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ParentPortal() {
  const { hasRole } = useAuth();

  if (!hasRole('admin') && !hasRole('wali_kelas') && !hasRole('orang_tua')) {
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portal Orang Tua</h1>
          <p className="text-gray-600">Portal informasi untuk orang tua siswa</p>
        </div>
        <ParentDashboard />
      </div>
    </AppLayout>
  );
}
