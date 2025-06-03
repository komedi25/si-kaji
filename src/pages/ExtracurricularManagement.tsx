
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ExtracurricularEnrollment } from '@/components/extracurricular/ExtracurricularEnrollment';
import { CoachActivityLog } from '@/components/extracurricular/CoachActivityLog';
import { ExtracurricularManager } from '@/components/masterData/ExtracurricularManager';

const ExtracurricularManagement = () => {
  return (
    <AppLayout>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Ekstrakurikuler</h1>
            <p className="text-muted-foreground">
              Kelola ekstrakurikuler, pendaftaran siswa, dan jurnal kegiatan pelatih
            </p>
          </div>

          <Tabs defaultValue="enrollment" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="enrollment">Pendaftaran Siswa</TabsTrigger>
              <TabsTrigger value="activity-log">Jurnal Pelatih</TabsTrigger>
              <TabsTrigger value="master-data">Data Ekstrakurikuler</TabsTrigger>
              <TabsTrigger value="attendance">Presensi Pelatih</TabsTrigger>
            </TabsList>

            <TabsContent value="enrollment" className="space-y-4">
              <ExtracurricularEnrollment />
            </TabsContent>

            <TabsContent value="activity-log" className="space-y-4">
              <CoachActivityLog />
            </TabsContent>

            <TabsContent value="master-data" className="space-y-4">
              <ExtracurricularManager />
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Fitur presensi pelatih akan segera hadir</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AppLayout>
  );
};

export default ExtracurricularManagement;
