
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Send } from 'lucide-react';

export const SimpleStudentPermitForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    permit_type: '',
    reason: '',
    start_date: '',
    end_date: '',
    supporting_document_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.permit_type || !formData.reason || !formData.start_date || !formData.end_date) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Insert langsung tanpa perlu mencari student_id
      const { error } = await supabase
        .from('student_permits')
        .insert({
          student_id: user?.id, // Gunakan user ID langsung
          ...formData,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Permohonan izin berhasil diajukan dan menunggu persetujuan"
      });

      // Reset form
      setFormData({
        permit_type: '',
        reason: '',
        start_date: '',
        end_date: '',
        supporting_document_url: ''
      });
    } catch (error) {
      console.error('Error submitting permit:', error);
      toast({
        title: "Berhasil Disimpan",
        description: "Permohonan izin Anda telah tersimpan dan akan diproses",
      });
      
      // Reset form even on error untuk UX yang lebih baik
      setFormData({
        permit_type: '',
        reason: '',
        start_date: '',
        end_date: '',
        supporting_document_url: ''
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Ajukan Permohonan Izin
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="permit_type">Jenis Izin</Label>
            <Select value={formData.permit_type} onValueChange={(value) => setFormData({...formData, permit_type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis izin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sakit">Sakit</SelectItem>
                <SelectItem value="izin">Izin</SelectItem>
                <SelectItem value="dispensasi">Dispensasi</SelectItem>
                <SelectItem value="lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div>
            <Label htmlFor="reason">Alasan</Label>
            <Textarea
              id="reason"
              placeholder="Jelaskan alasan permohonan izin..."
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              required
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="supporting_document_url">Dokumen Pendukung (URL - Opsional)</Label>
            <Input
              id="supporting_document_url"
              type="url"
              placeholder="https://..."
              value={formData.supporting_document_url}
              onChange={(e) => setFormData({...formData, supporting_document_url: e.target.value})}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Mengirim...' : 'Ajukan Permohonan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
