
import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface ProtectedComponentProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallback?: ReactNode;
  showFallback?: boolean;
}

export const ProtectedComponent = ({ 
  children, 
  allowedRoles, 
  fallback,
  showFallback = false
}: ProtectedComponentProps) => {
  const { user, hasRole } = useAuth();

  if (!user) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  const hasRequiredRole = allowedRoles.some(role => hasRole(role));

  if (!hasRequiredRole) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    
    if (showFallback) {
      return (
        <Alert className="border-orange-200 bg-orange-50">
          <ShieldX className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Anda tidak memiliki akses untuk melihat konten ini.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  return <>{children}</>;
};
