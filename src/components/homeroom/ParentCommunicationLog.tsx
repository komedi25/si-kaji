
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Phone, MessageSquare, Calendar, Plus, Send } from 'lucide-react';

export const ParentCommunicationLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [communications, setCommunications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    communication_type: '',
    communication_date: new Date().toISOString().split('T')[0],
    subject: '',
    content: '',
    follow_up_required: false,
    follow_up_date: ''
  });

  useEffect(() => {
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    try {
      // This would be a custom table for parent communications
      // For now, we'll use a placeholder structure
      const mockData = [
        {
          id: 1,
          student_name: 'Ahmad Rizki',
          parent_name: 'Bpk. Ahmad',
          communication_type: 'phone',
          subject: 'Konsultasi Prestasi Akademik',
          communication_date: '2024-06-01',
          status: 'completed'
        },
        {
          id: 2,
          student_name: 'Siti Nurhaliza',
          parent_name: 'Ibu Siti',
          communication_type: 'whatsapp',
          subject: 'Informasi Kehadiran',
          communication_date: '2024-06-02',
          status: 'follow_up_required'
        }
      ];
      setCommunications(mockData);
    } catch (error) {
      console.error('Error fetching communications:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Here we would save to a parent_communications table
      toast({
        title: "Berhasil",
        description: "Log komunikasi dengan orang tua berhasil disimpan"
      });
      
      setShowForm(false);
      setFormData({
        student_id: '',
        communication_type: '',
        communication_date: new Date().toISOString().split('T')[0],
        subject: '',
        content: '',
        follow_up_required: false,
        follow_up_date: ''
      });
      fetchCommunications();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan log komunikasi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Selesai</Badge>;
      case 'follow_up_required':
        return <Badge variant="outline">Perlu Tindak Lanjut</Badge>;
      default:
        return <Badge variant="secondary">Baru</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Log Komunikasi dengan Orang Tua
          </CardTitle>
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Komunikasi
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Form Komunikasi Baru</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Siswa</Label>
                      <Select value={formData.student_id} onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih siswa..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student1">Ahmad Rizki - NIS: 2024001</SelectItem>
                          <SelectItem value="student2">Siti Nurhaliza - NIS: 2024002</SelectItem>
                          <SelectItem value="student3">Budi Santoso - NIS: 2024003</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Jenis Komunikasi</Label>
                      <Select value={formData.communication_type} onValueChange={(value) => setFormData(prev => ({ ...prev, communication_type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">Telepon</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="home_visit">Kunjungan Rumah</SelectItem>
                          <SelectItem value="school_meeting">Pertemuan di Sekolah</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tanggal Komunikasi</Label>
                      <Input
                        type="date"
                        value={formData.communication_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, communication_date: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Subjek/Topik</Label>
                      <Input
                        placeholder="Subjek komunikasi..."
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Isi Komunikasi</Label>
                    <Textarea
                      placeholder="Jelaskan isi komunikasi dengan orang tua..."
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading} className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {loading ? 'Menyimpan...' : 'Simpan Komunikasi'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {communications.map((comm) => (
              <Card key={comm.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {getCommunicationIcon(comm.communication_type)}
                      </div>
                      <div>
                        <h3 className="font-medium">{comm.subject}</h3>
                        <p className="text-sm text-muted-foreground">
                          {comm.student_name} - {comm.parent_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{comm.communication_date}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(comm.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
