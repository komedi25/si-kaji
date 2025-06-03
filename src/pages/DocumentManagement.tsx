
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LetterRequestForm } from '@/components/letters/LetterRequestForm';
import { StudentMutation } from '@/components/documents/StudentMutation';
import { LetterTemplates } from '@/components/documents/LetterTemplates';

const DocumentManagement = () => {
  return (
    <AppLayout>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Sistem Permohonan Surat & Mutasi</h1>
            <p className="text-muted-foreground">
              Kelola permohonan surat keterangan dan proses mutasi siswa
            </p>
          </div>

          <Tabs defaultValue="letters" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="letters">Permohonan Surat</TabsTrigger>
              <TabsTrigger value="mutations">Mutasi Siswa</TabsTrigger>
              <TabsTrigger value="templates">Template Surat</TabsTrigger>
            </TabsList>

            <TabsContent value="letters" className="space-y-4">
              <LetterRequestForm />
            </TabsContent>

            <TabsContent value="mutations" className="space-y-4">
              <StudentMutation />
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <LetterTemplates />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AppLayout>
  );
};

export default DocumentManagement;
