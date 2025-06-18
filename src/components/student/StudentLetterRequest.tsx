
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Plus, X, Download } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface LetterRequest {
  id: string;
  request_number: string;
  letter_type: string;
  purpose: string;
  status: string;
  additional_notes?: string;
  letter_url?: string;
  created_at: string;
  processed_at?: string;
}

export const StudentLetterRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<LetterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    letter_type: '',
    purpose: '',
    additional_notes: ''
  });

  useEffect(() => {
    fetchStudentId();
  }, [user]);

  useEffect(() => {
    if (studentId) {
      fetchRequests();
    }
  }, [studentId]);

  const fetchStudentId = async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setStudentId(data.id);
    }
  };

  const fetchRequests = async () => {
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('letter_requests')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching letter requests:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data permohonan surat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    try {
      const { error } = await supabase
        .from('letter_requests')
        .insert({
          student_id: studentId,
          letter_type: formData.letter_type,
          purpose: formData.purpose,
          additional_notes: formData.additional_notes,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Permohonan surat berhasil disubmit"
      });

      setFormData({
        letter_type: '',
        purpose: '',
        additional_notes: ''
      });
      setShowForm(false);
      fetchRequests();
    } catch (error) {
      console.error('Error submitting letter request:', error);
      toast({
        title: "Error",
        description: "Gagal mengajukan permohonan surat",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      ready: 'outline',
      completed: 'default',
      rejected: 'destructive'
    } as const;

    const labels = {
      pending: 'Menunggu',
      processing: 'Diproses',
      ready: 'Siap Diambil',
      completed: 'Selesai',
      rejected: 'Ditolak'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Permohonan Surat</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajukan Surat
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Form Permohonan Surat</span>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="letter_type">Jenis Surat</Label>
                <select
                  id="letter_type"
                  className="w-full p-2 border rounded-md"
                  value={formData.letter_type}
                  onChange={(e) => setFormData({...formData, letter_type: e.target.value})}
                  required
                >
                  <option value="">Pilih jenis surat</option>
                  <option value="keterangan_aktif">Surat Keterangan Siswa Aktif</option>
                  <option value="keterangan_berkelakuan_baik">Surat Keterangan Berkelakuan Baik</option>
                  <option value="rekomendasi">Surat Rekomendasi</option>
                  <option value="keterangan_lulus">Surat Keterangan Lulus</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="purpose">Keperluan</Label>
                <Textarea
                  id="purpose"
                  placeholder="Jelaskan keperluan surat ini..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="additional_notes">Catatan Tambahan (Opsional)</Label>
                <Textarea
                  id="additional_notes"
                  placeholder="Tambahkan catatan jika diperlukan..."
                  value={formData.additional_notes}
                  onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">Submit Permohonan</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {request.request_number}
                </span>
                {getStatusBadge(request.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Jenis Surat:</strong> {request.letter_type.replace('_', ' ').toUpperCase()}
                </div>
                <div>
                  <strong>Tanggal Pengajuan:</strong> {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: id })}
                </div>
                {request.processed_at && (
                  <div>
                    <strong>Tanggal Diproses:</strong> {format(new Date(request.processed_at), 'dd/MM/yyyy HH:mm', { locale: id })}
                  </div>
                )}
              </div>
              
              <div>
                <strong>Keperluan:</strong>
                <div className="mt-1 text-sm text-gray-600">
                  {request.purpose}
                </div>
              </div>
              
              {request.additional_notes && (
                <div>
                  <strong>Catatan:</strong>
                  <div className="mt-1 text-sm text-gray-600">
                    {request.additional_notes}
                  </div>
                </div>
              )}
              
              {request.letter_url && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(request.letter_url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Unduh Surat
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {requests.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Belum ada permohonan surat</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
