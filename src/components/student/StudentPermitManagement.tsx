
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
import { FileText, Plus, X, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface StudentPermit {
  id: string;
  permit_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: string;
  review_notes?: string;
  submitted_at: string;
}

export const StudentPermitManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permits, setPermits] = useState<StudentPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    permit_type: '',
    reason: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchStudentId();
  }, [user]);

  useEffect(() => {
    if (studentId) {
      fetchPermits();
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

  const fetchPermits = async () => {
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('student_permits')
        .select('*')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setPermits(data || []);
    } catch (error) {
      console.error('Error fetching permits:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data perizinan",
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
        .from('student_permits')
        .insert({
          student_id: studentId,
          permit_type: formData.permit_type,
          reason: formData.reason,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pengajuan izin berhasil disubmit"
      });

      setFormData({
        permit_type: '',
        reason: '',
        start_date: '',
        end_date: ''
      });
      setShowForm(false);
      fetchPermits();
    } catch (error) {
      console.error('Error submitting permit:', error);
      toast({
        title: "Error",
        description: "Gagal mengajukan izin",
        variant: "destructive"
      });
    }
  };

  const handleCancel = async (permitId: string) => {
    try {
      const { error } = await supabase
        .from('student_permits')
        .update({ status: 'cancelled' })
        .eq('id', permitId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pengajuan izin berhasil dibatalkan"
      });

      fetchPermits();
    } catch (error) {
      console.error('Error cancelling permit:', error);
      toast({
        title: "Error",
        description: "Gagal membatalkan pengajuan",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      cancelled: 'outline'
    } as const;

    const labels = {
      pending: 'Menunggu',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      cancelled: 'Dibatalkan'
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
        <h2 className="text-xl font-semibold">Perizinan Saya</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajukan Izin
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Form Pengajuan Izin</span>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="permit_type">Jenis Izin</Label>
                <select
                  id="permit_type"
                  className="w-full p-2 border rounded-md"
                  value={formData.permit_type}
                  onChange={(e) => setFormData({...formData, permit_type: e.target.value})}
                  required
                >
                  <option value="">Pilih jenis izin</option>
                  <option value="sakit">Sakit</option>
                  <option value="keluarga">Urusan Keluarga</option>
                  <option value="keperluan_penting">Keperluan Penting</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="start_date">Tanggal Mulai</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="end_date">Tanggal Selesai</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="reason">Alasan</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">Submit Pengajuan</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {permits.map((permit) => (
          <Card key={permit.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {permit.permit_type.charAt(0).toUpperCase() + permit.permit_type.slice(1).replace('_', ' ')}
                </span>
                {getStatusBadge(permit.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Periode:</strong> {format(new Date(permit.start_date), 'dd/MM/yyyy')} - {format(new Date(permit.end_date), 'dd/MM/yyyy')}
                </div>
                <div>
                  <strong>Diajukan:</strong> {format(new Date(permit.submitted_at), 'dd/MM/yyyy HH:mm', { locale: id })}
                </div>
              </div>
              
              <div>
                <strong>Alasan:</strong>
                <div className="mt-1 text-sm text-gray-600">
                  {permit.reason}
                </div>
              </div>
              
              {permit.review_notes && (
                <div>
                  <strong>Catatan Review:</strong>
                  <div className="mt-1 text-sm text-gray-600">
                    {permit.review_notes}
                  </div>
                </div>
              )}
              
              {permit.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancel(permit.id)}
                  >
                    Batalkan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {permits.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Belum ada pengajuan izin</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
