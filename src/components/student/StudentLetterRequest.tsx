
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface LetterRequest {
  id: string;
  request_number: string;
  letter_type: string;
  purpose: string;
  additional_notes: string;
  status: string;
  letter_url?: string;
  created_at: string;
  processed_at?: string;
}

export const StudentLetterRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<LetterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    letter_type: '',
    purpose: '',
    additional_notes: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      // Get student data first
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError) throw studentError;

      const { data, error } = await supabase
        .from('letter_requests')
        .select('*')
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data permohonan surat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRequestNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SR${year}${month}${day}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      // Get student data
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError) throw studentError;

      const { error } = await supabase
        .from('letter_requests')
        .insert({
          student_id: studentData.id,
          request_number: generateRequestNumber(),
          letter_type: formData.letter_type,
          purpose: formData.purpose,
          additional_notes: formData.additional_notes,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Permohonan surat berhasil diajukan"
      });

      setFormData({
        letter_type: '',
        purpose: '',
        additional_notes: ''
      });

      fetchRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Gagal mengajukan permohonan surat",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const },
      processing: { label: 'Diproses', variant: 'default' as const },
      completed: { label: 'Selesai', variant: 'default' as const },
      rejected: { label: 'Ditolak', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? <Badge variant={config.variant}>{config.label}</Badge> : null;
  };

  const getLetterTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      active_student: 'Surat Keterangan Aktif Kuliah',
      good_conduct: 'Surat Kelakuan Baik',
      graduation: 'Surat Keterangan Lulus',
      transfer: 'Surat Pindah Sekolah',
      other: 'Lainnya'
    };
    return types[type] || type;
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
            <FileText className="w-5 h-5" />
            Permohonan Surat Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="letter_type">Jenis Surat</Label>
              <Select value={formData.letter_type} onValueChange={(value) => setFormData({ ...formData, letter_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis surat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active_student">Surat Keterangan Aktif Siswa</SelectItem>
                  <SelectItem value="good_conduct">Surat Kelakuan Baik</SelectItem>
                  <SelectItem value="graduation">Surat Keterangan Lulus</SelectItem>
                  <SelectItem value="transfer">Surat Pindah Sekolah</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="purpose">Tujuan Penggunaan</Label>
              <Input
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Contoh: Untuk keperluan beasiswa, pendaftaran kuliah, dll"
                required
              />
            </div>

            <div>
              <Label htmlFor="additional_notes">Catatan Tambahan</Label>
              <Textarea
                id="additional_notes"
                value={formData.additional_notes}
                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                placeholder="Catatan atau keterangan tambahan (opsional)"
              />
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Mengajukan...' : 'Ajukan Permohonan'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Permohonan Surat</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Belum ada permohonan surat
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{getLetterTypeLabel(request.letter_type)}</h4>
                      <p className="text-sm text-muted-foreground">
                        No. {request.request_number}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <p className="text-sm"><strong>Tujuan:</strong> {request.purpose}</p>
                  
                  {request.additional_notes && (
                    <p className="text-sm"><strong>Catatan:</strong> {request.additional_notes}</p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Diajukan: {format(new Date(request.created_at), 'dd MMMM yyyy HH:mm', { locale: localeId })}
                    {request.processed_at && (
                      <>
                        {' • '}
                        Diproses: {format(new Date(request.processed_at), 'dd MMMM yyyy HH:mm', { locale: localeId })}
                      </>
                    )}
                  </div>

                  {request.letter_url && (
                    <div className="pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={request.letter_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2" />
                          Download Surat
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
