
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
import { StudentSearchWithQR } from '@/components/common/StudentSearchWithQR';

export const CounselingForm = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    session_date: '',
    session_time: '',
    session_type: '',
    topic: '',
    duration_minutes: '60'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRole('admin') && !hasRole('guru_bk')) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk membuat jadwal konseling",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('counseling_sessions')
        .insert({
          student_id: formData.student_id,
          counselor_id: user?.id,
          session_date: formData.session_date,
          session_time: formData.session_time,
          session_type: formData.session_type,
          topic: formData.topic,
          duration_minutes: parseInt(formData.duration_minutes) || 60,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Jadwal konseling berhasil dibuat"
      });

      // Reset form
      setFormData({
        student_id: '',
        session_date: '',
        session_time: '',
        session_type: '',
        topic: '',
        duration_minutes: '60'
      });
    } catch (error) {
      console.error('Error creating counseling session:', error);
      toast({
        title: "Error",
        description: "Gagal membuat jadwal konseling",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('admin') && !hasRole('guru_bk')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">
            Anda tidak memiliki akses untuk membuat jadwal konseling
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buat Jadwal Konseling</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="student">Siswa *</Label>
            <StudentSearchWithQR
              value={formData.student_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
              placeholder="Cari siswa berdasarkan nama atau NIS"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="session_date">Tanggal Sesi *</Label>
              <Input
                id="session_date"
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData(prev => ({ ...prev, session_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="session_time">Waktu Sesi *</Label>
              <Input
                id="session_time"
                type="time"
                value={formData.session_time}
                onChange={(e) => setFormData(prev => ({ ...prev, session_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="session_type">Jenis Sesi *</Label>
              <Select value={formData.session_type} onValueChange={(value) => setFormData(prev => ({ ...prev, session_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis sesi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="group">Kelompok</SelectItem>
                  <SelectItem value="crisis">Krisis</SelectItem>
                  <SelectItem value="follow_up">Tindak Lanjut</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Durasi (menit) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                min="15"
                max="180"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="topic">Topik/Tema Konseling</Label>
            <Textarea
              id="topic"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="Topik atau tema yang akan dibahas dalam sesi konseling"
            />
          </div>

          <Button type="submit" disabled={loading || !formData.student_id} className="w-full">
            {loading ? 'Menyimpan...' : 'Buat Jadwal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
