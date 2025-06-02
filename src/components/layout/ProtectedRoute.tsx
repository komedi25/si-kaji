
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { AppRole } from '@/types/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: AppRole[];
  requiredPermissions?: string[];
}

export const ProtectedRoute = ({ 
  children, 
  requiredRoles,
  requiredPermissions 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // Check required roles
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Alert className="max-w-md">
            <ShieldX className="h-4 w-4" />
            <AlertDescription>
              Anda tidak memiliki akses ke halaman ini. 
              Silakan hubungi administrator untuk mendapatkan role yang sesuai.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  return <>{children}</>;
};
