
import { AppLayout } from '@/components/layout/AppLayout';
import { EnhancedParentDashboard } from '@/components/parent/EnhancedParentDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function EnhancedParentPortal() {
  const { hasRole } = useAuth();

  if (!hasRole('admin') && !hasRole('wali_kelas') && !hasRole('orang_tua')) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Anda tidak memiliki akses ke halaman ini. Portal ini khusus untuk orang tua siswa.
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
          <h1 className="text-3xl font-bold text-gray-900">Portal Orang Tua</h1>
          <p className="text-gray-600">Monitor perkembangan anak Anda secara real-time</p>
        </div>
        <EnhancedParentDashboard />
      </div>
    </AppLayout>
  );
}
