
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomeroomJournalForm } from '@/components/homeroom/HomeroomJournalForm';
import { HomeroomJournalList } from '@/components/homeroom/HomeroomJournalList';
import { StudentProgressTracking } from '@/components/homeroom/StudentProgressTracking';
import { ParentCommunicationLog } from '@/components/homeroom/ParentCommunicationLog';
import { ClassAnalytics } from '@/components/homeroom/ClassAnalytics';

const HomeroomJournalManagement = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sistem Jurnal Perwalian</h1>
          <p className="text-muted-foreground">
            Kelola jurnal digital wali kelas dan pantau perkembangan siswa secara komprehensif
          </p>
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="create">Buat Jurnal</TabsTrigger>
            <TabsTrigger value="list">Daftar Jurnal</TabsTrigger>
            <TabsTrigger value="progress">Progres Siswa</TabsTrigger>
            <TabsTrigger value="communication">Komunikasi Ortu</TabsTrigger>
            <TabsTrigger value="analytics">Analisis Kelas</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <HomeroomJournalForm />
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <HomeroomJournalList />
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <StudentProgressTracking />
          </TabsContent>

          <TabsContent value="communication" className="space-y-4">
            <ParentCommunicationLog />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <ClassAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default HomeroomJournalManagement;
