import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, Clock, FileText, User, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type PermitApprovalStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

interface PermitApproval {
  id: string;
  permit_id: string;
  approver_role: string;
  approver_id: string | null;
  approval_order: number;
  status: PermitApprovalStatus;
  approved_at: string | null;
  notes: string | null;
  permit: {
    id: string;
    permit_type: string;
    reason: string;
    start_date: string;
    end_date: string;
    urgency_level: string;
    activity_location?: string;
    emergency_contact?: string;
    current_approval_stage: number;
    student: {
      full_name: string;
      nis: string;
      current_class?: { name: string };
    };
  };
}

export const PermitApprovalWorkflow = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permits, setPermits] = useState<PermitApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchPendingApprovals();
  }, [user]);

  const fetchPendingApprovals = async () => {
    if (!user?.id) return;

    try {
      // Get user roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!userRoles || userRoles.length === 0) {
        setLoading(false);
        return;
      }

      const roles = userRoles.map(r => r.role);

      // Fetch pending approvals for user's roles
      const { data, error } = await supabase
        .from('permit_approvals')
        .select(`
          *,
          permit:student_permits (
            id,
            permit_type,
            reason,
            start_date,
            end_date,
            urgency_level,
            activity_location,
            emergency_contact,
            current_approval_stage,
            student:students (
              full_name,
              nis,
              current_class:classes (name)
            )
          )
        `)
        .in('approver_role', roles)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter permits where current stage matches approval order and normalize the data
      const currentStagePermits = data?.filter(approval => 
        approval.permit?.current_approval_stage === approval.approval_order
      ).map(approval => ({
        ...approval,
        status: approval.status as PermitApprovalStatus,
        permit: {
          ...approval.permit,
          student: {
            ...approval.permit.student,
            // Handle current_class array from database and convert to single object
            current_class: Array.isArray(approval.permit.student.current_class) 
              ? approval.permit.student.current_class[0] 
              : approval.permit.student.current_class
          }
        }
      })) || [];

      setPermits(currentStagePermits);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data persetujuan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approvalId: string, permitId: string, status: 'approved' | 'rejected') => {
    if (!user?.id) return;

    setProcessingId(approvalId);
    try {
      const { error } = await supabase.rpc('process_permit_approval', {
        _permit_id: permitId,
        _approver_id: user.id,
        _status: status,
        _notes: reviewNotes[approvalId] || null
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Permohonan izin ${status === 'approved' ? 'disetujui' : 'ditolak'}`
      });

      // Refresh data
      fetchPendingApprovals();
      
      // Clear notes
      setReviewNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[approvalId];
        return newNotes;
      });

    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: "Error",
        description: "Gagal memproses persetujuan",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getPermitTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'sakit': 'Sakit',
      'izin_keluarga': 'Izin Keluarga',
      'dispensasi_akademik': 'Dispensasi Akademik',
      'kegiatan_eksternal': 'Kegiatan Eksternal',
      'izin_pulang_awal': 'Izin Pulang Awal',
      'kegiatan_setelah_jam_sekolah': 'Kegiatan Setelah Jam Sekolah',
      'keperluan_administrasi': 'Keperluan Administrasi',
      'lainnya': 'Lainnya'
    };
    return labels[type] || type;
  };

  const getUrgencyBadge = (level: string) => {
    const badges = {
      'low': <Badge className="bg-green-100 text-green-800">Rendah</Badge>,
      'normal': <Badge className="bg-blue-100 text-blue-800">Normal</Badge>,
      'high': <Badge className="bg-yellow-100 text-yellow-800">Tinggi</Badge>,
      'urgent': <Badge className="bg-red-100 text-red-800">Mendesak</Badge>
    };
    return badges[level as keyof typeof badges] || <Badge>Normal</Badge>;
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      'wali_kelas': 'Wali Kelas',
      'guru_bk': 'Guru BK',
      'waka_kesiswaan': 'Waka Kesiswaan'
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Persetujuan Izin Siswa ({permits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {permits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada permohonan izin yang menunggu persetujuan Anda</p>
            </div>
          ) : (
            <div className="space-y-6">
              {permits.map((approval) => (
                <Card key={approval.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {approval.permit.student.full_name} - {approval.permit.student.nis}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {approval.permit.student.current_class?.name} | 
                            Tahap: {getRoleLabel(approval.approver_role)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getUrgencyBadge(approval.permit.urgency_level)}
                          <Badge variant="outline">
                            {getPermitTypeLabel(approval.permit.permit_type)}
                          </Badge>
                        </div>
                      </div>

                      {/* Permit Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Calendar className="h-4 w-4" />
                            Periode
                          </div>
                          <p className="text-sm">
                            {format(new Date(approval.permit.start_date), 'dd MMM yyyy', { locale: id })} - 
                            {format(new Date(approval.permit.end_date), 'dd MMM yyyy', { locale: id })}
                          </p>
                        </div>
                        
                        {approval.permit.activity_location && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Lokasi Kegiatan</div>
                            <p className="text-sm">{approval.permit.activity_location}</p>
                          </div>
                        )}
                        
                        {approval.permit.emergency_contact && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Kontak Darurat</div>
                            <p className="text-sm">{approval.permit.emergency_contact}</p>
                          </div>
                        )}
                      </div>

                      {/* Reason */}
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Alasan:</div>
                        <p className="text-sm bg-white p-3 border rounded-lg">{approval.permit.reason}</p>
                      </div>

                      {/* Urgency Alert */}
                      {approval.permit.urgency_level === 'urgent' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium">Permohonan Mendesak</span>
                          </div>
                          <p className="text-sm text-red-600 mt-1">
                            Permohonan ini memerlukan perhatian prioritas dan proses persetujuan dipercepat.
                          </p>
                        </div>
                      )}

                      {/* Review Notes */}
                      <div>
                        <Label htmlFor={`notes-${approval.id}`}>Catatan Review (Opsional)</Label>
                        <Textarea
                          id={`notes-${approval.id}`}
                          placeholder="Berikan catatan atau komentar untuk keputusan Anda..."
                          value={reviewNotes[approval.id] || ''}
                          onChange={(e) => setReviewNotes(prev => ({
                            ...prev,
                            [approval.id]: e.target.value
                          }))}
                          className="mt-1"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          onClick={() => handleApproval(approval.id, approval.permit.id, 'approved')}
                          disabled={processingId === approval.id}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {processingId === approval.id ? 'Memproses...' : 'Setujui'}
                        </Button>
                        
                        <Button
                          variant="destructive"
                          onClick={() => handleApproval(approval.id, approval.permit.id, 'rejected')}
                          disabled={processingId === approval.id}
                          className="flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Tolak
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
