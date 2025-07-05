
import { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Upload, Calendar, FileText, Award, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const StudentAchievementForm = () => {
  const { studentData, isLoading: userLoading, error: userError } = useUserProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    achievement_type_id: '',
    achievement_date: '',
    description: '',
    certificate_url: ''
  });

  // Get achievement types
  const { data: achievementTypes } = useQuery({
    queryKey: ['achievement-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_types')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Get student's achievements
  const { data: studentAchievements, isLoading } = useQuery({
    queryKey: ['student-achievements', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return [];

      const { data, error } = await supabase
        .from('student_achievements')
        .select(`
          *,
          achievement_types (name, category, level, point_reward)
        `)
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentData?.id,
  });

  // Submit achievement mutation
  const submitAchievementMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!studentData?.id) throw new Error('Student data not found');

      const { error } = await supabase
        .from('student_achievements')
        .insert({
          student_id: studentData.id,
          achievement_type_id: data.achievement_type_id,
          achievement_date: data.achievement_date,
          description: data.description,
          certificate_url: data.certificate_url,
          status: 'pending' // Menunggu verifikasi wali kelas
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Berhasil!",
        description: "Prestasi berhasil diajukan dan menunggu verifikasi wali kelas.",
      });
      setFormData({
        achievement_type_id: '',
        achievement_date: '',
        description: '',
        certificate_url: ''
      });
      queryClient.invalidateQueries({ queryKey: ['student-achievements'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal mengajukan prestasi. Silakan coba lagi.",
        variant: "destructive",
      });
      console.error('Error submitting achievement:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.achievement_type_id || !formData.achievement_date) {
      toast({
        title: "Error",
        description: "Mohon lengkapi form yang wajib diisi.",
        variant: "destructive",
      });
      return;
    }
    submitAchievementMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Terverifikasi</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary">Menunggu Verifikasi</Badge>;
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (userError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-red-600">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p className="font-medium">Terjadi Kesalahan</p>
            <p className="text-sm mt-2">{userError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!studentData) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-orange-600">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p className="font-medium">Data Siswa Tidak Ditemukan</p>
            <p className="text-sm mt-2">
              Sistem sedang menyiapkan data siswa Anda. Silakan refresh halaman dalam beberapa saat.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6 text-yellow-600" />
        <h1 className="text-2xl font-bold">Prestasi Saya</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Input Prestasi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Ajukan Prestasi Baru
            </CardTitle>
            <CardDescription>
              Laporkan prestasi yang baru Anda raih untuk mendapat verifikasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="achievement_type_id">Jenis Prestasi*</Label>
                <Select
                  value={formData.achievement_type_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, achievement_type_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis prestasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {achievementTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.category} - {type.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="achievement_date">Tanggal Prestasi*</Label>
                <Input
                  id="achievement_date"
                  type="date"
                  value={formData.achievement_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, achievement_date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Prestasi</Label>
                <Textarea
                  id="description"
                  placeholder="Jelaskan prestasi yang Anda raih..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificate_url">URL Sertifikat/Bukti</Label>
                <Input
                  id="certificate_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.certificate_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, certificate_url: e.target.value }))}
                />
                <p className="text-xs text-gray-500">
                  Link ke sertifikat atau bukti prestasi (opsional)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitAchievementMutation.isPending}
              >
                {submitAchievementMutation.isPending ? (
                  "Mengajukan..."
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Ajukan Prestasi
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Daftar Prestasi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Riwayat Prestasi
            </CardTitle>
            <CardDescription>
              Daftar prestasi yang pernah Anda ajukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : studentAchievements?.length ? (
                studentAchievements.map((achievement: any) => (
                  <div key={achievement.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {achievement.achievement_types?.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {achievement.achievement_types?.category} - {achievement.achievement_types?.level}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {format(new Date(achievement.achievement_date), 'dd MMM yyyy', { locale: id })}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(achievement.status)}
                    </div>
                    
                    {achievement.description && (
                      <p className="text-xs text-gray-600 mt-2">
                        {achievement.description}
                      </p>
                    )}
                    
                    {achievement.certificate_url && (
                      <div className="mt-2">
                        <a
                          href={achievement.certificate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          Lihat Sertifikat
                        </a>
                      </div>
                    )}

                    {achievement.status === 'verified' && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                        <strong>+{achievement.achievement_types?.point_reward} poin</strong> telah ditambahkan ke skor disiplin Anda
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada prestasi yang diajukan</p>
                  <p className="text-xs mt-1">Mulai ajukan prestasi pertama Anda!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
