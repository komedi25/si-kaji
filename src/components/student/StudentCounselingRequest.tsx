
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
import { Heart, Plus, X, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface CounselingSession {
  id: string;
  session_date: string;
  session_time: string;
  session_type: string;
  topic?: string;
  status: string;
  duration_minutes: number;
  created_at: string;
  counselor_id: string;
  profiles?: {
    full_name: string;
  };
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
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    counselor_id: '',
    session_date: '',
    session_time: '',
    session_type: 'individual',
    topic: '',
    duration_minutes: 60
  });

  useEffect(() => {
    fetchStudentId();
    fetchCounselors();
  }, [user]);

  useEffect(() => {
    if (studentId) {
      fetchSessions();
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

  const fetchCounselors = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          profiles!inner(id, full_name)
        `)
        .eq('role', 'guru_bk')
        .eq('is_active', true);

      if (error) throw error;
      
      const counselorData = data?.map(item => ({
        id: item.profiles.id,
        full_name: item.profiles.full_name
      })) || [];
      
      setCounselors(counselorData);
    } catch (error) {
      console.error('Error fetching counselors:', error);
    }
  };

  const fetchSessions = async () => {
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select(`
          *,
          profiles!counseling_sessions_counselor_id_fkey(full_name)
        `)
        .eq('student_id', studentId)
        .order('session_date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching counseling sessions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data konseling",
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
        .from('counseling_sessions')
        .insert({
          student_id: studentId,
          counselor_id: formData.counselor_id,
          session_date: formData.session_date,
          session_time: formData.session_time,
          session_type: formData.session_type,
          topic: formData.topic,
          duration_minutes: formData.duration_minutes,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Permintaan konseling berhasil diajukan"
      });

      setFormData({
        counselor_id: '',
        session_date: '',
        session_time: '',
        session_type: 'individual',
        topic: '',
        duration_minutes: 60
      });
      setShowForm(false);
      fetchSessions();
    } catch (error) {
      console.error('Error submitting counseling request:', error);
      toast({
        title: "Error",
        description: "Gagal mengajukan konseling",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      scheduled: 'secondary',
      completed: 'default',
      cancelled: 'destructive',
      rescheduled: 'outline'
    } as const;

    const labels = {
      scheduled: 'Terjadwal',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
      rescheduled: 'Dijadwal Ulang'
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
        <h2 className="text-xl font-semibold">Konseling Saya</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajukan Konseling
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Form Permintaan Konseling</span>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="counselor_id">Guru BK</Label>
                <select
                  id="counselor_id"
                  className="w-full p-2 border rounded-md"
                  value={formData.counselor_id}
                  onChange={(e) => setFormData({...formData, counselor_id: e.target.value})}
                  required
                >
                  <option value="">Pilih Guru BK</option>
                  {counselors.map((counselor) => (
                    <option key={counselor.id} value={counselor.id}>
                      {counselor.full_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="session_date">Tanggal Konseling</Label>
                  <Input
                    id="session_date"
                    type="date"
                    value={formData.session_date}
                    onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="session_time">Waktu Konseling</Label>
                  <Input
                    id="session_time"
                    type="time"
                    value={formData.session_time}
                    onChange={(e) => setFormData({...formData, session_time: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="session_type">Jenis Konseling</Label>
                <select
                  id="session_type"
                  className="w-full p-2 border rounded-md"
                  value={formData.session_type}
                  onChange={(e) => setFormData({...formData, session_type: e.target.value})}
                  required
                >
                  <option value="individual">Individual</option>
                  <option value="group">Kelompok</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="topic">Topik/Permasalahan</Label>
                <Textarea
                  id="topic"
                  placeholder="Jelaskan topik atau permasalahan yang ingin dikonsultasikan..."
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="duration_minutes">Durasi (menit)</Label>
                <select
                  id="duration_minutes"
                  className="w-full p-2 border rounded-md"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                >
                  <option value={30}>30 menit</option>
                  <option value={60}>60 menit</option>
                  <option value={90}>90 menit</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">Submit Permintaan</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Riwayat Konseling</h3>
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Konseling {session.session_type === 'individual' ? 'Individual' : 'Kelompok'}
                </span>
                {getStatusBadge(session.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(session.session_date), 'dd MMMM yyyy', { locale: id })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{session.session_time} ({session.duration_minutes} menit)</span>
                </div>
                <div>
                  <strong>Konselor:</strong> {session.profiles?.full_name || 'N/A'}
                </div>
                <div>
                  <strong>Diajukan:</strong> {format(new Date(session.created_at), 'dd/MM/yyyy', { locale: id })}
                </div>
              </div>
              
              {session.topic && (
                <div>
                  <strong>Topik:</strong>
                  <div className="mt-1 text-sm text-gray-600">
                    {session.topic}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Belum ada riwayat konseling</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
