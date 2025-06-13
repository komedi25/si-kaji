
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
import { Calendar, Clock, User } from 'lucide-react';

interface CounselingFormProps {
  onSuccess?: () => void;
}

export const CounselingForm = ({ onSuccess }: CounselingFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    session_date: '',
    session_time: '',
    duration_minutes: '60',
    topic: '',
    session_type: '',
    notes_encrypted: ''
  });

  const sessionTypes = [
    { value: 'individual', label: 'Konseling Individual' },
    { value: 'group', label: 'Konseling Kelompok' },
    { value: 'career', label: 'Konseling Karir' },
    { value: 'academic', label: 'Konseling Akademik' },
    { value: 'social', label: 'Konseling Sosial' },
    { value: 'crisis', label: 'Intervensi Krisis' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('counseling_sessions')
        .insert({
          counselor_id: user.id,
          ...formData,
          duration_minutes: parseInt(formData.duration_minutes),
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Sesi konseling berhasil dijadwalkan"
      });

      setFormData({
        student_id: '',
        session_date: '',
        session_time: '',
        duration_minutes: '60',
        topic: '',
        session_type: '',
        notes_encrypted: ''
      });

      if (onSuccess) {
        onSuccess();
      }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Jadwal Sesi Konseling
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student_id">Siswa</Label>
            <Input
              id="student_id"
              placeholder="ID Siswa atau nama siswa"
              value={formData.student_id}
              onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session_type">Jenis Konseling</Label>
            <Select value={formData.session_type} onValueChange={(value) => setFormData(prev => ({ ...prev, session_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis konseling..." />
              </SelectTrigger>
              <SelectContent>
                {sessionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session_date">Tanggal</Label>
              <Input
                id="session_date"
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData(prev => ({ ...prev, session_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_time">Waktu</Label>
              <Input
                id="session_time"
                type="time"
                value={formData.session_time}
                onChange={(e) => setFormData(prev => ({ ...prev, session_time: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Durasi (menit)</Label>
              <Select value={formData.duration_minutes} onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 menit</SelectItem>
                  <SelectItem value="45">45 menit</SelectItem>
                  <SelectItem value="60">60 menit</SelectItem>
                  <SelectItem value="90">90 menit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topik Konseling</Label>
            <Input
              id="topic"
              placeholder="Masalah atau topik yang akan dibahas"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes_encrypted">Catatan Awal</Label>
            <Textarea
              id="notes_encrypted"
              placeholder="Catatan persiapan atau latar belakang masalah..."
              value={formData.notes_encrypted}
              onChange={(e) => setFormData(prev => ({ ...prev, notes_encrypted: e.target.value }))}
              className="min-h-[100px]"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Calendar className="w-4 h-4 mr-2" />
            {loading ? 'Menjadwalkan...' : 'Jadwalkan Konseling'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
