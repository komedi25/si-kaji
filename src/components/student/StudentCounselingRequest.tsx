
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
import { Calendar, Clock, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface CounselingSession {
  id: string;
  session_date: string;
  session_time: string;
  session_type: string;
  topic: string;
  status: string;
  counselor_id: string;
  counselor?: {
    full_name: string;
  };
  created_at: string;
}

interface Counselor {
  id: string;
  full_name: string;
}

export const StudentCounselingRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    session_date: '',
    session_time: '09:00',
    session_type: 'individual',
    topic: '',
    counselor_id: ''
  });

  useEffect(() => {
    fetchSessions();
    fetchCounselors();
  }, []);

  const fetchSessions = async () => {
    if (!user) return;

    try {
      // Get student data first
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError) throw studentError;

      // Then get counseling sessions
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select(`
          *,
          counselor:profiles!counselor_id(full_name)
        `)
        .eq('student_id', studentData.id)
        .order('session_date', { ascending: false });

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data sesi konseling",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCounselors = async () => {
    try {
      // Get users with guru_bk role
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          profiles!inner(
            id,
            full_name
          )
        `)
        .eq('role', 'guru_bk');

      if (error) throw error;

      const counselorData = data?.map(item => ({
        id: item.user_id,
        full_name: item.profiles?.full_name || 'Unknown'
      })) || [];

      setCounselors(counselorData);
    } catch (error) {
      console.error('Error fetching counselors:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data guru BK",
        variant: "destructive"
      });
    }
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
        .from('counseling_sessions')
        .insert({
          student_id: studentData.id,
          counselor_id: formData.counselor_id,
          session_date: formData.session_date,
          session_time: formData.session_time,
          session_type: formData.session_type,
          topic: formData.topic,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pengajuan konseling berhasil disubmit"
      });

      setFormData({
        session_date: '',
        session_time: '09:00',
        session_type: 'individual',
        topic: '',
        counselor_id: ''
      });

      fetchSessions();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Gagal mengajukan konseling",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Dijadwalkan', variant: 'default' as const },
      completed: { label: 'Selesai', variant: 'secondary' as const },
      cancelled: { label: 'Dibatalkan', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? <Badge variant={config.variant}>{config.label}</Badge> : null;
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
            <MessageSquare className="w-5 h-5" />
            Pengajuan Konseling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="session_date">Tanggal Konseling</Label>
                <Input
                  id="session_date"
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="session_time">Waktu Konseling</Label>
                <Input
                  id="session_time"
                  type="time"
                  value={formData.session_time}
                  onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="session_type">Jenis Konseling</Label>
                <Select value={formData.session_type} onValueChange={(value) => setFormData({ ...formData, session_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="group">Kelompok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="counselor_id">Guru BK</Label>
                <Select value={formData.counselor_id} onValueChange={(value) => setFormData({ ...formData, counselor_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Guru BK" />
                  </SelectTrigger>
                  <SelectContent>
                    {counselors.map((counselor) => (
                      <SelectItem key={counselor.id} value={counselor.id}>
                        {counselor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="topic">Topik/Masalah yang Ingin Dibahas</Label>
              <Textarea
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Jelaskan topik atau masalah yang ingin Anda konsultasikan..."
                required
              />
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Mengajukan...' : 'Ajukan Konseling'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Konseling</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Belum ada riwayat konseling
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{session.topic}</h4>
                      <p className="text-sm text-muted-foreground">
                        {session.session_type === 'individual' ? 'Individual' : 'Kelompok'}
                      </p>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(session.session_date), 'dd MMMM yyyy', { locale: localeId })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {session.session_time}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {session.counselor?.full_name || 'Guru BK'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
