import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  History, FileText, Eye, Download, 
  GitBranch, Calendar, User, FileIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  changes_description: string | null;
  change_type: string;
  is_major_version: boolean;
  parent_version_id: string | null;
  uploaded_by: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface Document {
  id: string;
  title: string;
  version_number: number;
  created_at: string;
}

interface VersionControlManagerProps {
  documentId?: string;
}

export const VersionControlManager: React.FC<VersionControlManagerProps> = ({ 
  documentId 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>(documentId || '');
  const [loading, setLoading] = useState(true);
  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null);

  useEffect(() => {
    fetchDocuments();
    if (selectedDocument) {
      fetchVersions(selectedDocument);
    }
  }, [selectedDocument]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('document_repository')
        .select('id, title, version_number, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchVersions = async (docId: string) => {
    if (!docId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select(`
          *,
          profiles:uploaded_by (
            full_name
          )
        `)
        .eq('document_id', docId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewVersion = async (
    docId: string, 
    fileUrl: string, 
    description: string,
    isMajor: boolean = false
  ) => {
    try {
      const { data, error } = await supabase.rpc('create_document_version', {
        _document_id: docId,
        _file_url: fileUrl,
        _changes_description: description,
        _change_type: 'manual',
        _is_major_version: isMajor
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Versi dokumen baru berhasil dibuat"
      });

      fetchVersions(docId);
    } catch (error) {
      console.error('Error creating version:', error);
      toast({
        title: "Error",
        description: "Gagal membuat versi baru",
        variant: "destructive"
      });
    }
  };

  const restoreVersion = async (versionId: string, docId: string) => {
    try {
      const version = versions.find(v => v.id === versionId);
      if (!version) return;

      // Create new version based on the restored one
      await createNewVersion(
        docId,
        version.file_url,
        `Restored from version ${version.version_number}`,
        true
      );

      toast({
        title: "Berhasil",
        description: `Dokumen dipulihkan ke versi ${version.version_number}`
      });
    } catch (error) {
      console.error('Error restoring version:', error);
      toast({
        title: "Error",
        description: "Gagal memulihkan versi",
        variant: "destructive"
      });
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'auto_save':
        return <GitBranch className="h-4 w-4 text-blue-500" />;
      case 'approval':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'signature':
        return <FileIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'auto_save':
        return 'bg-blue-100 text-blue-700';
      case 'approval':
        return 'bg-green-100 text-green-700';
      case 'signature':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    const labels = {
      manual: 'Manual',
      auto_save: 'Auto Save',
      approval: 'Approval',
      signature: 'Signature'
    };
    return labels[changeType] || changeType;
  };

  const selectedDoc = documents.find(d => d.id === selectedDocument);

  return (
    <div className="space-y-6">
      {/* Document Selector */}
      {!documentId && (
        <Card>
          <CardHeader>
            <CardTitle>Pilih Dokumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {documents.map((doc) => (
                <Button
                  key={doc.id}
                  variant={selectedDocument === doc.id ? "default" : "outline"}
                  onClick={() => setSelectedDocument(doc.id)}
                  className="justify-start h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-medium truncate">{doc.title}</div>
                    <div className="text-sm opacity-70">v{doc.version_number}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version Control */}
      {selectedDocument && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version Control: {selectedDoc?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="versions" className="w-full">
              <TabsList>
                <TabsTrigger value="versions">Riwayat Versi</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="versions" className="space-y-4">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {loading ? (
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    ) : versions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada riwayat versi</p>
                      </div>
                    ) : (
                      versions.map((version, index) => (
                        <div key={version.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge 
                                  variant={version.is_major_version ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  v{version.version_number}
                                  {version.is_major_version && ' (Major)'}
                                  {index === 0 && ' (Current)'}
                                </Badge>
                                <Badge 
                                  className={getChangeTypeColor(version.change_type)}
                                  variant="outline"
                                >
                                  {getChangeTypeIcon(version.change_type)}
                                  <span className="ml-1">
                                    {getChangeTypeLabel(version.change_type)}
                                  </span>
                                </Badge>
                              </div>
                              
                              <div className="text-sm space-y-1">
                                {version.changes_description && (
                                  <div className="text-gray-700">
                                    {version.changes_description}
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-4 text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {format(new Date(version.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                    </span>
                                  </div>
                                  
                                  {version.profiles?.full_name && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      <span>{version.profiles.full_name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPreviewVersion(version)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Preview Versi {version.version_number}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="text-sm">
                                      <div className="font-medium">Perubahan:</div>
                                      <div className="text-muted-foreground">
                                        {version.changes_description || 'Tidak ada deskripsi'}
                                      </div>
                                    </div>
                                    
                                    <Button
                                      onClick={() => window.open(version.file_url, '_blank')}
                                      className="w-full"
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Buka File
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              {index !== 0 && (
                                <Button
                                  size="sm"
                                  onClick={() => restoreVersion(version.id, selectedDocument)}
                                >
                                  Restore
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <div className="relative">
                  {versions.map((version, index) => (
                    <div key={version.id} className="relative flex items-start pb-6">
                      {/* Timeline line */}
                      {index !== versions.length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200"></div>
                      )}
                      
                      {/* Timeline dot */}
                      <div className={`
                        relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white
                        ${version.is_major_version ? 'border-blue-500' : 'border-gray-300'}
                      `}>
                        {getChangeTypeIcon(version.change_type)}
                      </div>
                      
                      {/* Timeline content */}
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            Versi {version.version_number}
                          </span>
                          {version.is_major_version && (
                            <Badge variant="default" className="text-xs">Major</Badge>
                          )}
                          {index === 0 && (
                            <Badge variant="outline" className="text-xs">Current</Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-1">
                          {version.changes_description || 'Tidak ada deskripsi perubahan'}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(version.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                          {version.profiles?.full_name && ` • ${version.profiles.full_name}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};