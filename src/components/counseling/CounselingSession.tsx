import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, User, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface CounselingSessionData {
  id: string;
  student_id: string;
  counselor_id: string;
  session_date: string;
  session_time: string;
  duration_minutes: number;
  session_type: string;
  status: string;
  topic: string | null;
  notes_encrypted: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  created_at: string;
  student: {
    full_name: string;
    nis: string;
    current_class?: { name: string };
  };
  counselor: {
    full_name: string;
  };
}

interface CounselingSessionProps {
  sessionData: CounselingSessionData;
  onBack: () => void;
  onUpdate: () => void;
}

export const CounselingSession = ({ sessionData, onBack, onUpdate }: CounselingSessionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(sessionData.notes_encrypted || '');
  const [status, setStatus] = useState(sessionData.status);
  const [followUpRequired, setFollowUpRequired] = useState(sessionData.follow_up_required);
  const [followUpDate, setFollowUpDate] = useState(sessionData.follow_up_date || '');

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('counseling_sessions')
        .update({
          notes_encrypted: notes,
          status,
          follow_up_required: followUpRequired,
          follow_up_date: followUpRequired ? followUpDate : null
        })
        .eq('id', sessionData.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data sesi konseling berhasil disimpan"
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data sesi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Terjadwal', variant: 'default' as const },
      completed: { label: 'Selesai', variant: 'outline' as const },
      cancelled: { label: 'Dibatalkan', variant: 'destructive' as const },
      no_show: { label: 'Tidak Hadir', variant: 'secondary' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detail Sesi Konseling</h1>
          <p className="text-muted-foreground">
            {sessionData.topic || 'Sesi Konseling'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Siswa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{sessionData.student?.full_name}</p>
              <p className="text-sm text-muted-foreground">NIS: {sessionData.student?.nis}</p>
              {sessionData.student?.current_class && (
                <p className="text-sm text-muted-foreground">
                  Kelas: {sessionData.student.current_class.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Jadwal Sesi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(sessionData.session_date), 'dd MMMM yyyy', { locale: id })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{sessionData.session_time} ({sessionData.duration_minutes} menit)</span>
            </div>
            <div>
              <span className="font-medium">Status: </span>
              {getStatusBadge(status)}
            </div>
            <div>
              <span className="font-medium">Konselor: </span>
              <span>{sessionData.counselor?.full_name}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catatan Konseling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Status Sesi
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="scheduled">Terjadwal</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
              <option value="no_show">Tidak Hadir</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Catatan Sesi
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tulis catatan konseling di sini..."
              className="min-h-[200px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="followUpRequired"
              checked={followUpRequired}
              onChange={(e) => setFollowUpRequired(e.target.checked)}
            />
            <label htmlFor="followUpRequired" className="text-sm font-medium">
              Memerlukan tindak lanjut
            </label>
          </div>

          {followUpRequired && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Tanggal Tindak Lanjut
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          )}

          <Button onClick={handleSave} disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Menyimpan...' : 'Simpan Catatan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
