
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, AlertTriangle, Award, Users, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIRecommendation {
  id: string;
  title: string;
  content: string;
  recommendation_type: string;
  priority: string;
  status: string;
  student_id: string;
  created_at: string;
  student?: {
    full_name: string;
    nis: string;
  };
}

export const AIRecommendations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select(`
          *,
          student:students(full_name, nis)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    setGenerating(true);
    try {
      // Simulate AI analysis - in real implementation, this would call AI service
      const mockRecommendations = [
        {
          student_id: 'mock-student-1',
          title: 'Perhatian Khusus Diperlukan',
          content: 'Siswa menunjukkan penurunan kehadiran dalam 2 minggu terakhir. Disarankan untuk melakukan konseling.',
          recommendation_type: 'behavioral_intervention',
          priority: 'high',
          assigned_role: 'guru_bk'
        },
        {
          student_id: 'mock-student-2',
          title: 'Potensi Prestasi Akademik',
          content: 'Berdasarkan analisis, siswa memiliki potensi untuk mengikuti olimpiade matematika.',
          recommendation_type: 'achievement_opportunity',
          priority: 'medium',
          assigned_role: 'wali_kelas'
        }
      ];

      // Insert mock recommendations
      for (const rec of mockRecommendations) {
        await supabase.from('ai_recommendations').insert(rec);
      }

      toast({
        title: "Berhasil",
        description: "Rekomendasi AI berhasil diperbarui"
      });

      fetchRecommendations();
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Error",
        description: "Gagal menghasilkan rekomendasi",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const updateRecommendationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ 
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Status rekomendasi diperbarui"
      });

      fetchRecommendations();
    } catch (error) {
      console.error('Error updating recommendation:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status",
        variant: "destructive"
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Tinggi</Badge>;
      case 'medium':
        return <Badge variant="secondary">Sedang</Badge>;
      case 'low':
        return <Badge variant="outline">Rendah</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Menunggu</Badge>;
      case 'in_progress':
        return <Badge variant="default">Dalam Proses</Badge>;
      case 'completed':
        return <Badge variant="default">Selesai</Badge>;
      case 'dismissed':
        return <Badge variant="outline">Diabaikan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'behavioral_intervention':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'achievement_opportunity':
        return <Award className="w-4 h-4 text-yellow-500" />;
      case 'academic_support':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default:
        return <Brain className="w-4 h-4 text-gray-500" />;
    }
  };

  const filterByType = (type: string) => {
    return recommendations.filter(rec => rec.recommendation_type === type);
  };

  if (loading) {
    return <div>Memuat rekomendasi AI...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Rekomendasi AI
            </CardTitle>
            <Button 
              onClick={generateRecommendations}
              disabled={generating}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Menganalisis...' : 'Perbarui Analisis'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="behavioral">Perilaku</TabsTrigger>
              <TabsTrigger value="achievement">Prestasi</TabsTrigger>
              <TabsTrigger value="academic">Akademik</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada rekomendasi AI. Klik "Perbarui Analisis" untuk memulai.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <Card key={rec.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(rec.recommendation_type)}
                            <h3 className="font-semibold">{rec.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(rec.priority)}
                            {getStatusBadge(rec.status)}
                          </div>
                        </div>

                        {rec.student && (
                          <div className="text-sm text-muted-foreground mb-2">
                            Siswa: {rec.student.full_name} ({rec.student.nis})
                          </div>
                        )}

                        <p className="text-sm mb-4">{rec.content}</p>

                        <div className="flex gap-2">
                          {rec.status === 'pending' && (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => updateRecommendationStatus(rec.id, 'in_progress')}
                              >
                                Tindak Lanjuti
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateRecommendationStatus(rec.id, 'dismissed')}
                              >
                                Abaikan
                              </Button>
                            </>
                          )}
                          {rec.status === 'in_progress' && (
                            <Button 
                              size="sm"
                              onClick={() => updateRecommendationStatus(rec.id, 'completed')}
                            >
                              Selesai
                            </Button>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(rec.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="behavioral" className="space-y-4">
              {filterByType('behavioral_intervention').map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <h3 className="font-semibold">{rec.title}</h3>
                      {getPriorityBadge(rec.priority)}
                    </div>
                    <p className="text-sm">{rec.content}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="achievement" className="space-y-4">
              {filterByType('achievement_opportunity').map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <h3 className="font-semibold">{rec.title}</h3>
                      {getPriorityBadge(rec.priority)}
                    </div>
                    <p className="text-sm">{rec.content}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="academic" className="space-y-4">
              {filterByType('academic_support').map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <h3 className="font-semibold">{rec.title}</h3>
                      {getPriorityBadge(rec.priority)}
                    </div>
                    <p className="text-sm">{rec.content}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
