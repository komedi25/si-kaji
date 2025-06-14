
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIRecommendationFilters } from '@/components/ai/AIRecommendationFilters';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAI } from '@/hooks/useAI';
import { 
  Lightbulb, 
  User, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  X,
  Eye,
  UserCheck,
  RefreshCw
} from 'lucide-react';

interface AIRecommendation {
  id: string;
  student_id: string;
  recommendation_type: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  assigned_role: string;
  assigned_to: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  metadata: any;
  students?: {
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

export function AIRecommendations() {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const { generateAutomaticRecommendation, loading: aiLoading } = useAI();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
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

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select(`
          *,
          students (
            full_name,
            nis
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecommendations((data as AIRecommendation[]) || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Gagal memuat rekomendasi AI",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRecommendationStatus = async (id: string, status: string) => {
    setUpdatingStatus(id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('ai_recommendations')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', id);

      if (error) throw error;

      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === id 
            ? { ...rec, status: status as any, reviewed_at: new Date().toISOString(), reviewed_by: user?.id || null }
            : rec
        )
      );

      toast({
        title: "Berhasil",
        description: `Status rekomendasi berhasil diubah menjadi ${getStatusLabel(status)}`
      });
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status rekomendasi",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const generateNewRecommendations = async () => {
    try {
      // Get students that need analysis based on recent activities
      const { data: studentsWithIssues } = await supabase
        .from('students')
        .select('id')
        .limit(5); // Limit to prevent too many requests

      if (studentsWithIssues) {
        for (const student of studentsWithIssues) {
          await generateAutomaticRecommendation(student.id);
        }
      }

      toast({
        title: "Berhasil",
        description: "Rekomendasi AI baru sedang diproses"
      });

      // Refresh recommendations after a short delay
      setTimeout(() => {
        fetchRecommendations();
      }, 2000);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Error",
        description: "Gagal membuat rekomendasi baru",
        variant: "destructive"
      });
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (filters.status !== 'all' && rec.status !== filters.status) return false;
    if (filters.priority !== 'all' && rec.priority !== filters.priority) return false;
    if (filters.type !== 'all' && rec.recommendation_type !== filters.type) return false;
    if (filters.assignedRole !== 'all' && rec.assigned_role !== filters.assignedRole) return false;
    if (filters.search && !rec.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !rec.students?.full_name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      type: 'all',
      assignedRole: 'all',
      search: ''
    });
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'in_progress': return 'default';
      case 'completed': return 'default';
      case 'dismissed': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Mendesak';
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'in_progress': return 'Dalam Proses';
      case 'completed': return 'Selesai';
      case 'dismissed': return 'Diabaikan';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'behavioral_intervention': return 'Intervensi Perilaku';
      case 'achievement_opportunity': return 'Peluang Prestasi';
      case 'academic_support': return 'Dukungan Akademik';
      case 'discipline_recommendation': return 'Rekomendasi Disiplin';
      case 'behavioral_analysis': return 'Analisis Perilaku';
      default: return type;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'wali_kelas': return 'Wali Kelas';
      case 'guru_bk': return 'Guru BK';
      case 'tppk': return 'TPPK';
      case 'arps': return 'ARPS';
      case 'p4gn': return 'P4GN';
      default: return role;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div>Memuat rekomendasi AI...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Rekomendasi AI</h3>
          <p className="text-sm text-muted-foreground">
            {filteredRecommendations.length} dari {recommendations.length} rekomendasi
          </p>
        </div>
        
        {hasRole('admin') && (
          <Button 
            onClick={generateNewRecommendations}
            disabled={aiLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${aiLoading ? 'animate-spin' : ''}`} />
            {aiLoading ? 'Memproses...' : 'Generate Rekomendasi'}
          </Button>
        )}
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
          <CardContent className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground">
              {recommendations.length === 0 
                ? "Belum ada rekomendasi AI. Klik 'Generate Rekomendasi' untuk membuat yang baru."
                : "Tidak ada rekomendasi yang sesuai dengan filter yang dipilih."
              }
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((recommendation) => (
            <Card key={recommendation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityBadgeVariant(recommendation.priority)}>
                        {getPriorityLabel(recommendation.priority)}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(recommendation.status)}>
                        {getStatusLabel(recommendation.status)}
                      </Badge>
                      <Badge variant="outline">
                        {getTypeLabel(recommendation.recommendation_type)}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {recommendation.students?.full_name} ({recommendation.students?.nis})
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(recommendation.created_at).toLocaleDateString('id-ID')}
                      </div>
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-4 w-4" />
                        {getRoleLabel(recommendation.assigned_role)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm">{recommendation.content}</div>
                  </div>

                  {recommendation.metadata && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>Analisis:</strong> Skor Disiplin: {recommendation.metadata.student_score || 'N/A'} | 
                        Tingkat Kehadiran: {recommendation.metadata.attendance_rate ? `${recommendation.metadata.attendance_rate.toFixed(1)}%` : 'N/A'} | 
                        Jumlah Pelanggaran: {recommendation.metadata.violation_count || 0}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  {recommendation.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateRecommendationStatus(recommendation.id, 'in_progress')}
                        disabled={updatingStatus === recommendation.id}
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-4 w-4" />
                        Proses
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRecommendationStatus(recommendation.id, 'completed')}
                        disabled={updatingStatus === recommendation.id}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Selesai
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRecommendationStatus(recommendation.id, 'dismissed')}
                        disabled={updatingStatus === recommendation.id}
                        className="flex items-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        Abaikan
                      </Button>
                    </div>
                  )}

                  {recommendation.status === 'in_progress' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateRecommendationStatus(recommendation.id, 'completed')}
                        disabled={updatingStatus === recommendation.id}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Selesai
                      </Button>
                    </div>
                  )}

                  {recommendation.reviewed_at && (
                    <div className="text-xs text-muted-foreground">
                      Diperbarui: {new Date(recommendation.reviewed_at).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
