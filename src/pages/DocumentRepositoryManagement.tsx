
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentRepository } from '@/components/documents/DocumentRepository';
import { DocumentVersionHistory } from '@/components/documents/DocumentVersionHistory';

const DocumentRepositoryManagement = () => {
  return (
    <AppLayout>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Repositori Dokumen</h1>
            <p className="text-muted-foreground">
              Kelola dokumen kebijakan, prosedur, dan panduan dengan version control
            </p>
          </div>

          <Tabs defaultValue="repository" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="repository">Repositori</TabsTrigger>
              <TabsTrigger value="upload">Upload Dokumen</TabsTrigger>
              <TabsTrigger value="versions">Version Control</TabsTrigger>
            </TabsList>

            <TabsContent value="repository" className="space-y-4">
              <DocumentRepository />
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <DocumentUpload />
            </TabsContent>

            <TabsContent value="versions" className="space-y-4">
              <DocumentVersionHistory />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AppLayout>
  );
};

export default DocumentRepositoryManagement;
