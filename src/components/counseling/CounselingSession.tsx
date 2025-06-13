
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';

interface CounselingSession {
  id: string;
  session_date: string;
  session_time: string;
  duration_minutes: number;
  topic: string;
  session_type: string;
  status: string;
  notes_encrypted?: string;
  student?: {
    full_name: string;
    nis: string;
  };
}

export const CounselingSession = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select(`
          *,
          student:students(full_name, nis)
        `)
        .eq('counselor_id', user?.id)
        .order('session_date', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSessionStatus = async (sessionId: string, status: string, notes?: string) => {
    try {
      const updateData: any = { status };
      if (notes) updateData.notes_encrypted = notes;

      const { error } = await supabase
        .from('counseling_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Sesi konseling ${status === 'completed' ? 'diselesaikan' : 'dibatalkan'}`
      });

      fetchSessions();
      setSelectedSession(null);
      setSessionNotes('');
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status sesi",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Terjadwal</Badge>;
      case 'completed':
        return <Badge variant="default">Selesai</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div>Memuat sesi konseling...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sesi Konseling</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada sesi konseling yang dijadwalkan
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">
                        {session.student?.full_name} - {session.student?.nis}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {session.session_type} - {session.topic}
                      </p>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(session.session_date).toLocaleDateString('id-ID')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {session.session_time} ({session.duration_minutes} menit)
                    </div>
                  </div>

                  {session.notes_encrypted && (
                    <div className="text-sm bg-gray-50 p-3 rounded">
                      <strong>Catatan:</strong> {session.notes_encrypted}
                    </div>
                  )}

                  {session.status === 'scheduled' && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => setSelectedSession(session.id)}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Selesaikan Sesi
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => updateSessionStatus(session.id, 'cancelled')}
                        className="flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Batalkan
                      </Button>
                    </div>
                  )}

                  {selectedSession === session.id && (
                    <div className="space-y-3 pt-3 border-t">
                      <Textarea
                        placeholder="Catatan hasil konseling..."
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => updateSessionStatus(session.id, 'completed', sessionNotes)}
                        >
                          Simpan & Selesaikan
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedSession(null);
                            setSessionNotes('');
                          }}
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
