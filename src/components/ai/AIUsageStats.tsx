
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Brain, TrendingUp, Zap, Calendar, RefreshCw } from 'lucide-react';

interface UsageStats {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  provider_breakdown: Array<{
    provider: string;
    count: number;
    tokens: number;
    cost: number;
  }>;
  task_breakdown: Array<{
    task_type: string;
    count: number;
  }>;
  daily_usage: Array<{
    date: string;
    count: number;
    tokens: number;
  }>;
}

export function AIUsageStats() {
  const { hasRole } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (hasRole('admin')) {
      loadStats();
    }
  }, [hasRole, timeRange]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Get basic stats
      const { data: usageLogs, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      if (!usageLogs) {
        setStats(null);
        return;
      }

      // Calculate statistics
      const totalRequests = usageLogs.length;
      const totalTokens = usageLogs.reduce((sum, log) => sum + (log.tokens_used || 0), 0);
      const totalCost = usageLogs.reduce((sum, log) => sum + (parseFloat(log.cost?.toString() || '0')), 0);

      // Provider breakdown
      const providerMap = new Map();
      usageLogs.forEach(log => {
        const provider = log.provider;
        if (!providerMap.has(provider)) {
          providerMap.set(provider, { count: 0, tokens: 0, cost: 0 });
        }
        const current = providerMap.get(provider);
        current.count += 1;
        current.tokens += log.tokens_used || 0;
        current.cost += parseFloat(log.cost?.toString() || '0');
      });

      const providerBreakdown = Array.from(providerMap.entries()).map(([provider, data]) => ({
        provider,
        ...data
      }));

      // Task breakdown
      const taskMap = new Map();
      usageLogs.forEach(log => {
        const task = log.task_type;
        taskMap.set(task, (taskMap.get(task) || 0) + 1);
      });

      const taskBreakdown = Array.from(taskMap.entries()).map(([task_type, count]) => ({
        task_type,
        count
      }));

      // Daily usage
      const dailyMap = new Map();
      usageLogs.forEach(log => {
        const date = new Date(log.created_at).toLocaleDateString('id-ID');
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { count: 0, tokens: 0 });
        }
        const current = dailyMap.get(date);
        current.count += 1;
        current.tokens += log.tokens_used || 0;
      });

      const dailyUsage = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        ...data
      }));

      setStats({
        total_requests: totalRequests,
        total_tokens: totalTokens,
        total_cost: totalCost,
        provider_breakdown: providerBreakdown,
        task_breakdown: taskBreakdown,
        daily_usage: dailyUsage
      });

    } catch (error) {
      console.error('Error loading AI usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('admin')) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Hanya Admin yang dapat melihat statistik penggunaan AI
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Statistik Penggunaan AI</h2>
          <p className="text-muted-foreground">Analisis penggunaan dan performa AI</p>
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
          <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : stats ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Brain className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <div className="text-2xl font-bold">{stats.total_requests}</div>
                  <div className="text-sm text-muted-foreground">Total Request</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Zap className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <div className="text-2xl font-bold">{stats.total_tokens.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Token</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                  <div className="text-2xl font-bold">${stats.total_cost.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Total Biaya</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Calendar className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                  <div className="text-2xl font-bold">
                    {stats.daily_usage.length > 0 ? 
                      Math.round(stats.total_requests / stats.daily_usage.length) : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Rata-rata Harian</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Penggunaan Harian</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.daily_usage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Provider Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.provider_breakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ provider, count }) => `${provider}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.provider_breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Task Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Breakdown Task AI</CardTitle>
              <CardDescription>
                Jenis-jenis task yang paling sering digunakan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.task_breakdown.map((task, index) => (
                  <div key={task.task_type} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="capitalize">{task.task_type.replace('_', ' ')}</span>
                    </div>
                    <Badge variant="secondary">{task.count} request</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Provider Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.provider_breakdown.map((provider) => (
                  <div key={provider.provider} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold capitalize">{provider.provider}</h4>
                      <Badge>{provider.count} requests</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Token:</span>
                        <div className="font-medium">{provider.tokens.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Biaya:</span>
                        <div className="font-medium">${provider.cost.toFixed(4)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rata-rata Token/Request:</span>
                        <div className="font-medium">
                          {provider.count > 0 ? Math.round(provider.tokens / provider.count) : 0}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Belum ada data penggunaan AI</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
