
import { AppLayout } from '@/components/layout/AppLayout';
import { CaseManagement as CaseManagementComponent } from '@/components/cases/CaseManagement';
import { CaseTracker } from '@/components/cases/CaseTracker';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export default function CaseManagement() {
  const { user, hasRole } = useAuth();

  // If user is not logged in, show public case reporting interface
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Header for non-authenticated users */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/b258db0b-54a9-4826-a0ce-5850c64b6fc7.png" 
                  alt="Logo SMKN 1 Kendal" 
                  className="h-12 w-12 mr-3"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SMK Negeri 1 Kendal</h1>
                  <p className="text-sm text-gray-600">Sistem Pelaporan Kasus</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CaseTracker />
                <Link to="/">
                  <Button variant="outline">Kembali ke Beranda</Button>
                </Link>
                <Link to="/auth">
                  <Button className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Login Sistem
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Pelaporan Kasus Siswa</h1>
            <p className="text-gray-600">
              Laporkan kasus atau masalah yang terjadi di lingkungan sekolah. 
              Laporan Anda akan ditangani dengan serius dan terjaga kerahasiaannya.
            </p>
          </div>

          <Alert className="mb-6">
            <AlertDescription>
              Anda dapat melaporkan kasus tanpa login. Namun untuk melihat status laporan dan mengakses fitur lengkap, 
              silakan <Link to="/auth" className="text-blue-600 hover:underline">login ke sistem</Link>.
            </AlertDescription>
          </Alert>

          <CaseManagementComponent />
        </div>
      </div>
    );
  }

  // If user is logged in but doesn't have access to full case management
  if (!hasRole('admin') && !hasRole('guru_bk') && !hasRole('tppk') && !hasRole('arps') && !hasRole('p4gn')) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pelaporan Kasus</h1>
            <p className="text-gray-600">Laporkan kasus atau masalah yang terjadi</p>
          </div>
          
          <Alert>
            <AlertDescription>
              Anda dapat melaporkan kasus, namun tidak memiliki akses penuh untuk mengelola semua kasus. 
              Silakan hubungi administrator untuk akses lebih lanjut.
            </AlertDescription>
          </Alert>
          
          <CaseManagementComponent />
        </div>
      </AppLayout>
    );
  }

  // Full access for authorized roles
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
