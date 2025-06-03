
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react';

interface ProposalApproval {
  id: string;
  proposal_id: string;
  approval_order: number;
  approver_role: string;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  notes: string | null;
}

interface ActivityProposal {
  id: string;
  title: string;
  organizer_name: string;
  status: string;
  created_at: string;
}

interface ProposalApprovalWorkflowProps {
  proposalId: string;
}

export const ProposalApprovalWorkflow = ({ proposalId }: ProposalApprovalWorkflowProps) => {
  const [proposal, setProposal] = useState<ActivityProposal | null>(null);
  const [approvals, setApprovals] = useState<ProposalApproval[]>([]);
  const [currentUserApproval, setCurrentUserApproval] = useState<ProposalApproval | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProposal();
    fetchApprovals();
  }, [proposalId]);

  const fetchProposal = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_proposals')
        .select('id, title, organizer_name, status, created_at')
        .eq('id', proposalId)
        .single();

      if (error) throw error;
      setProposal(data);
    } catch (error) {
      console.error('Error fetching proposal:', error);
      toast.error('Gagal memuat data proposal');
    }
  };

  const fetchApprovals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('proposal_approvals')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('approval_order');

      if (error) throw error;
      
      // Cast the data to match our interface
      const typedData = (data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected'
      }));
      
      setApprovals(typedData);

      // Find current user's approval
      const userApproval = typedData.find(a => a.approver_id === user.id);
      setCurrentUserApproval(userApproval || null);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Gagal memuat data persetujuan');
    }
  };

  const handleApproval = async (status: 'approved' | 'rejected') => {
    if (!currentUserApproval) return;

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('process_proposal_approval', {
        _proposal_id: proposalId,
        _approver_id: user.id,
        _status: status,
        _notes: notes || null
      });

      if (error) throw error;

      toast.success(`Proposal berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`);
      setNotes('');
      fetchProposal();
      fetchApprovals();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Gagal memproses persetujuan');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'pending' ? 'Menunggu' : status === 'approved' ? 'Disetujui' : 'Ditolak'}
      </Badge>
    );
  };

  if (!proposal) {
    return <div>Loading...</div>;
  }

  const canApprove = currentUserApproval && 
    currentUserApproval.status === 'pending' && 
    proposal.status === 'submitted';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {proposal.title}
          </CardTitle>
          <CardDescription>
            Diajukan oleh: {proposal.organizer_name} • 
            Status: {getStatusBadge(proposal.status)}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alur Persetujuan</CardTitle>
          <CardDescription>
            Track progress persetujuan proposal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {approvals.map((approval, index) => (
              <div key={approval.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {getStatusIcon(approval.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{approval.approver_role}</span>
                      <span className="text-sm text-muted-foreground">
                        (Tahap {approval.approval_order})
                      </span>
                    </div>
                    {getStatusBadge(approval.status)}
                  </div>
                  {approval.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{approval.notes}</p>
                  )}
                  {approval.approved_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(approval.approved_at).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {canApprove && (
        <Card>
          <CardHeader>
            <CardTitle>Tindakan Persetujuan</CardTitle>
            <CardDescription>
              Berikan persetujuan atau tolak proposal ini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Catatan (opsional)</label>
              <Textarea
                placeholder="Berikan catatan atau alasan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => handleApproval('approved')}
                disabled={processing}
                className="flex-1"
              >
                {processing ? 'Memproses...' : 'Setujui'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleApproval('rejected')}
                disabled={processing}
                className="flex-1"
              >
                {processing ? 'Memproses...' : 'Tolak'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
