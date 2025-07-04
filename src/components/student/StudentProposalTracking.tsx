import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStudentDetails } from '@/hooks/useStudentData';
import { FileText, Calendar, Clock, User, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { StudentActivityProposalForm } from './StudentActivityProposalForm';
import { StudentDataError } from './StudentDataError';

interface ActivityProposal {
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

export const StudentProposalTracking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: studentData, isLoading: studentLoading, error: studentError, refetch } = useStudentDetails(user?.id || null);
  const [proposals, setProposals] = useState<ActivityProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

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

  const getActivityTypeLabel = (type: string) => {
    const labels = {
      osis: 'OSIS',
      ekstrakurikuler: 'Ekstrakurikuler',
      sekolah: 'Sekolah',
      lainnya: 'Lainnya'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (studentLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (studentError || !studentData) {
    return <StudentDataError error={studentError instanceof Error ? studentError.message : String(studentError || 'Unknown error')} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2">Proposal Kegiatan</h2>
          <p className="text-gray-600">
            Buat dan pantau status pengajuan proposal kegiatan Anda
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showForm ? 'Tutup Form' : 'Buat Proposal'}
        </Button>
      </div>

      {showForm && (
        <div>
          <StudentActivityProposalForm />
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Status Proposal Saya</h3>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : proposals.length > 0 ? (
          proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {proposal.proposal_number || 'Draft'}
                  </span>
                  {getStatusBadge(proposal.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-lg">{proposal.title}</h4>
                  {proposal.description && (
                    <p className="text-sm text-gray-600 mt-1">{proposal.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Jenis: {getActivityTypeLabel(proposal.activity_type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(proposal.start_date), 'dd MMM yyyy', { locale: id })} - 
                      {format(new Date(proposal.end_date), 'dd MMM yyyy', { locale: id })}
                    </span>
                  </div>
                  {proposal.organizer_name && (
                    <div>
                      <strong>Penyelenggara:</strong> {proposal.organizer_name}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {proposal.submitted_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Disubmit: {format(new Date(proposal.submitted_at), 'dd/MM/yyyy HH:mm', { locale: id })}</span>
                    </div>
                  )}
                  {proposal.approved_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Disetujui: {format(new Date(proposal.approved_at), 'dd/MM/yyyy HH:mm', { locale: id })}</span>
                    </div>
                  )}
                </div>

                {proposal.rejected_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-red-700 font-medium">Alasan Penolakan:</div>
                    <div className="text-red-600 text-sm mt-1">{proposal.rejected_reason}</div>
                  </div>
                )}

                {proposal.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-green-700 text-sm">
                      ✅ Proposal Anda telah disetujui! Silakan lanjutkan persiapan kegiatan sesuai rencana.
                    </div>
                  </div>
                )}

                {proposal.status === 'under_review' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-blue-700 text-sm">
                      🔍 Proposal sedang dalam proses peninjauan. Mohon tunggu konfirmasi lebih lanjut.
                    </div>
                  </div>
                )}

                {proposal.status === 'draft' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-yellow-700 text-sm">
                      📝 Proposal masih dalam status draft. Lengkapi dan submit untuk review.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Belum ada proposal kegiatan yang dibuat</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
