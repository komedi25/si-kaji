
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

interface Achievement {
  id: string;
  achievement_date: string;
  description: string;
  point_reward: number;
  status: string;
  certificate_url?: string;
  student?: {
    full_name: string;
    nis: string;
  };
  achievement_types?: {
    name: string;
    level: string;
  };
}

export const AchievementVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingAchievements();
  }, []);

  const fetchPendingAchievements = async () => {
    const { data, error } = await supabase
      .from('student_achievements')
      .select(`
        *,
        student:students(full_name, nis),
        achievement_types(name, level)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching achievements:', error);
    } else {
      setAchievements(data || []);
    }
    setLoading(false);
  };

  const handleVerification = async (achievementId: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('student_achievements')
        .update({
          status,
          verified_by: user?.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', achievementId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Prestasi ${status === 'verified' ? 'diverifikasi' : 'ditolak'}`
      });

      fetchPendingAchievements();
    } catch (error) {
      console.error('Error updating achievement:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status prestasi",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div>Memuat data verifikasi...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verifikasi Prestasi Siswa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {achievements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Tidak ada prestasi yang menunggu verifikasi
            </p>
          ) : (
            achievements.map((achievement) => (
              <div key={achievement.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">
                      {achievement.student?.full_name} - {achievement.student?.nis}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {achievement.achievement_types?.name} - {achievement.achievement_types?.level}
                    </p>
                  </div>
                  <Badge variant="secondary">+{achievement.point_reward} poin</Badge>
                </div>
                
                <p className="text-sm">{achievement.description}</p>
                
                <div className="text-xs text-muted-foreground">
                  Tanggal: {new Date(achievement.achievement_date).toLocaleDateString('id-ID')}
                </div>

                {achievement.certificate_url && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={achievement.certificate_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4 mr-1" />
                        Lihat Sertifikat
                      </a>
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleVerification(achievement.id, 'verified')}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verifikasi
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleVerification(achievement.id, 'rejected')}
                    className="flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
