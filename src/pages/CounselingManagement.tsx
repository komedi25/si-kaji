
import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StudentCounselingRequest } from '@/components/student/StudentCounselingRequest';
import { CounselingManagement as CounselingManagementComponent } from '@/components/counseling/CounselingManagement';
import { useAuth } from '@/hooks/useAuth';

const CounselingManagement = () => {
  const { hasRole } = useAuth();

  const renderContent = () => {
    // If user is a student, show their counseling request management
    if (hasRole('siswa')) {
      return <StudentCounselingRequest />;
    }

    // For admin and BK teachers, show the management interface
    return <CounselingManagementComponent />;
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {hasRole('siswa') ? 'Konseling Saya' : 'Manajemen Konseling'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {hasRole('siswa') 
              ? 'Ajukan konseling dan pantau riwayat sesi konseling'
              : 'Kelola jadwal konseling dan sesi dengan siswa'
            }
          </p>
        </div>

        <div className="space-y-4">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
};

export default CounselingManagement;
