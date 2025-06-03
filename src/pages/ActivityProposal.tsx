
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ActivityProposalForm } from '@/components/proposals/ActivityProposalForm';

const ActivityProposal = () => {
  return (
    <AppLayout>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Sistem Perencanaan & Proposal Kegiatan</h1>
            <p className="text-muted-foreground">
              Kelola proposal kegiatan OSIS dan ekstrakurikuler dengan sistem persetujuan bertingkat
            </p>
          </div>
          <ActivityProposalForm />
        </div>
      </DashboardLayout>
    </AppLayout>
  );
};

export default ActivityProposal;
