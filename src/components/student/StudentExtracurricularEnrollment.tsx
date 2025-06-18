
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Activity, Users, Calendar, MapPin } from 'lucide-react';

interface Extracurricular {
  id: string;
  name: string;
  description?: string;
  schedule_day?: string;
  schedule_time?: string;
  location?: string;
  max_participants?: number;
  current_participants?: number;
  is_enrolled?: boolean;
}

export const StudentExtracurricularEnrollment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchStudentId();
    }
  }, [user]);

  useEffect(() => {
    if (studentId) {
      fetchExtracurriculars();
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
        toast({
          title: "Error",
          description: "Tidak dapat menemukan data siswa",
          variant: "destructive"
        });
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

  const fetchExtracurriculars = async () => {
    if (!studentId) return;

    try {
      // Get all active extracurriculars
      const { data: extracurricularsData, error: extracurricularsError } = await supabase
        .from('extracurriculars')
        .select('*')
        .eq('is_active', true);

      if (extracurricularsError) throw extracurricularsError;

      // Get student's enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('extracurricular_enrollments')
        .select('extracurricular_id, status')
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (enrollmentsError) throw enrollmentsError;

      // Get participant counts
      const extracurricularsWithEnrollment = await Promise.all(
        (extracurricularsData || []).map(async (extracurricular) => {
          const { count } = await supabase
            .from('extracurricular_enrollments')
            .select('*', { count: 'exact' })
            .eq('extracurricular_id', extracurricular.id)
            .eq('status', 'active');

          const isEnrolled = (enrollmentsData || []).some(
            enrollment => enrollment.extracurricular_id === extracurricular.id
          );

          return {
            ...extracurricular,
            current_participants: count || 0,
            is_enrolled: isEnrolled
          };
        })
      );

      setExtracurriculars(extracurricularsWithEnrollment);
    } catch (error) {
      console.error('Error fetching extracurriculars:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data ekstrakurikuler",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (extracurricular: Extracurricular) => {
    if (!studentId) return;

    if (extracurricular.is_enrolled) {
      toast({
        title: "Info",
        description: "Anda sudah terdaftar di ekstrakurikuler ini",
        variant: "default"
      });
      return;
    }

    if (extracurricular.max_participants && 
        extracurricular.current_participants >= extracurricular.max_participants) {
      toast({
        title: "Gagal",
        description: "Ekstrakurikuler ini sudah penuh",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('extracurricular_enrollments')
        .insert({
          student_id: studentId,
          extracurricular_id: extracurricular.id,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Berhasil mendaftar ${extracurricular.name}`
      });

      fetchExtracurriculars(); // Refresh data
    } catch (error) {
      console.error('Error enrolling:', error);
      toast({
        title: "Error",
        description: "Gagal mendaftar ekstrakurikuler",
        variant: "destructive"
      });
    }
  };

  const handleUnenroll = async (extracurricular: Extracurricular) => {
    if (!studentId) return;

    try {
      const { error } = await supabase
        .from('extracurricular_enrollments')
        .update({ status: 'inactive' })
        .eq('student_id', studentId)
        .eq('extracurricular_id', extracurricular.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Berhasil keluar dari ${extracurricular.name}`
      });

      fetchExtracurriculars(); // Refresh data
    } catch (error) {
      console.error('Error unenrolling:', error);
      toast({
        title: "Error",
        description: "Gagal keluar dari ekstrakurikuler",
        variant: "destructive"
      });
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
        <h2 className="text-xl font-semibold mb-4">Pendaftaran Ekstrakurikuler</h2>
        <p className="text-gray-600 mb-6">
          Pilih ekstrakurikuler yang ingin Anda ikuti. Anda dapat mendaftar atau keluar dari ekstrakurikuler.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {extracurriculars.map((extracurricular) => (
          <Card key={extracurricular.id} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {extracurricular.name}
                </span>
                {extracurricular.is_enrolled && (
                  <Badge variant="default">Terdaftar</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {extracurricular.description && (
                <p className="text-sm text-gray-600">{extracurricular.description}</p>
              )}
              
              <div className="space-y-2 text-sm">
                {extracurricular.schedule_day && extracurricular.schedule_time && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{extracurricular.schedule_day}, {extracurricular.schedule_time}</span>
                  </div>
                )}
                
                {extracurricular.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{extracurricular.location}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {extracurricular.current_participants || 0}
                    {extracurricular.max_participants && ` / ${extracurricular.max_participants}`}
                    {' peserta'}
                  </span>
                </div>
              </div>

              <div className="pt-3">
                {extracurricular.is_enrolled ? (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleUnenroll(extracurricular)}
                    className="w-full"
                  >
                    Keluar
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleEnroll(extracurricular)}
                    disabled={extracurricular.max_participants ? 
                      extracurricular.current_participants >= extracurricular.max_participants : false}
                    className="w-full"
                  >
                    {extracurricular.max_participants && 
                     extracurricular.current_participants >= extracurricular.max_participants 
                      ? 'Penuh' : 'Daftar'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {extracurriculars.length === 0 && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Tidak ada ekstrakurikuler yang tersedia saat ini</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
