
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, Save, Upload } from 'lucide-react';

export const PermitInputForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    permit_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    supporting_document_url: ''
  });

  const permitTypes = [
    { value: 'sick_leave', label: 'Izin Sakit' },
    { value: 'family_leave', label: 'Izin Keluarga' },
    { value: 'school_activity', label: 'Kegiatan Sekolah' },
    { value: 'other', label: 'Lainnya' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    // Validasi tanggal
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast({
        title: "Error",
        description: "Tanggal akhir tidak boleh lebih awal dari tanggal mulai",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Cari student berdasarkan user_id
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError) {
        throw new Error('Data siswa tidak ditemukan');
      }

      const { error } = await supabase
        .from('student_permits')
        .insert({
          student_id: studentData.id,
          ...formData
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pengajuan izin berhasil dikirim. Menunggu persetujuan."
      });

      // Reset form
      setFormData({
        permit_type: '',
        start_date: '',
        end_date: '',
        reason: '',
        supporting_document_url: ''
      });
    } catch (error) {
      console.error('Error submitting permit:', error);
      toast({
        title: "Error",
        description: "Gagal mengajukan izin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Pengajuan Izin Siswa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="permit_type">Jenis Izin</Label>
            <Select value={formData.permit_type} onValueChange={(value) => setFormData(prev => ({ ...prev, permit_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis izin..." />
              </SelectTrigger>
              <SelectContent>
                {permitTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Tanggal Mulai</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Tanggal Selesai</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Alasan Izin</Label>
            <Textarea
              id="reason"
              placeholder="Jelaskan alasan pengajuan izin..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              required
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supporting_document_url">Dokumen Pendukung (Opsional)</Label>
            <div className="flex gap-2">
              <Input
                id="supporting_document_url"
                type="url"
                placeholder="https://example.com/document.pdf"
                value={formData.supporting_document_url}
                onChange={(e) => setFormData(prev => ({ ...prev, supporting_document_url: e.target.value }))}
              />
              <Button type="button" variant="outline">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Mengirim...' : 'Ajukan Izin'}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Catatan:</strong> Pengajuan izin akan direview oleh wali kelas dan guru BK. Pastikan data yang diisi sudah benar.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
