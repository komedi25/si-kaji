
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Award, Plus, Calendar, Trophy, Star, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Achievement {
  id: string;
  achievement_date: string;
  description?: string;
  certificate_url?: string;
  point_reward: number;
  status: string;
  achievement_types?: {
    name: string;
    category: string;
  };
}

export const SimpleStudentAchievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get student data first
      let { data: student, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching student:', error);
        throw error;
      }

      if (!student) {
        // Try to find by profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('nis')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.nis) {
          const { data: studentByNis } = await supabase
            .from('students')
            .select('id')
            .eq('nis', profile.nis)
            .is('user_id', null)
            .maybeSingle();

          if (studentByNis) {
            await supabase
              .from('students')
              .update({ user_id: user.id })
              .eq('id', studentByNis.id);
            
            student = studentByNis;
          }
        }
      }

      if (student) {
        setStudentId(student.id);
        await fetchAchievements(student.id);
      }

    } catch (error) {
      console.error('Error in fetchStudentData:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_achievements')
        .select(`
          *,
          achievement_types (
            name,
            category
          )
        `)
        .eq('student_id', studentId)
        .order('achievement_date', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      verified: 'default',
      rejected: 'destructive'
    } as const;

    const labels = {
      pending: 'Menunggu Verifikasi',
      verified: 'Terverifikasi',
      rejected: 'Ditolak'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'akademik':
        return <Trophy className="h-4 w-4 text-yellow-600" />;
      case 'non-akademik':
        return <Star className="h-4 w-4 text-blue-600" />;
      case 'karakter':
        return <Award className="h-4 w-4 text-green-600" />;
      default:
        return <Award className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Memuat data prestasi...</span>
      </div>
    );
  }

  if (!studentId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Award className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Data Tidak Ditemukan</h3>
          <p className="text-gray-500">Data siswa Anda belum tersedia dalam sistem. Silakan hubungi administrator sekolah.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prestasi Saya</h1>
          <p className="text-gray-600">Lihat dan tambahkan prestasi yang telah Anda raih</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Prestasi
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Total Prestasi</div>
                <div className="text-xl font-bold text-blue-600">
                  {achievements.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Terverifikasi</div>
                <div className="text-xl font-bold text-green-600">
                  {achievements.filter(a => a.status === 'verified').length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Total Poin</div>
                <div className="text-xl font-bold text-yellow-600">
                  {achievements.filter(a => a.status === 'verified').reduce((sum, a) => sum + a.point_reward, 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Menunggu</div>
                <div className="text-xl font-bold text-orange-600">
                  {achievements.filter(a => a.status === 'pending').length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Daftar Prestasi</h3>
        
        {achievements.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Award className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Prestasi</h3>
              <p className="text-gray-500 mb-4">Mulai catat prestasi yang telah Anda raih</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Prestasi Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          achievements.map((achievement) => (
            <Card key={achievement.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(achievement.achievement_types?.category || '')}
                    <div>
                      <CardTitle className="text-lg">
                        {achievement.achievement_types?.name || 'Prestasi'}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(achievement.achievement_date), 'dd MMMM yyyy', { locale: id })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">+{achievement.point_reward} poin</Badge>
                    {getStatusBadge(achievement.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {achievement.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                )}
                
                {achievement.certificate_url && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <a 
                      href={achievement.certificate_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Lihat Sertifikat
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
