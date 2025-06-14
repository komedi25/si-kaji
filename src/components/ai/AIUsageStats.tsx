import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Activity, DollarSign, Clock, TrendingUp, RefreshCw, Calendar } from 'lucide-react';

interface UsageStats {
  total_usage: number;
  total_cost: number;
  avg_tokens_per_request: number;
  most_used_provider: string;
  most_common_task: string;
}

interface ProviderStats {
  provider: string;
  count: number;
  cost: number;
  avg_tokens: number;
}

interface TaskStats {
  task_type: string;
  count: number;
}

interface DailyUsage {
  date: string;
  count: number;
  cost: number;
  tokens: number;
}

interface RecentActivity {
  id: string;
  task_type: string;
  created_at: string;
  user_name: string;
  provider: string;
  tokens_used: number;
}

export function AIUsageStats() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [providerStats, setProviderStats] = useState<ProviderStats[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchUsageStats();
  }, [timeRange]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '1d':
        start.setDate(end.getDate() - 1);
        break;
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const fetchUsageStats = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      // Get overall stats
      const { data: usageData, error: usageError } = await supabase
        .from('ai_usage_logs')
        .select('provider, task_type, tokens_used, cost, created_at')
        .gte('created_at', start)
        .lte('created_at', end);

      if (usageError) throw usageError;

      const totalUsage = usageData?.length || 0;
      const totalCost = usageData?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0;
      const totalTokens = usageData?.reduce((sum, item) => sum + item.tokens_used, 0) || 0;
      const avgTokens = totalUsage > 0 ? Math.round(totalTokens / totalUsage) : 0;

      // Find most used provider and task
      const providerCounts: Record<string, number> = {};
      const taskCounts: Record<string, number> = {};

      usageData?.forEach(item => {
        providerCounts[item.provider] = (providerCounts[item.provider] || 0) + 1;
        taskCounts[item.task_type] = (taskCounts[item.task_type] || 0) + 1;
      });

      const mostUsedProvider = Object.entries(providerCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
      const mostCommonTask = Object.entries(taskCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

      setStats({
        total_usage: totalUsage,
        total_cost: totalCost,
        avg_tokens_per_request: avgTokens,
        most_used_provider: mostUsedProvider,
        most_common_task: mostCommonTask
      });

      // Provider stats
      const providerStatsData: ProviderStats[] = Object.entries(providerCounts).map(([provider, count]) => {
        const providerData = usageData?.filter(item => item.provider === provider) || [];
        const cost = providerData.reduce((sum, item) => sum + (item.cost || 0), 0);
        const tokens = providerData.reduce((sum, item) => sum + item.tokens_used, 0);
        
        return {
          provider,
          count,
          cost,
          avg_tokens: count > 0 ? Math.round(tokens / count) : 0
        };
      }).sort((a, b) => b.count - a.count);

      setProviderStats(providerStatsData);

      // Task stats
      const taskStatsData: TaskStats[] = Object.entries(taskCounts).map(([task_type, count]) => ({
        task_type,
        count
      })).sort((a, b) => b.count - a.count);

      setTaskStats(taskStatsData);

      // Daily usage
      const dailyData: Record<string, { count: number; cost: number; tokens: number }> = {};
      
      usageData?.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { count: 0, cost: 0, tokens: 0 };
        }
        dailyData[date].count++;
        dailyData[date].cost += item.cost || 0;
        dailyData[date].tokens += item.tokens_used;
      });

      const dailyUsageData = Object.entries(dailyData).map(([date, data]) => ({
        date,
        count: data.count,
        cost: data.cost,
        tokens: data.tokens
      })).sort((a, b) => a.date.localeCompare(b.date));

      setDailyUsage(dailyUsageData);

      // Recent activity
      const { data: recentData, error: recentError } = await supabase
        .rpc('get_recent_ai_activities', { limit_count: 10 });

      if (recentError) throw recentError;
      
      setRecentActivity(recentData || []);

    } catch (error) {
      console.error('Error fetching usage stats:', error);
      toast({
        title: "Error",
        description: "Gagal memuat statistik penggunaan AI",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeLabel = (taskType: string) => {
    const labels: Record<string, string> = {
      'analyze_behavior': 'Analisis Perilaku',
      'generate_letter': 'Generate Surat',
      'summarize_case': 'Ringkas Kasus',
      'discipline_recommendation': 'Rekomendasi Disiplin',
      'general_inquiry': 'Pertanyaan Umum',
      'student_analysis': 'Analisis Siswa',
      'discipline_advice': 'Saran Disiplin',
      'data_insight': 'Insight Data',
      'case_consultation': 'Konsultasi Kasus',
      'recommendation': 'Rekomendasi'
    };
    return labels[taskType] || taskType;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      'openai': '#10B981',
      'gemini': '#3B82F6',
      'openrouter': '#8B5CF6',
      'deepseek': '#F59E0B'
    };
    return colors[provider] || '#6B7280';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div>Memuat statistik penggunaan...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Statistik Penggunaan AI</h3>
          <p className="text-sm text-muted-foreground">
            Analisis penggunaan dan biaya AI dalam periode waktu tertentu
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 Hari</SelectItem>
              <SelectItem value="7d">7 Hari</SelectItem>
              <SelectItem value="30d">30 Hari</SelectItem>
              <SelectItem value="90d">90 Hari</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchUsageStats}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <div className="text-sm font-medium text-muted-foreground">Total Penggunaan</div>
              </div>
              <div className="text-2xl font-bold">{stats.total_usage.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">requests</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div className="text-sm font-medium text-muted-foreground">Total Biaya</div>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_cost)}</div>
              <div className="text-xs text-muted-foreground">USD</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <div className="text-sm font-medium text-muted-foreground">Rata-rata Token</div>
              </div>
              <div className="text-2xl font-bold">{stats.avg_tokens_per_request.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">per request</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <div className="text-sm font-medium text-muted-foreground">Provider Utama</div>
              </div>
              <div className="text-lg font-bold capitalize">{stats.most_used_provider}</div>
              <div className="text-xs text-muted-foreground">
                Task: {getTaskTypeLabel(stats.most_common_task)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Penggunaan per Provider</CardTitle>
            <CardDescription>Distribusi penggunaan berdasarkan AI provider</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={providerStats}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    nameKey="provider"
                    label={({ provider, percent }) => `${provider} ${(percent * 100).toFixed(0)}%`}
                  >
                    {providerStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getProviderColor(entry.provider)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, 'Requests']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Task Types */}
        <Card>
          <CardHeader>
            <CardTitle>Jenis Task</CardTitle>
            <CardDescription>Distribusi berdasarkan jenis tugas AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {taskStats.slice(0, 6).map((task, index) => (
                <div key={task.task_type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getProviderColor(index.toString()) }}
                    />
                    <span className="text-sm">{getTaskTypeLabel(task.task_type)}</span>
                  </div>
                  <Badge variant="secondary">{task.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Usage Chart */}
      {dailyUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Trend Penggunaan Harian</CardTitle>
            <CardDescription>Grafik penggunaan AI per hari</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('id-ID')}
                    formatter={(value, name) => [
                      name === 'count' ? value : 
                      name === 'cost' ? formatCurrency(Number(value)) : 
                      `${value} tokens`,
                      name === 'count' ? 'Requests' :
                      name === 'cost' ? 'Biaya' : 'Tokens'
                    ]}
                  />
                  <Line dataKey="count" stroke="#3B82F6" name="count" />
                  <Line dataKey="tokens" stroke="#10B981" name="tokens" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Aktivitas Terbaru
          </CardTitle>
          <CardDescription>10 penggunaan AI terbaru</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Belum ada aktivitas
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{getTaskTypeLabel(activity.task_type)}</Badge>
                    <div>
                      <div className="font-medium text-sm">{activity.user_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium capitalize">{activity.provider}</div>
                    <div className="text-xs text-muted-foreground">
                      {activity.tokens_used.toLocaleString()} tokens
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Details */}
      {providerStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detail Provider</CardTitle>
            <CardDescription>Statistik penggunaan per AI provider</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {providerStats.map((provider) => (
                <div key={provider.provider} className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getProviderColor(provider.provider) }}
                      />
                      <span className="font-medium capitalize">{provider.provider}</span>
                    </div>
                    <Badge>{provider.count} requests</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Biaya</div>
                      <div className="font-medium">{formatCurrency(provider.cost)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Rata-rata Token</div>
                      <div className="font-medium">{provider.avg_tokens.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Biaya per Request</div>
                      <div className="font-medium">
                        {provider.count > 0 ? formatCurrency(provider.cost / provider.count) : '$0.0000'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
