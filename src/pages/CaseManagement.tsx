
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
            <div className="flex justify-between items-center py-4 lg:py-6">
              <div className="flex items-center flex-shrink-0">
                <img 
                  src="/lovable-uploads/b258db0b-54a9-4826-a0ce-5850c64b6fc7.png" 
                  alt="Logo SMKN 1 Kendal" 
                  className="h-10 w-10 lg:h-12 lg:w-12 mr-3"
                />
                <div className="hidden sm:block">
                  <h1 className="text-lg lg:text-xl font-bold text-gray-900">SMK Negeri 1 Kendal</h1>
                  <p className="text-xs lg:text-sm text-gray-600">Sistem Pelaporan Kasus</p>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="hidden lg:block">
                  <CaseTracker />
                </div>
                <Link to="/">
                  <Button variant="outline" size="sm" className="text-xs lg:text-sm px-2 lg:px-4">
                    <span className="hidden sm:inline">Kembali ke Beranda</span>
                    <span className="sm:hidden">Beranda</span>
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="text-xs lg:text-sm px-2 lg:px-4">
                    <LogIn className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                    <span className="hidden sm:inline">Login Sistem</span>
                    <span className="sm:hidden">Login</span>
                  </Button>
                </Link>
              </div>
            </div>
            {/* Mobile Case Tracker */}
            <div className="block lg:hidden pb-4">
              <CaseTracker />
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="text-center mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Pelaporan Kasus Siswa</h1>
            <p className="text-sm lg:text-base text-gray-600">
              Laporkan kasus atau masalah yang terjadi di lingkungan sekolah. 
              Laporan Anda akan ditangani dengan serius dan terjaga kerahasiaannya.
            </p>
          </div>

          <Alert className="mb-6">
            <AlertDescription className="text-sm lg:text-base">
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
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Pelaporan Kasus</h1>
            <p className="text-sm lg:text-base text-gray-600">Laporkan kasus atau masalah yang terjadi</p>
          </div>
          
          <Alert>
            <AlertDescription className="text-sm lg:text-base">
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
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Manajemen Kasus</h1>
          <p className="text-sm lg:text-base text-gray-600">Kelola kasus dan penanganan siswa</p>
        </div>
        <CaseManagementComponent />
      </div>
    </AppLayout>
  );
}
