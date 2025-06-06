
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { DocumentRepository } from '@/components/documents/DocumentRepository';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentVersionHistory } from '@/components/documents/DocumentVersionHistory';
import { PolicyManager } from '@/components/documents/PolicyManager';
import { DocumentCategories } from '@/components/documents/DocumentCategories';

const DocumentRepositoryManagement = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Repositori Dokumen & Kebijakan</h1>
          <p className="text-muted-foreground">
            Kelola dokumen sekolah, kebijakan, dan panduan dengan sistem version control
          </p>
        </div>

        <Tabs defaultValue="repository" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="repository">Repositori</TabsTrigger>
            <TabsTrigger value="upload">Upload Dokumen</TabsTrigger>
            <TabsTrigger value="policies">Kebijakan</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
            <TabsTrigger value="versions">Version Control</TabsTrigger>
          </TabsList>

          <TabsContent value="repository" className="space-y-4">
            <DocumentRepository />
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <DocumentUpload />
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <PolicyManager />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <DocumentCategories />
          </TabsContent>

          <TabsContent value="versions" className="space-y-4">
            <DocumentVersionHistory />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default DocumentRepositoryManagement;
