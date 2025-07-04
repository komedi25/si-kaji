
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Plus, Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Proposal {
  id: string;
  proposal_number: string;
  title: string;
  description?: string;
  activity_type: string;
  start_date: string;
  end_date: string;
  status: string;
  submitted_at?: string;
  approved_at?: string;
  rejected_reason?: string;
  organizer_name?: string;
}

export const SimpleStudentProposals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchProposals();
    }
  }, [user]);

  const fetchProposals = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('activity_proposals')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data proposal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      submitted: 'secondary',
      under_review: 'default',
      approved: 'default',
      rejected: 'destructive',
      completed: 'outline'
    } as const;

    const labels = {
      draft: 'Draft',
      submitted: 'Disubmit',
      under_review: 'Sedang Ditinjau',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      completed: 'Selesai'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'under_review':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const labels = {
      osis: 'OSIS',
      ekstrakurikuler: 'Ekstrakurikuler',
      sekolah: 'Sekolah',
      lainnya: 'Lainnya'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Memuat data proposal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proposal Kegiatan Saya</h1>
          <p className="text-gray-600">Buat dan pantau status pengajuan proposal kegiatan Anda</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Buat Proposal
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Total Proposal</div>
                <div className="text-xl font-bold text-blue-600">
                  {proposals.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Disetujui</div>
                <div className="text-xl font-bold text-green-600">
                  {proposals.filter(p => p.status === 'approved').length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Sedang Ditinjau</div>
                <div className="text-xl font-bold text-yellow-600">
                  {proposals.filter(p => p.status === 'under_review').length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Ditolak</div>
                <div className="text-xl font-bold text-red-600">
                  {proposals.filter(p => p.status === 'rejected').length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Daftar Proposal</h3>
        
        {proposals.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Proposal</h3>
              <p className="text-gray-500 mb-4">Mulai buat proposal kegiatan yang ingin Anda selenggarakan</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Buat Proposal Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(proposal.status)}
                    <div>
                      <CardTitle className="text-lg">{proposal.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>#{proposal.proposal_number || 'Draft'}</span>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {getActivityTypeLabel(proposal.activity_type)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(proposal.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {proposal.description && (
                  <p className="text-sm text-gray-600">{proposal.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>
                      {format(new Date(proposal.start_date), 'dd MMM yyyy', { locale: id })} - 
                      {format(new Date(proposal.end_date), 'dd MMM yyyy', { locale: id })}
                    </span>
                  </div>
                  
                  {proposal.submitted_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Disubmit: {format(new Date(proposal.submitted_at), 'dd/MM/yyyy HH:mm', { locale: id })}</span>
                    </div>
                  )}
                </div>

                {proposal.rejected_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-red-700 font-medium flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Alasan Penolakan:
                    </div>
                    <div className="text-red-600 text-sm mt-1">{proposal.rejected_reason}</div>
                  </div>
                )}

                {proposal.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-green-700 text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Proposal Anda telah disetujui! Silakan lanjutkan persiapan kegiatan sesuai rencana.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
