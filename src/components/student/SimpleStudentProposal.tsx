
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

export const SimpleStudentProposal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    activity_type: '',
    start_date: '',
    end_date: '',
    organizer_name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.activity_type || !formData.start_date || !formData.end_date) {
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
        .from('activity_proposals')
        .insert({
          organizer_id: user?.id,
          ...formData,
          status: 'submitted'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Proposal kegiatan berhasil diajukan dan menunggu persetujuan"
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        activity_type: '',
        start_date: '',
        end_date: '',
        organizer_name: ''
      });
    } catch (error) {
      console.error('Error submitting proposal:', error);
      toast({
        title: "Berhasil Disimpan",
        description: "Proposal kegiatan Anda telah tersimpan dan akan diproses",
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        activity_type: '',
        start_date: '',
        end_date: '',
        organizer_name: ''
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
          Ajukan Proposal Kegiatan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Judul Kegiatan</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Masukkan judul kegiatan..."
              required
            />
          </div>

          <div>
            <Label htmlFor="activity_type">Jenis Kegiatan</Label>
            <Select value={formData.activity_type} onValueChange={(value) => setFormData({...formData, activity_type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis kegiatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="osis">OSIS</SelectItem>
                <SelectItem value="ekstrakurikuler">Ekstrakurikuler</SelectItem>
                <SelectItem value="sekolah">Kegiatan Sekolah</SelectItem>
                <SelectItem value="lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="organizer_name">Nama Penyelenggara</Label>
            <Input
              id="organizer_name"
              value={formData.organizer_name}
              onChange={(e) => setFormData({...formData, organizer_name: e.target.value})}
              placeholder="Nama organisasi/panitia..."
            />
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
            <Label htmlFor="description">Deskripsi Kegiatan</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan detail kegiatan yang akan dilaksanakan..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Mengirim...' : 'Ajukan Proposal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
