
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Clock, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface CounselingSessionProps {
  sessionData: any;
  onBack: () => void;
  onUpdate: () => void;
}

export const CounselingSession = ({ sessionData, onBack, onUpdate }: CounselingSessionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState(sessionData.status);
  const [notes, setNotes] = useState('');

  const updateSessionMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('counseling_sessions')
        .update(updates)
        .eq('id', sessionData.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Sesi konseling berhasil diperbarui',
      });
      queryClient.invalidateQueries({ queryKey: ['counseling-sessions'] });
      onUpdate();
    },
    onError: (error) => {
      console.error('Error updating session:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal memperbarui sesi konseling',
        variant: 'destructive',
      });
    },
  });

  const handleStatusUpdate = () => {
    const updates: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'completed' && notes) {
      // In a real app, you'd encrypt this before storing
      updates.notes_encrypted = notes;
    }

    updateSessionMutation.mutate(updates);
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

  const getSessionTypeBadge = (type: string) => {
    const typeConfig = {
      individual: { label: 'Individual', variant: 'default' as const },
      group: { label: 'Kelompok', variant: 'secondary' as const },
      family: { label: 'Keluarga', variant: 'outline' as const },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.individual;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {sessionData.topic || 'Sesi Konseling'}
          </h1>
          <p className="text-muted-foreground">
            {sessionData.student?.full_name} ({sessionData.student?.nis})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detail Sesi */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detail Sesi Konseling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {getStatusBadge(sessionData.status)}
                {getSessionTypeBadge(sessionData.session_type)}
                {sessionData.follow_up_required && (
                  <Badge variant="outline">Perlu Tindak Lanjut</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Siswa: {sessionData.student?.full_name}
                    {sessionData.student?.current_class && ` (${sessionData.student.current_class.name})`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Konselor: {sessionData.counselor?.full_name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(sessionData.session_date), 'dd MMMM yyyy', { locale: id })}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{sessionData.session_time} ({sessionData.duration_minutes} menit)</span>
                </div>
              </div>

              {sessionData.topic && (
                <div className="space-y-2">
                  <h4 className="font-medium">Topik/Tujuan:</h4>
                  <p className="text-sm bg-muted p-3 rounded">{sessionData.topic}</p>
                </div>
              )}

              {sessionData.follow_up_required && sessionData.follow_up_date && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Tindak Lanjut:</h4>
                  <p className="text-sm">
                    Dijadwalkan: {format(new Date(sessionData.follow_up_date), 'dd MMMM yyyy', { locale: id })}
                  </p>
                </div>
              )}

              {sessionData.notes_encrypted && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Catatan Konseling:
                  </h4>
                  <p className="text-sm bg-muted p-3 rounded">
                    {sessionData.notes_encrypted}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel Aksi */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aksi Sesi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status:</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Terjadwal</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    <SelectItem value="no_show">Tidak Hadir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStatus === 'completed' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Catatan Sesi:</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan hasil sesi konseling (akan dienkripsi)..."
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Catatan akan disimpan dengan enkripsi untuk menjaga kerahasiaan
                  </p>
                </div>
              )}

              <Button 
                onClick={handleStatusUpdate} 
                disabled={updateSessionMutation.isPending}
                className="w-full"
              >
                {updateSessionMutation.isPending ? 'Menyimpan...' : 'Perbarui Sesi'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Sesi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibuat:</span>
                <span>{format(new Date(sessionData.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Durasi:</span>
                <span>{sessionData.duration_minutes} menit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jenis:</span>
                <span>{sessionData.session_type}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
