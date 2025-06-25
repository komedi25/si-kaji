
import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SimpleStudentProposal } from '@/components/student/SimpleStudentProposal';
import { ProposalApprovalWorkflow } from '@/components/proposals/ProposalApprovalWorkflow';
import { useAuth } from '@/hooks/useAuth';

const ActivityProposal = () => {
  const { hasRole } = useAuth();

  const renderContent = () => {
    // If user is a student, show simplified proposal form
    if (hasRole('siswa')) {
      return (
        <div className="max-w-2xl mx-auto">
          <SimpleStudentProposal />
        </div>
      );
    }

    // For admin and teachers, show the management interface
    return <ProposalApprovalWorkflow />;
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {hasRole('siswa') ? 'Proposal Kegiatan Saya' : 'Manajemen Proposal Kegiatan'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {hasRole('siswa') 
              ? 'Ajukan proposal kegiatan dengan mudah'
              : 'Kelola dan setujui proposal kegiatan siswa'
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

export default ActivityProposal;
