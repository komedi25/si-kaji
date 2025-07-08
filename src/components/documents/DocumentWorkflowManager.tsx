import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  FileCheck, Clock, CheckCircle, XCircle, 
  MessageCircle, User, Calendar, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface WorkflowStep {
  id: string;
  document_id: string;
  workflow_step: number;
  approver_role: string;
  approver_id: string | null;
  status: string;
  comments: string | null;
  approved_at: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface Document {
  id: string;
  title: string;
  category: string;
  version_number: number;
  created_at: string;
}

export const DocumentWorkflowManager = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<WorkflowStep[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowStep | null>(null);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchWorkflows();
      fetchDocuments();
    }
  }, [user]);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('document_workflows')
        .select(`
          *,
          profiles:approver_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('document_repository')
        .select('id, title, category, version_number, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveWorkflowStep = async (workflowId: string, status: string) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('approve_workflow_step', {
        _workflow_id: workflowId,
        _approver_id: user?.id,
        _status: status,
        _comments: comments || null
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Workflow ${status === 'approved' ? 'disetujui' : 'ditolak'}`
      });

      setSelectedWorkflow(null);
      setComments('');
      fetchWorkflows();
    } catch (error) {
      console.error('Error processing workflow:', error);
      toast({
        title: "Error",
        description: "Gagal memproses workflow",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const createDocumentWorkflow = async (documentId: string) => {
    try {
      const workflowSteps = [
        { step: 1, role: 'wali_kelas' },
        { step: 2, role: 'waka_kesiswaan' },
        { step: 3, role: 'admin' }
      ];

      const { error } = await supabase.rpc('create_document_workflow', {
        _document_id: documentId,
        _workflow_steps: workflowSteps
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Workflow dokumen berhasil dibuat"
      });

      fetchWorkflows();
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Error",
        description: "Gagal membuat workflow",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending_review':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileCheck className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      wali_kelas: 'Wali Kelas',
      waka_kesiswaan: 'Waka Kesiswaan',
      admin: 'Administrator',
      guru_bk: 'Guru BK'
    };
    return labels[role] || role;
  };

  const canApprove = (workflow: WorkflowStep) => {
    return hasRole(workflow.approver_role) && workflow.status === 'pending_review';
  };

  const getDocumentTitle = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    return doc?.title || 'Dokumen Tidak Diketahui';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workflow List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Approval Workflow Dokumen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {workflows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada workflow dokumen</p>
                </div>
              ) : (
                workflows.map((workflow) => (
                  <div key={workflow.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {getDocumentTitle(workflow.document_id)}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            Step {workflow.workflow_step}
                          </Badge>
                          <Badge variant="outline">
                            {getRoleLabel(workflow.approver_role)}
                          </Badge>
                          <Badge className={getStatusColor(workflow.status)}>
                            {getStatusIcon(workflow.status)}
                            <span className="ml-1">
                              {workflow.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </Badge>
                        </div>
                      </div>
                      
                      {canApprove(workflow) && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedWorkflow(workflow)}
                        >
                          Review
                        </Button>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Dibuat: {format(new Date(workflow.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                        </span>
                      </div>
                      
                      {workflow.approved_at && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>
                            Disetujui: {format(new Date(workflow.approved_at), 'dd MMM yyyy HH:mm', { locale: id })}
                          </span>
                        </div>
                      )}
                      
                      {workflow.profiles?.full_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Oleh: {workflow.profiles.full_name}</span>
                        </div>
                      )}
                      
                      {workflow.comments && (
                        <div className="flex items-start gap-2 mt-2">
                          <MessageCircle className="h-4 w-4 mt-0.5" />
                          <span className="text-sm bg-gray-50 p-2 rounded">
                            {workflow.comments}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Documents without workflow */}
      {hasRole('admin') && (
        <Card>
          <CardHeader>
            <CardTitle>Dokumen Tanpa Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents
                .filter(doc => !workflows.some(w => w.document_id === doc.id))
                .slice(0, 5)
                .map((document) => (
                  <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{document.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{document.category}</Badge>
                        <Badge variant="secondary">v{document.version_number}</Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => createDocumentWorkflow(document.id)}
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Buat Workflow
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Review Dokumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">
                  {getDocumentTitle(selectedWorkflow.document_id)}
                </h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Step {selectedWorkflow.workflow_step}
                  </Badge>
                  <Badge variant="outline">
                    {getRoleLabel(selectedWorkflow.approver_role)}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Komentar (Opsional)
                </label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Tambahkan komentar untuk keputusan ini..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => approveWorkflowStep(selectedWorkflow.id, 'approved')}
                  disabled={processing}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Setujui
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => approveWorkflowStep(selectedWorkflow.id, 'rejected')}
                  disabled={processing}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Tolak
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => setSelectedWorkflow(null)}
                className="w-full"
              >
                Batal
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};