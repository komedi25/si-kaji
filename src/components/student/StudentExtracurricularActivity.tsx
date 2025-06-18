
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Activity, Users, Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface StudentExtracurricular {
  id: string;
  enrollment_date: string;
  status: string;
  extracurriculars: {
    id: string;
    name: string;
    description?: string;
    schedule_day?: string;
    schedule_time?: string;
    location?: string;
  };
}

interface ActivityLog {
  id: string;
  log_date: string;
  session_topic: string;
  session_description?: string;
  attendance_count?: number;
  extracurriculars: {
    name: string;
  };
}

export const StudentExtracurricularActivity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<StudentExtracurricular[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentId();
  }, [user]);

  useEffect(() => {
    if (studentId) {
      fetchEnrollments();
      fetchActivityLogs();
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

  const fetchEnrollments = async () => {
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('extracurricular_enrollments')
        .select(`
          *,
          extracurriculars(*)
        `)
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data ekstrakurikuler",
        variant: "destructive"
      });
    }
  };

  const fetchActivityLogs = async () => {
    if (!studentId) return;

    try {
      // Get extracurricular IDs where student is enrolled
      const { data: enrollmentData } = await supabase
        .from('extracurricular_enrollments')
        .select('extracurricular_id')
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (!enrollmentData || enrollmentData.length === 0) {
        setLoading(false);
        return;
      }

      const extracurricularIds = enrollmentData.map(e => e.extracurricular_id);

      const { data, error } = await supabase
        .from('coach_activity_logs')
        .select(`
          *,
          extracurriculars(name)
        `)
        .in('extracurricular_id', extracurricularIds)
        .order('log_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: "Error",
        description: "Gagal memuat log kegiatan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
      <div>
        <h2 className="text-xl font-semibold mb-4">Kegiatan Ekstrakurikuler Saya</h2>
      </div>

      {/* My Extracurriculars */}
      <div>
        <h3 className="text-lg font-medium mb-4">Ekstrakurikuler yang Diikuti</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {enrollment.extracurriculars.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {enrollment.extracurriculars.description && (
                  <p className="text-sm text-gray-600">{enrollment.extracurriculars.description}</p>
                )}
                
                <div className="space-y-2 text-sm">
                  {enrollment.extracurriculars.schedule_day && enrollment.extracurriculars.schedule_time && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{enrollment.extracurriculars.schedule_day}, {enrollment.extracurriculars.schedule_time}</span>
                    </div>
                  )}
                  
                  {enrollment.extracurriculars.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{enrollment.extracurriculars.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Bergabung: {format(new Date(enrollment.enrollment_date), 'dd MMMM yyyy', { locale: id })}</span>
                  </div>
                </div>

                <Badge variant="default">Aktif</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {enrollments.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Anda belum mengikuti ekstrakurikuler apapun</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activities */}
      <div>
        <h3 className="text-lg font-medium mb-4">Kegiatan Terbaru</h3>
        <div className="space-y-4">
          {activityLogs.map((log) => (
            <Card key={log.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {log.extracurriculars.name}
                  </span>
                  <Badge variant="outline">
                    {format(new Date(log.log_date), 'dd MMM yyyy', { locale: id })}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <strong>Topik Kegiatan:</strong>
                  <div className="mt-1 text-sm">{log.session_topic}</div>
                </div>
                
                {log.session_description && (
                  <div>
                    <strong>Deskripsi:</strong>
                    <div className="mt-1 text-sm text-gray-600">{log.session_description}</div>
                  </div>
                )}
                
                {log.attendance_count && (
                  <div className="text-sm">
                    <strong>Jumlah Peserta:</strong> {log.attendance_count} orang
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {activityLogs.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Belum ada log kegiatan</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
