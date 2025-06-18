
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ActivityProposalForm } from '@/components/proposals/ActivityProposalForm';
import { FacilityBooking } from '@/components/proposals/FacilityBooking';
import { ActivityReport } from '@/components/proposals/ActivityReport';
import { StudentProposalTracking } from '@/components/student/StudentProposalTracking';
import { useAuth } from '@/hooks/useAuth';

const ActivityProposal = () => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('proposal');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const renderContent = () => {
    // If user is a student, show their proposal tracking
    if (hasRole('siswa')) {
      switch (activeTab) {
        case 'student-proposal':
        case 'tracking':
          return <StudentProposalTracking />;
        case 'proposal':
          return <ActivityProposalForm />;
        default:
          return <StudentProposalTracking />;
      }
    }

    // For other roles, show the management views
    switch (activeTab) {
      case 'proposal':
        return <ActivityProposalForm />;
      case 'facilities':
        return <FacilityBooking />;
      case 'report':
        return <ActivityReport />;
      default:
        return <ActivityProposalForm />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {hasRole('siswa') ? 'Proposal Kegiatan Saya' : 'Sistem Perencanaan & Proposal Kegiatan'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {hasRole('siswa') 
              ? 'Pantau status pengajuan proposal kegiatan Anda'
              : 'Kelola proposal kegiatan OSIS dan ekstrakurikuler dengan sistem persetujuan bertingkat'
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
