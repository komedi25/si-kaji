
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Eye, FileText } from 'lucide-react';

interface StudentPermit {
  id: string;
  permit_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  supporting_document_url?: string;
  student?: {
    full_name: string;
    nis: string;
  };
}

export const PermitApproval = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permits, setPermits] = useState<StudentPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPermit, setSelectedPermit] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchPendingPermits();
  }, []);

  const fetchPendingPermits = async () => {
    const { data, error } = await supabase
      .from('student_permits')
      .select(`
        *,
        student:students(full_name, nis)
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching permits:', error);
    } else {
      setPermits(data || []);
    }
    setLoading(false);
  };

  const handleApproval = async (permitId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('student_permits')
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null
        })
        .eq('id', permitId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Izin ${status === 'approved' ? 'disetujui' : 'ditolak'}`
      });

      fetchPendingPermits();
      setSelectedPermit(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error updating permit:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status izin",
        variant: "destructive"
      });
    }
  };

  const getPermitTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      sick_leave: 'Izin Sakit',
      family_leave: 'Izin Keluarga',
      school_activity: 'Kegiatan Sekolah',
      other: 'Lainnya'
    };
    return types[type] || type;
  };

  if (loading) {
    return <div>Memuat data persetujuan izin...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Persetujuan Izin Siswa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {permits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Tidak ada izin yang menunggu persetujuan
            </p>
          ) : (
            permits.map((permit) => (
              <div key={permit.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">
                      {permit.student?.full_name} - {permit.student?.nis}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {getPermitTypeLabel(permit.permit_type)}
                    </p>
                  </div>
                  <Badge variant="secondary">Menunggu Review</Badge>
                </div>
                
                <p className="text-sm">{permit.reason}</p>
                
                <div className="text-xs text-muted-foreground">
                  Periode: {new Date(permit.start_date).toLocaleDateString('id-ID')} - {new Date(permit.end_date).toLocaleDateString('id-ID')}
                </div>

                {permit.supporting_document_url && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={permit.supporting_document_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4 mr-1" />
                        Lihat Dokumen
                      </a>
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedPermit(permit.id)}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Review
                  </Button>
                </div>

                {selectedPermit === permit.id && (
                  <div className="space-y-3 pt-3 border-t">
                    <Textarea
                      placeholder="Catatan review (opsional)..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => handleApproval(permit.id, 'approved')}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Setujui
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleApproval(permit.id, 'rejected')}
                        className="flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Tolak
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedPermit(null);
                          setReviewNotes('');
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
