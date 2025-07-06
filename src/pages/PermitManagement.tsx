
import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EnhancedPermitForm } from '@/components/permits/EnhancedPermitForm';
import { EnhancedPermitApproval } from '@/components/permits/EnhancedPermitApproval';
import { StudentPermitManagement } from '@/components/student/StudentPermitManagement';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PermitManagement = () => {
  const { hasRole } = useAuth();

  const renderContent = () => {
    // If user is a student, show student permit management
    if (hasRole('siswa')) {
      return (
        <Tabs defaultValue="new-permit" className="w-full">
          <TabsList>
            <TabsTrigger value="new-permit">Ajukan Izin</TabsTrigger>
            <TabsTrigger value="history">Riwayat Izin</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new-permit">
            <div className="max-w-4xl mx-auto">
              <EnhancedPermitForm />
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <StudentPermitManagement />
          </TabsContent>
        </Tabs>
      );
    }

    // For teachers and admin, show approval interface
    return (
      <div className="space-y-6">
        <EnhancedPermitApproval />
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {hasRole('siswa') ? 'Perizinan Siswa' : 'Manajemen Perizinan'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {hasRole('siswa') 
              ? 'Ajukan permohonan izin dengan mudah dan pantau status persetujuan'
              : 'Kelola permohonan izin siswa dengan workflow persetujuan bertingkat'
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
