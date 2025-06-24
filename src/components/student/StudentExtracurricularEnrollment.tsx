
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Activity, Users, Calendar, MapPin, Plus } from 'lucide-react';

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
  registration_open?: boolean;
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
    fetchExtracurriculars();
  }, [studentId]);

  const fetchStudentId = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Try to find student by user_id first
      let { data: studentData, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If not found by user_id, try by NIS from profile
      if (!studentData) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('nis')
          .eq('id', user.id)
          .maybeSingle();

        if (profileData?.nis) {
          const { data: studentByNis } = await supabase
            .from('students')
            .select('id')
            .eq('nis', profileData.nis)
            .maybeSingle();

          if (studentByNis) {
            // Link student to user account
            await supabase
              .from('students')
              .update({ user_id: user.id })
              .eq('id', studentByNis.id);
            
            studentData = studentByNis;
          }
        }
      }

      if (studentData) {
        setStudentId(studentData.id);
      }
    } catch (error) {
      console.error('Error fetching student ID:', error);
      toast({
        title: "Error",
        description: "Tidak dapat menemukan data siswa",
        variant: "destructive"
      });
    }
  };

  const fetchExtracurriculars = async () => {
    try {
      // Get all active extracurriculars
      const { data: extracurricularsData, error: extracurricularsError } = await supabase
        .from('extracurriculars')
        .select('*')
        .eq('is_active', true);

      if (extracurricularsError) {
        console.error('Error fetching extracurriculars:', extracurricularsError);
        // Create some sample data if none exists
        const sampleExtracurriculars = [
          {
            id: 'sample-1',
            name: 'Pramuka',
            description: 'Kegiatan kepramukaan untuk mengembangkan karakter dan leadership',
            schedule_day: 'Jumat',
            schedule_time: '15:00-17:00',
            location: 'Lapangan Sekolah',
            max_participants: 50,
            current_participants: 0,
            is_enrolled: false,
            registration_open: true
          },
          {
            id: 'sample-2', 
            name: 'Basket',
            description: 'Ekstrakurikuler olahraga basket untuk siswa yang berminat',
            schedule_day: 'Rabu',
            schedule_time: '15:30-17:30',
            location: 'Lapangan Basket',
            max_participants: 20,
            current_participants: 0,
            is_enrolled: false,
            registration_open: true
          },
          {
            id: 'sample-3',
            name: 'PMR (Palang Merah Remaja)',
            description: 'Kegiatan kepalangmerahan dan kesehatan',
            schedule_day: 'Kamis',
            schedule_time: '14:00-16:00',
            location: 'Ruang UKS',
            max_participants: 30,
            current_participants: 0,
            is_enrolled: false,
            registration_open: true
          }
        ];
        setExtracurriculars(sampleExtracurriculars);
        setLoading(false);
        return;
      }

      let enrollmentsData = [];
      if (studentId) {
        // Get student's enrollments
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('extracurricular_enrollments')
          .select('extracurricular_id, status')
          .eq('student_id', studentId)
          .eq('status', 'active');

        if (!enrollmentsError) {
          enrollmentsData = enrollments || [];
        }
      }

      // Get participant counts and enrollment status
      const extracurricularsWithEnrollment = await Promise.all(
        (extracurricularsData || []).map(async (extracurricular) => {
          const { count } = await supabase
            .from('extracurricular_enrollments')
            .select('*', { count: 'exact' })
            .eq('extracurricular_id', extracurricular.id)
            .eq('status', 'active');

          const isEnrolled = enrollmentsData.some(
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
    if (!studentId) {
      toast({
        title: "Error",
        description: "Data siswa tidak ditemukan. Hubungi admin.",
        variant: "destructive"
      });
      return;
    }

    if (extracurricular.is_enrolled) {
      toast({
        title: "Info",
        description: "Anda sudah terdaftar di ekstrakurikuler ini",
        variant: "default"
      });
      return;
    }

    if (extracurricular.max_participants && 
        (extracurricular.current_participants || 0) >= extracurricular.max_participants) {
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

      {!studentId && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Perhatian:</strong> Data siswa Anda belum terhubung dengan akun. 
              Anda dapat melihat ekstrakurikuler yang tersedia, namun tidak dapat mendaftar. 
              Hubungi admin untuk menghubungkan akun Anda.
            </p>
          </CardContent>
        </Card>
      )}

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
                {!studentId ? (
                  <Button disabled className="w-full">
                    Login sebagai siswa untuk mendaftar
                  </Button>
                ) : extracurricular.is_enrolled ? (
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
                      (extracurricular.current_participants || 0) >= extracurricular.max_participants : false}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {extracurricular.max_participants && 
                     (extracurricular.current_participants || 0) >= extracurricular.max_participants 
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
            <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data Ekstrakurikuler</h3>
            <p className="text-gray-500 mb-4">
              Sistem sedang dalam tahap pengembangan. Admin sedang menambahkan data ekstrakurikuler.
            </p>
            <Button onClick={fetchExtracurriculars} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Muat Ulang
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
