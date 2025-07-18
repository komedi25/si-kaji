
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AIRecommendations } from '@/components/ai/AIRecommendations';
import { AIConfiguration } from '@/components/ai/AIConfiguration';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { APIKeyManager } from '@/components/ai/APIKeyManager';
import { AIUsageStats } from '@/components/ai/AIUsageStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Settings, Key, BarChart3, MessageSquare, Lightbulb } from 'lucide-react';

const AIManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('recommendations');

  // Get real AI recommendations count
  const { data: aiRecommendationsCount } = useQuery({
    queryKey: ['ai-recommendations-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('ai_recommendations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Get real AI usage count for today
  const { data: todayUsageCount } = useQuery({
    queryKey: ['ai-usage-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Get total tokens used today
  const { data: tokensUsedToday } = useQuery({
    queryKey: ['tokens-used-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('tokens_used')
        .gte('created_at', today);
      
      if (error) throw error;
      return data?.reduce((sum, log) => sum + log.tokens_used, 0) || 0;
    },
  });

  // Check AI system status based on recent activity
  const { data: aiStatus } = useQuery({
    queryKey: ['ai-system-status'],
    queryFn: async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('id')
        .gte('created_at', fiveMinutesAgo)
        .limit(1);
      
      if (error) throw error;
      return data && data.length > 0 ? 'Online' : 'Idle';
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Assistant & Analytics
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Sistem AI untuk analisis otomatis, rekomendasi, dan bantuan cerdas dalam manajemen sekolah
          </p>
        </div>

        {/* Real Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Lightbulb className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                <div className="text-2xl font-bold">{aiRecommendationsCount || 0}</div>
                <div className="text-sm text-muted-foreground">Rekomendasi Aktif</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <MessageSquare className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold">{todayUsageCount || 0}</div>
                <div className="text-sm text-muted-foreground">Penggunaan Hari Ini</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold">{tokensUsedToday ? `${(tokensUsedToday / 1000).toFixed(1)}K` : '0'}</div>
                <div className="text-sm text-muted-foreground">Token Terpakai</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Brain className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold">
                  <Badge variant={aiStatus === 'Online' ? 'default' : 'secondary'}>
                    {aiStatus || 'Unknown'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">Status AI</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Rekomendasi</span>
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Konfigurasi</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Rekomendasi AI
                </CardTitle>
                <CardDescription>
                  Rekomendasi otomatis berdasarkan analisis data siswa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIRecommendations />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assistant" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Chat dengan AI untuk mendapatkan insight dan bantuan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIAssistant />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            <AIConfiguration />
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-4">
            <APIKeyManager />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AIUsageStats />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AIManagement;
