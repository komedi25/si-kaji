
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
  topic?: string;
  session_type: string;
  status: string;
  created_at: string;
  counselor_id: string;
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
    session_date: '',
    session_time: '',
    topic: '',
    session_type: 'individual',
    counselor_id: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchStudentId();
      fetchCounselors();
    }
  }, [user]);

  useEffect(() => {
    if (studentId) {
      fetchSessions();
    }
  }, [studentId]);

  const fetchStudentId = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching student ID:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setStudentId(data.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in fetchStudentId:', error);
      setLoading(false);
    }
  };

  const fetchCounselors = async () => {
    try {
      // First get user IDs with guru_bk role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'guru_bk')
        .eq('is_active', true);

      if (roleError) {
        console.error('Error fetching counselor roles:', roleError);
        return;
      }

      if (!roleData || roleData.length === 0) {
        setCounselors([]);
        return;
      }

      const userIds = roleData.map(item => item.user_id);

      // Then get profiles for those users
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profileError) {
        console.error('Error fetching counselor profiles:', profileError);
        return;
      }

      setCounselors(profileData || []);
    } catch (error) {
      console.error('Error fetching counselors:', error);
    }
  };

  const fetchSessions = async () => {
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

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
          topic: formData.topic,
          session_type: formData.session_type,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pengajuan sesi konseling berhasil disubmit"
      });

      setFormData({
        session_date: '',
        session_time: '',
        topic: '',
        session_type: 'individual',
        counselor_id: ''
      });
      setShowForm(false);
      fetchSessions();
    } catch (error) {
      console.error('Error submitting counseling request:', error);
      toast({
        title: "Error",
        description: "Gagal mengajukan sesi konseling",
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
        <h2 className="text-xl font-semibold">Konseling & Riwayat</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajukan Konseling
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Form Pengajuan Konseling</span>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="counselor_id">Pilih Konselor</Label>
                <select
                  id="counselor_id"
                  className="w-full p-2 border rounded-md"
                  value={formData.counselor_id}
                  onChange={(e) => setFormData({...formData, counselor_id: e.target.value})}
                  required
                >
                  <option value="">Pilih konselor</option>
                  {counselors.map((counselor) => (
                    <option key={counselor.id} value={counselor.id}>
                      {counselor.full_name}
                    </option>
                  ))}
                </select>
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
                  <option value="family">Keluarga</option>
                </select>
              </div>
              
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
              
              <div>
                <Label htmlFor="topic">Topik/Masalah (Opsional)</Label>
                <Textarea
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  placeholder="Jelaskan topik atau masalah yang ingin dibahas"
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
        <h3 className="text-lg font-medium">Riwayat Konseling</h3>
        {sessions.map((session) => {
          const counselor = counselors.find(c => c.id === session.counselor_id);
          return (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Konseling {session.session_type === 'individual' ? 'Individual' : 
                             session.session_type === 'group' ? 'Kelompok' : 'Keluarga'}
                  </span>
                  {getStatusBadge(session.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(session.session_date), 'dd/MM/yyyy', { locale: id })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{session.session_time}</span>
                  </div>
                </div>
                
                {counselor && (
                  <div>
                    <strong>Konselor:</strong> {counselor.full_name}
                  </div>
                )}
                
                {session.topic && (
                  <div>
                    <strong>Topik:</strong>
                    <div className="mt-1 text-sm text-gray-600">
                      {session.topic}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Diajukan: {format(new Date(session.created_at), 'dd/MM/yyyy HH:mm', { locale: id })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sessions.length === 0 && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Belum ada sesi konseling</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
