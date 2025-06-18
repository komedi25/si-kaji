
import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StudentLetterRequest } from '@/components/student/StudentLetterRequest';
import { LetterRequestForm } from '@/components/letters/LetterRequestForm';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { useAuth } from '@/hooks/useAuth';

const DocumentManagement = () => {
  const { hasRole } = useAuth();

  const renderContent = () => {
    // If user is a student, show their letter request management
    if (hasRole('siswa')) {
      return <StudentLetterRequest />;
    }

    // For admin and teachers, show the management interface
    return (
      <div className="space-y-6">
        <LetterRequestForm />
        <DocumentUpload />
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {hasRole('siswa') ? 'Permohonan Surat' : 'Manajemen Dokumen'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {hasRole('siswa') 
              ? 'Ajukan permohonan surat dan pantau status pemrosesan'
              : 'Kelola permohonan surat siswa dan dokumen sekolah'
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

export default DocumentManagement;
