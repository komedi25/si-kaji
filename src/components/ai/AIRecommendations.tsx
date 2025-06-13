
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIRecommendationFilters } from '@/components/ai/AIRecommendationFilters';
import { Brain, TrendingUp, AlertTriangle, Award, Users, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIRecommendation {
  id: string;
  title: string;
  content: string;
  recommendation_type: string;
  priority: string;
  status: string;
  student_id: string;
  assigned_role: string;
  created_at: string;
  reviewed_at?: string;
  student?: {
    full_name: string;
    nis: string;
  };
}

interface FilterOptions {
  status: string;
  priority: string;
  type: string;
  assignedRole: string;
  search: string;
}

export const AIRecommendations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
    type: 'all',
    assignedRole: 'all',
    search: ''
  });

  useEffect(() => {
    fetchRecommendations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [recommendations, filters]);

  const fetchRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select(`
          *,
          student:students(full_name, nis)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...recommendations];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(rec => 
        rec.title.toLowerCase().includes(searchLower) ||
        rec.content.toLowerCase().includes(searchLower) ||
        rec.student?.full_name.toLowerCase().includes(searchLower) ||
        rec.student?.nis.includes(filters.search)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(rec => rec.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(rec => rec.priority === filters.priority);
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(rec => rec.recommendation_type === filters.type);
    }

    // Assigned role filter
    if (filters.assignedRole !== 'all') {
      filtered = filtered.filter(rec => rec.assigned_role === filters.assignedRole);
    }

    setFilteredRecommendations(filtered);
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      type: 'all',
      assignedRole: 'all',
      search: ''
    });
  };

  const generateRecommendations = async () => {
    setGenerating(true);
    try {
      // Mock AI recommendation generation
      const mockRecommendations = [
        {
          student_id: 'mock-student-1',
          title: 'Intervensi untuk Siswa dengan Absensi Rendah',
          content: 'Berdasarkan analisis data, siswa Ahmad menunjukkan pola absensi yang menurun dalam 3 minggu terakhir. Tingkat kehadiran turun dari 95% menjadi 78%. Disarankan untuk melakukan konseling personal untuk mengidentifikasi masalah yang dihadapi.',
          recommendation_type: 'behavioral_intervention',
          priority: 'high',
          assigned_role: 'guru_bk',
          metadata: {
            attendance_rate: 78,
            previous_rate: 95,
            analysis_period: '3 weeks'
          }
        },
        {
          student_id: 'mock-student-2',
          title: 'Peluang Olimpiade Matematika',
          content: 'Siti menunjukkan prestasi konsisten dalam mata pelajaran matematika dengan nilai rata-rata 92. Berdasarkan pola pembelajaran dan kemampuan problem solving, disarankan untuk diikutsertakan dalam pelatihan olimpiade matematika.',
          recommendation_type: 'achievement_opportunity',
          priority: 'medium',
          assigned_role: 'wali_kelas',
          metadata: {
            subject: 'matematika',
            average_score: 92,
            recommendation_confidence: 0.85
          }
        },
        {
          student_id: 'mock-student-3',
          title: 'Program Remedial Bahasa Inggris',
          content: 'Budi memerlukan dukungan tambahan dalam bahasa Inggris. Nilai semester menurun dari 75 menjadi 60. Disarankan untuk mengikuti program remedial dan bimbingan khusus.',
          recommendation_type: 'academic_support',
          priority: 'medium',
          assigned_role: 'wali_kelas',
          metadata: {
            subject: 'bahasa_inggris',
            current_score: 60,
            previous_score: 75
          }
        }
      ];

      // Insert mock recommendations
      for (const rec of mockRecommendations) {
        await supabase.from('ai_recommendations').insert({
          ...rec,
          created_by_ai: true
        });
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
      case 'urgent':
        return <Badge variant="destructive">Mendesak</Badge>;
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
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Menunggu</Badge>;
      case 'in_progress':
        return <Badge variant="default"><RefreshCw className="w-3 h-3 mr-1" />Dalam Proses</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Selesai</Badge>;
      case 'dismissed':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Diabaikan</Badge>;
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
      case 'discipline_recommendation':
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <Brain className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'behavioral_intervention':
        return 'Intervensi Perilaku';
      case 'achievement_opportunity':
        return 'Peluang Prestasi';
      case 'academic_support':
        return 'Dukungan Akademik';
      case 'discipline_recommendation':
        return 'Rekomendasi Disiplin';
      default:
        return type;
    }
  };

  if (loading) {
    return <div>Memuat rekomendasi AI...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header and Generate Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Rekomendasi AI</h3>
          <p className="text-sm text-muted-foreground">
            Showing {filteredRecommendations.length} of {recommendations.length} recommendations
          </p>
        </div>
        <Button 
          onClick={generateRecommendations}
          disabled={generating}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Menganalisis...' : 'Perbarui Analisis'}
        </Button>
      </div>

      {/* Filters */}
      <AIRecommendationFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
      />

      {/* Recommendations List */}
      {filteredRecommendations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {recommendations.length === 0 
                  ? 'Belum ada rekomendasi AI. Klik "Perbarui Analisis" untuk memulai.'
                  : 'Tidak ada rekomendasi yang sesuai dengan filter.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((rec) => (
            <Card key={rec.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getTypeIcon(rec.recommendation_type)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1">{rec.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>{getTypeLabel(rec.recommendation_type)}</span>
                        {rec.student && (
                          <>
                            <span>•</span>
                            <span>{rec.student.full_name} ({rec.student.nis})</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(rec.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getPriorityBadge(rec.priority)}
                    {getStatusBadge(rec.status)}
                  </div>
                </div>

                <p className="text-sm mb-4 text-gray-700 leading-relaxed">{rec.content}</p>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    Ditugaskan ke: <span className="capitalize">{rec.assigned_role?.replace('_', ' ')}</span>
                    {rec.reviewed_at && (
                      <span className="ml-4">
                        Direview: {new Date(rec.reviewed_at).toLocaleDateString('id-ID')}
                      </span>
                    )}
                  </div>

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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
