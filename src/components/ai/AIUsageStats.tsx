
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign,
  Activity,
  RefreshCw
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

interface AIUsageStat {
  total_usage: number;
  total_cost: number;
  avg_tokens: number;
  most_used_provider: string;
  most_used_task: string;
}

interface TaskDistribution {
  task_type: string;
  count: number;
  percentage: number;
}

interface UsageTrend {
  date: string;
  usage_count: number;
  total_tokens: number;
}

export function AIUsageStats() {
  const { hasRole } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  // Get overall AI usage statistics
  const { data: usageStats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['ai-usage-stats', timeRange],
    queryFn: async () => {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const totalUsage = data?.length || 0;
      const totalCost = data?.reduce((sum, log) => sum + (log.cost || 0), 0) || 0;
      const avgTokens = totalUsage > 0 ? 
        Math.round(data.reduce((sum, log) => sum + log.tokens_used, 0) / totalUsage) : 0;
      
      // Most used provider
      const providerCounts = data?.reduce((acc: Record<string, number>, log) => {
        acc[log.provider] = (acc[log.provider] || 0) + 1;
        return acc;
      }, {}) || {};
      const mostUsedProvider = Object.keys(providerCounts).length > 0 ? 
        Object.keys(providerCounts).reduce((a, b) => providerCounts[a] > providerCounts[b] ? a : b) : 'None';

      // Most used task
      const taskCounts = data?.reduce((acc: Record<string, number>, log) => {
        acc[log.task_type] = (acc[log.task_type] || 0) + 1;
        return acc;
      }, {}) || {};
      const mostUsedTask = Object.keys(taskCounts).length > 0 ? 
        Object.keys(taskCounts).reduce((a, b) => taskCounts[a] > taskCounts[b] ? a : b) : 'None';

      return {
        total_usage: totalUsage,
        total_cost: totalCost,
        avg_tokens: avgTokens,
        most_used_provider: mostUsedProvider,
        most_used_task: mostUsedTask
      } as AIUsageStat;
    },
    enabled: hasRole('admin'),
  });

  // Get task distribution
  const { data: taskDistribution, isLoading: loadingTasks } = useQuery({
    queryKey: ['ai-task-distribution', timeRange],
    queryFn: async () => {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('task_type')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const taskCounts = data?.reduce((acc: Record<string, number>, log) => {
        acc[log.task_type] = (acc[log.task_type] || 0) + 1;
        return acc;
      }, {}) || {};

      const total = Object.values(taskCounts).reduce((sum, count) => sum + count, 0);
      
      return Object.entries(taskCounts).map(([task_type, count]) => ({
        task_type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      })) as TaskDistribution[];
    },
    enabled: hasRole('admin'),
  });

  // Get usage trends
  const { data: usageTrends, isLoading: loadingTrends } = useQuery({
    queryKey: ['ai-usage-trends', timeRange],
    queryFn: async () => {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('created_at, tokens_used')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyUsage = data?.reduce((acc: Record<string, { count: number; tokens: number }>, log) => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { count: 0, tokens: 0 };
        }
        acc[date].count++;
        acc[date].tokens += log.tokens_used;
        return acc;
      }, {}) || {};

      return Object.entries(dailyUsage).map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        usage_count: data.count,
        total_tokens: data.tokens
      })) as UsageTrend[];
    },
    enabled: hasRole('admin'),
  });

  // Get recent activities
  const { data: recentActivities } = useQuery({
    queryKey: ['ai-recent-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_recent_ai_activities', { limit_count: 10 });

      if (error) throw error;
      return data || [];
    },
    enabled: hasRole('admin'),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchStats(),
    ]);
    setRefreshing(false);
  };

  const getTaskLabel = (taskType: string) => {
    const labels: Record<string, string> = {
      'behavioral_analysis': 'Analisis Perilaku',
      'recommendation_generation': 'Rekomendasi',
      'student_assessment': 'Penilaian Siswa',
      'report_generation': 'Laporan',
      'chat_assistance': 'Asisten Chat',
      'data_analysis': 'Analisis Data'
    };
    return labels[taskType] || taskType;
  };

  if (!hasRole('admin')) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground">
            Anda tidak memiliki akses untuk melihat statistik AI
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLoading = loadingStats || loadingTasks || loadingTrends;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Statistik Penggunaan AI</h3>
          <p className="text-sm text-muted-foreground">
            Monitor dan analisis penggunaan AI system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Hari</SelectItem>
              <SelectItem value="30d">30 Hari</SelectItem>
              <SelectItem value="90d">90 Hari</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penggunaan</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : (usageStats?.total_usage || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {timeRange === '7d' ? '7 hari terakhir' : timeRange === '30d' ? '30 hari terakhir' : '90 hari terakhir'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Biaya</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${isLoading ? "..." : (usageStats?.total_cost || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimasi biaya
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Token</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : (usageStats?.avg_tokens || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Per request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provider Utama</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : (usageStats?.most_used_provider || 'None')}
            </div>
            <p className="text-xs text-muted-foreground">
              Paling banyak digunakan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Penggunaan</CardTitle>
            <CardDescription>Grafik penggunaan AI harian</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div>Memuat data...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="usage_count" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Jumlah Penggunaan"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Task Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Tugas</CardTitle>
            <CardDescription>Jenis tugas yang paling sering digunakan</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div>Memuat data...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taskDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ task_type, percentage }) => `${getTaskLabel(task_type)} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(taskDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
          <CardDescription>10 penggunaan AI terbaru</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentActivities?.map((activity, index) => (
              <div key={activity.id || index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{activity.provider}</Badge>
                  <span className="text-sm">{getTaskLabel(activity.task_type)}</span>
                  <span className="text-xs text-muted-foreground">
                    oleh {activity.user_name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{activity.tokens_used} tokens</span>
                  <Clock className="h-3 w-3" />
                  <span>{new Date(activity.created_at).toLocaleString('id-ID')}</span>
                </div>
              </div>
            )) || (
              <div className="text-center py-4 text-muted-foreground">
                Belum ada aktivitas AI
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
