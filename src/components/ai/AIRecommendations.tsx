
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Check, X, Clock, AlertTriangle, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface AIRecommendation {
  id: string;
  student_id: string;
  recommendation_type: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'accepted' | 'rejected' | 'implemented';
  assigned_to?: string;
  assigned_role?: string;
  created_at: string;
  metadata?: any;
  student?: {
    full_name: string;
    nis: string;
  };
}

const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  implemented: 'bg-blue-100 text-blue-800'
};

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');
  const { toast } = useToast();

  const loadRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select(`
          *,
          students!inner(full_name, nis)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRecommendations(data.map(item => ({
        ...item,
        student: item.students
      })));
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast({
        title: "Error",
        description: "Gagal memuat rekomendasi AI",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRecommendationStatus = async (id: string, status: string, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('ai_recommendations')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          metadata: notes ? { review_notes: notes } : undefined
        })
        .eq('id', id);

      if (error) throw error;

      await loadRecommendations();
      
      toast({
        title: "Berhasil",
        description: `Rekomendasi telah ${status === 'accepted' ? 'diterima' : 'ditolak'}`
      });
    } catch (error) {
      console.error('Error updating recommendation:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status rekomendasi",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const filteredRecommendations = recommendations.filter(rec => {
    if (selectedTab === 'all') return true;
    return rec.status === selectedTab;
  });

  const RecommendationCard = ({ recommendation }: { recommendation: AIRecommendation }) => {
    const [notes, setNotes] = useState('');
    const [showActions, setShowActions] = useState(false);

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                {recommendation.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {recommendation.student?.full_name} - {recommendation.student?.nis}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge className={PRIORITY_COLORS[recommendation.priority]}>
                {recommendation.priority.toUpperCase()}
              </Badge>
              <Badge className={STATUS_COLORS[recommendation.status]}>
                {recommendation.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-line">
              {recommendation.content}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(new Date(recommendation.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
            </span>
            {recommendation.assigned_role && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Untuk: {recommendation.assigned_role}
              </span>
            )}
          </div>

          {recommendation.status === 'pending' && (
            <div className="space-y-3 pt-3 border-t">
              {showActions ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Tambahkan catatan (opsional)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateRecommendationStatus(recommendation.id, 'accepted', notes)}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Terima
                    </Button>
                    <Button
                      onClick={() => updateRecommendationStatus(recommendation.id, 'rejected', notes)}
                      variant="destructive"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Tolak
                    </Button>
                    <Button
                      onClick={() => setShowActions(false)}
                      variant="outline"
                      size="sm"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowActions(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Review Rekomendasi
                </Button>
              )}
            </div>
          )}

          {recommendation.metadata?.review_notes && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Catatan Review:</strong> {recommendation.metadata.review_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Bot className="h-8 w-8 mx-auto text-gray-400 animate-pulse" />
          <p className="text-gray-500 mt-2">Memuat rekomendasi AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rekomendasi AI</h2>
          <p className="text-gray-600">Tinjau dan kelola rekomendasi dari AI</p>
        </div>
        <Button onClick={loadRecommendations} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({recommendations.filter(r => r.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="accepted">Diterima ({recommendations.filter(r => r.status === 'accepted').length})</TabsTrigger>
          <TabsTrigger value="rejected">Ditolak ({recommendations.filter(r => r.status === 'rejected').length})</TabsTrigger>
          <TabsTrigger value="all">Semua ({recommendations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {filteredRecommendations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Bot className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Belum ada rekomendasi
                </h3>
                <p className="text-gray-500 text-center">
                  {selectedTab === 'pending' 
                    ? 'Belum ada rekomendasi yang perlu ditinjau'
                    : `Belum ada rekomendasi dengan status ${selectedTab}`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div>
              {filteredRecommendations.map(recommendation => (
                <RecommendationCard 
                  key={recommendation.id} 
                  recommendation={recommendation} 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
