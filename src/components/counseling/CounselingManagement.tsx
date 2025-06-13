
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CounselingForm } from './CounselingForm';
import { CounselingSession } from './CounselingSession';
import { Search, Calendar, Clock, User } from 'lucide-react';
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

export const CounselingManagement = () => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<CounselingSessionData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ['counseling-sessions', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('counseling_sessions')
        .select(`
          *,
          student:students!counseling_sessions_student_id_fkey(
            full_name,
            nis,
            current_class:student_enrollments!inner(
              class:classes!inner(name)
            )
          ),
          counselor:profiles!counseling_sessions_counselor_id_fkey(full_name)
        `)
        .order('session_date', { ascending: false });

      if (searchTerm) {
        query = query.or(`topic.ilike.%${searchTerm}%,student.full_name.ilike.%${searchTerm}%`);
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data.map(session => ({
        ...session,
        student: {
          ...session.student,
          current_class: session.student.current_class?.[0]?.class
        }
      })) as CounselingSessionData[];
    },
  });

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

  if (selectedSession) {
    return (
      <CounselingSession 
        sessionData={selectedSession} 
        onBack={() => setSelectedSession(null)}
        onUpdate={() => {
          refetch();
          setSelectedSession(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bimbingan Konseling</h1>
          <p className="text-muted-foreground">
            Manajemen sesi bimbingan dan konseling siswa
          </p>
        </div>
      </div>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Daftar Sesi</TabsTrigger>
          <TabsTrigger value="schedule">Jadwal Baru</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Pencarian & Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari sesi konseling..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p>Memuat data...</p>
                </CardContent>
              </Card>
            ) : sessions?.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Tidak ada sesi konseling ditemukan</p>
                </CardContent>
              </Card>
            ) : (
              sessions?.map((session) => (
                <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6" onClick={() => setSelectedSession(session)}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {session.topic || 'Sesi Konseling'}
                          </h3>
                          {getStatusBadge(session.status)}
                          {getSessionTypeBadge(session.session_type)}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Siswa: {session.student?.full_name} ({session.student?.nis})</span>
                            {session.student?.current_class && (
                              <span>- {session.student.current_class.name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(session.session_date), 'dd MMMM yyyy', { locale: id })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{session.session_time} ({session.duration_minutes} menit)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-muted-foreground border-t pt-3">
                      <div>
                        Konselor: {session.counselor?.full_name}
                      </div>
                      <div>
                        {session.follow_up_required && (
                          <Badge variant="outline" className="mr-2">Perlu Tindak Lanjut</Badge>
                        )}
                        {format(new Date(session.created_at), 'dd MMM yyyy', { locale: id })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <CounselingForm onSuccess={() => refetch()} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
