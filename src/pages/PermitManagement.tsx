
import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SimpleStudentPermitForm } from '@/components/student/SimpleStudentPermitForm';
import { PermitApproval } from '@/components/permits/PermitApproval';
import PermitReport from '@/components/permits/PermitReport';
import { useAuth } from '@/hooks/useAuth';

const PermitManagement = () => {
  const { hasRole } = useAuth();

  const renderContent = () => {
    // If user is a student, show simplified permit form
    if (hasRole('siswa')) {
      return (
        <div className="max-w-2xl mx-auto">
          <SimpleStudentPermitForm />
        </div>
      );
    }

    // For admin and teachers, show the management interface
    return (
      <div className="space-y-6">
        <PermitApproval />
        <PermitReport />
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {hasRole('siswa') ? 'Perizinan Saya' : 'Manajemen Perizinan'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {hasRole('siswa') 
              ? 'Ajukan permohonan izin dengan mudah'
              : 'Kelola permohonan izin siswa dan proses persetujuan'
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

export default PermitManagement;
