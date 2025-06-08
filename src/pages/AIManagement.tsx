
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, Brain, FileText, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AIManagement() {
  const [usageStats, setUsageStats] = useState({
    totalRequests: 0,
    thisMonth: 0,
    remainingQuota: 100,
    topFeature: 'Analisis Perilaku'
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    loadUsageStats();
    loadRecentActivities();
  }, []);

  const loadUsageStats = async () => {
    try {
      // Get total requests using RPC call since TypeScript types haven't been regenerated yet
      const { data: totalData, error: totalError } = await supabase.rpc('get_ai_usage_count');
      
      // Get this month's requests
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthData, error: monthError } = await supabase.rpc('get_ai_usage_count_since', {
        since_date: startOfMonth.toISOString()
      });

      // Get most used task type
      const { data: taskStats, error: taskError } = await supabase.rpc('get_ai_task_stats', {
        since_date: startOfMonth.toISOString()
      });

      const totalCount = totalData || 0;
      const monthCount = monthData || 0;
      
      let topTask = 'Analisis Perilaku';
      if (taskStats && taskStats.length > 0) {
        const topTaskData = taskStats[0];
        topTask = topTaskData.task_type === 'analyze_behavior' ? 'Analisis Perilaku' : 
                 topTaskData.task_type === 'generate_letter' ? 'Generate Surat' :
                 topTaskData.task_type === 'summarize_case' ? 'Ringkas Kasus' : 'Analisis Perilaku';
      }

      setUsageStats({
        totalRequests: totalCount,
        thisMonth: monthCount,
        remainingQuota: Math.max(0, 100 - monthCount),
        topFeature: topTask
      });
    } catch (error) {
      console.error('Error loading usage stats:', error);
      // Use default values if there's an error
      setUsageStats({
        totalRequests: 0,
        thisMonth: 0,
        remainingQuota: 100,
        topFeature: 'Analisis Perilaku'
      });
    }
  };

  const loadRecentActivities = async () => {
    try {
      const { data, error } = await supabase.rpc('get_recent_ai_activities', {
        limit_count: 5
      });

      if (error) {
        console.error('Error loading recent activities:', error);
        setDefaultActivities();
        return;
      }

      const activities = data?.map((log: any) => ({
        id: log.id,
        type: log.task_type,
        title: getActivityTitle(log.task_type),
        timestamp: formatTimestamp(log.created_at),
        status: 'completed',
        user: log.user_name || 'Unknown'
      })) || [];

      setRecentActivities(activities.length > 0 ? activities : getDefaultActivities());
    } catch (error) {
      console.error('Error loading recent activities:', error);
      setDefaultActivities();
    }
  };

  const setDefaultActivities = () => {
    setRecentActivities(getDefaultActivities());
  };

  const getDefaultActivities = () => [
    {
      id: 1,
      type: 'system',
      title: 'Sistem AI siap digunakan',
      timestamp: 'Baru saja',
      status: 'completed',
      user: 'Sistem'
    }
  ];

  const getActivityTitle = (taskType: string) => {
    switch (taskType) {
      case 'analyze_behavior':
        return 'Analisis perilaku siswa';
      case 'generate_letter':
        return 'Generate surat keterangan';
      case 'summarize_case':
        return 'Ringkasan kasus siswa';
      case 'discipline_recommendation':
        return 'Rekomendasi tindakan disiplin';
      default:
        return 'Proses AI selesai';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Baru saja';
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} hari yang lalu`;
  };

  const aiFeatures = [
    {
      icon: Users,
      title: 'Analisis Perilaku Siswa',
      description: 'Analisis pola perilaku dan kedisiplinan siswa berdasarkan data historis',
      usage: usageStats.totalRequests,
      color: 'bg-blue-500'
    },
    {
      icon: FileText,
      title: 'Generator Surat',
      description: 'Otomatis generate berbagai jenis surat kesiswaan',
      usage: Math.floor(usageStats.totalRequests * 0.3),
      color: 'bg-green-500'
    },
    {
      icon: Brain,
      title: 'Rekomendasi Tindakan',
      description: 'Saran tindakan pembinaan berdasarkan analisis AI',
      usage: Math.floor(usageStats.totalRequests * 0.4),
      color: 'bg-purple-500'
    },
    {
      icon: MessageSquare,
      title: 'Ringkasan Kasus',
      description: 'Ringkasan otomatis untuk kasus siswa',
      usage: Math.floor(usageStats.totalRequests * 0.2),
      color: 'bg-orange-500'
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Management</h1>
            <p className="text-gray-600">Kelola dan gunakan fitur AI untuk kesiswaan</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Bot className="h-4 w-4 mr-1" />
            AI Enabled
          </Badge>
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Request</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.totalRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Sejak implementasi</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{usageStats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">Request AI</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quota Tersisa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{usageStats.remainingQuota}%</div>
              <Progress value={usageStats.remainingQuota} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Fitur Terpopuler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{usageStats.topFeature}</div>
              <p className="text-xs text-muted-foreground">Paling sering digunakan</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="assistant" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
            <TabsTrigger value="features">Fitur AI</TabsTrigger>
            <TabsTrigger value="activity">Aktivitas Terkini</TabsTrigger>
          </TabsList>

          <TabsContent value="assistant">
            <AIAssistant />
          </TabsContent>

          <TabsContent value="features">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiFeatures.map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${feature.color}`}>
                        <feature.icon className="h-4 w-4 text-white" />
                      </div>
                      {feature.title}
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Penggunaan:</span>
                      <Badge variant="outline">{feature.usage} kali</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Aktivitas AI Terkini</CardTitle>
                <CardDescription>Riwayat penggunaan AI dalam sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.timestamp} • {activity.user}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        {activity.status === 'completed' ? 'Selesai' : 'Proses'}
                      </Badge>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Belum ada aktivitas AI. Mulai gunakan fitur AI untuk melihat riwayat di sini.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
