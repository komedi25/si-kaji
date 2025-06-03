
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ActivityProposalForm } from '@/components/proposals/ActivityProposalForm';
import { FacilityBooking } from '@/components/proposals/FacilityBooking';
import { ActivityReport } from '@/components/proposals/ActivityReport';

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

          <Tabs defaultValue="proposal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="proposal">Buat Proposal</TabsTrigger>
              <TabsTrigger value="facilities">Peminjaman Fasilitas</TabsTrigger>
              <TabsTrigger value="report">LPJ & Dokumentasi</TabsTrigger>
            </TabsList>

            <TabsContent value="proposal" className="space-y-4">
              <ActivityProposalForm />
            </TabsContent>

            <TabsContent value="facilities" className="space-y-4">
              <FacilityBooking />
            </TabsContent>

            <TabsContent value="report" className="space-y-4">
              <ActivityReport />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AppLayout>
  );
};

export default ActivityProposal;
