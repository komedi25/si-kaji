
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search, Calendar, Clock, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface StudentCounselingHistoryProps {
  studentId?: string;
}

export const StudentCounselingHistory = ({ studentId }: StudentCounselingHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['student-counseling-history', studentId, searchTerm],
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

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      if (searchTerm) {
        query = query.or(`topic.ilike.%${searchTerm}%,notes_encrypted.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data.map(session => ({
        ...session,
        student: {
          ...session.student,
          current_class: session.student.current_class?.[0]?.class
        }
      }));
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {studentId ? 'Riwayat Konseling Siswa' : 'Riwayat Semua Konseling'}
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan topik atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : sessions?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada riwayat konseling ditemukan
          </div>
        ) : (
          <div className="space-y-4">
            {sessions?.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg mb-1">
                      {session.topic || 'Sesi Konseling'}
                    </h4>
                    <div className="flex gap-2 mb-2">
                      {getStatusBadge(session.status)}
                      {getSessionTypeBadge(session.session_type)}
                      {session.follow_up_required && (
                        <Badge variant="outline">Perlu Tindak Lanjut</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  {!studentId && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>
                        {session.student?.full_name} ({session.student?.nis})
                        {session.student?.current_class && 
                          ` - ${session.student.current_class.name}`
                        }
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(session.session_date), 'dd MMMM yyyy', { locale: id })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{session.session_time} ({session.duration_minutes} menit)</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Konselor: {session.counselor?.full_name}</span>
                  </div>
                </div>

                {session.notes_encrypted && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p className="text-sm">
                      <strong>Catatan:</strong> {session.notes_encrypted}
                    </p>
                  </div>
                )}

                {session.follow_up_required && session.follow_up_date && (
                  <div className="mt-2 text-sm text-orange-600">
                    <strong>Tindak lanjut pada:</strong> {format(new Date(session.follow_up_date), 'dd MMMM yyyy', { locale: id })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
