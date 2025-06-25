
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, FileText } from 'lucide-react';

interface PermitFormProps {
  studentId: string;
  onSuccess: () => void;
}

export const PermitForm = ({ studentId, onSuccess }: PermitFormProps) => {
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
      const { error } = await supabase
        .from('student_permits')
        .insert({
          student_id: studentId,
          ...formData,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Permohonan izin berhasil diajukan"
      });

      // Reset form
      setFormData({
        permit_type: '',
        reason: '',
        start_date: '',
        end_date: '',
        supporting_document_url: ''
      });

      onSuccess();
    } catch (error) {
      console.error('Error submitting permit:', error);
      toast({
        title: "Error",
        description: "Gagal mengajukan permohonan izin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Label htmlFor="supporting_document_url">Dokumen Pendukung (URL)</Label>
          <Input
            id="supporting_document_url"
            type="url"
            placeholder="https://..."
            value={formData.supporting_document_url}
            onChange={(e) => setFormData({...formData, supporting_document_url: e.target.value})}
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

      <Button type="submit" disabled={loading} className="w-full">
        <FileText className="h-4 w-4 mr-2" />
        {loading ? 'Mengajukan...' : 'Ajukan Permohonan'}
      </Button>
    </form>
  );
};
