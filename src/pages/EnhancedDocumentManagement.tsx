import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DocumentRepositoryManager } from '@/components/documents/DocumentRepositoryManager';
import { DocumentWorkflowManager } from '@/components/documents/DocumentWorkflowManager';
import { DigitalSignaturePad } from '@/components/documents/DigitalSignaturePad';
import { AutoPDFGenerator } from '@/components/documents/AutoPDFGenerator';
import { VersionControlManager } from '@/components/documents/VersionControlManager';
import { LetterTemplateManager } from '@/components/letters/LetterTemplateManager';
import { LetterRequestForm } from '@/components/letters/LetterRequestForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

const EnhancedDocumentManagement = () => {
  const { hasRole } = useAuth();
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([]);
  const isAdmin = hasRole('admin');
  const isTeacher = hasRole('wali_kelas') || hasRole('waka_kesiswaan');

  // Fetch documents for digital signature
  React.useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await supabase
        .from('document_repository')
        .select('id, title, file_url, version_number')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      setSelectedDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  return (
    <AppLayout>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Dokumen & Surat Enhanced</h1>
            <p className="text-muted-foreground">
              Sistem lengkap dengan auto PDF generation, digital signatures, dan workflow approval
            </p>
          </div>

          <Tabs defaultValue={isAdmin ? "repository" : "letters"} className="w-full">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-6' : 'grid-cols-3'}`}>
              {isAdmin && <TabsTrigger value="repository">Repository</TabsTrigger>}
              {(isAdmin || isTeacher) && <TabsTrigger value="workflow">Workflow</TabsTrigger>}
              <TabsTrigger value="letters">Template Surat</TabsTrigger>
              <TabsTrigger value="request">Permohonan</TabsTrigger>
              {isAdmin && <TabsTrigger value="pdf">Auto PDF</TabsTrigger>}
              {(isAdmin || isTeacher) && <TabsTrigger value="signature">Tanda Tangan</TabsTrigger>}
              {isAdmin && <TabsTrigger value="version">Version Control</TabsTrigger>}
            </TabsList>

            {isAdmin && (
              <TabsContent value="repository" className="space-y-4">
                <DocumentRepositoryManager />
              </TabsContent>
            )}

            {(isAdmin || isTeacher) && (
              <TabsContent value="workflow" className="space-y-4">
                <DocumentWorkflowManager />
              </TabsContent>
            )}

            <TabsContent value="letters" className="space-y-4">
              <LetterTemplateManager />
            </TabsContent>

            <TabsContent value="request" className="space-y-4">
              <LetterRequestForm />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="pdf" className="space-y-4">
                <AutoPDFGenerator />
              </TabsContent>
            )}

            {(isAdmin || isTeacher) && (
              <TabsContent value="signature" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="sticky top-4">
                      <h3 className="text-lg font-medium mb-4">Pilih Dokumen</h3>
                      <div className="space-y-2">
                        {selectedDocuments.map((doc) => (
                          <button
                            key={doc.id}
                            className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
                            onClick={() => {
                              // Logic to select document for signing
                            }}
                          >
                            <div className="font-medium truncate">{doc.title}</div>
                            <div className="text-sm text-gray-500">v{doc.version_number}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <DigitalSignaturePad 
                      documentId={selectedDocuments[0]?.id || ''} 
                      documents={selectedDocuments}
                    />
                  </div>
                </div>
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value="version" className="space-y-4">
                <VersionControlManager />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DashboardLayout>
    </AppLayout>
  );
};

export default EnhancedDocumentManagement;