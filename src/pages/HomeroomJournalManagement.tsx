
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { HomeroomJournalForm } from '@/components/homeroom/HomeroomJournalForm';
import { HomeroomJournalList } from '@/components/homeroom/HomeroomJournalList';
import { StudentEntryForm } from '@/components/homeroom/StudentEntryForm';

const HomeroomJournalManagement = () => {
  return (
    <AppLayout>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Sistem Jurnal Perwalian</h1>
            <p className="text-muted-foreground">
              Kelola jurnal digital wali kelas dan catatan siswa terintegrasi
            </p>
          </div>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create">Buat Jurnal</TabsTrigger>
              <TabsTrigger value="list">Daftar Jurnal</TabsTrigger>
              <TabsTrigger value="students">Catatan Siswa</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <HomeroomJournalForm />
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <HomeroomJournalList />
            </TabsContent>

            <TabsContent value="students" className="space-y-4">
              <StudentEntryForm />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AppLayout>
  );
};

export default HomeroomJournalManagement;
