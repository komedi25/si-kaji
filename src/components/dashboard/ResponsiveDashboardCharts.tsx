
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, AlertTriangle, Trophy, Activity } from 'lucide-react';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const chartConfig = {
  violations: {
    label: "Pelanggaran",
    color: COLORS.danger,
  },
  achievements: {
    label: "Prestasi", 
    color: COLORS.success,
  },
  discipline: {
    label: "Skor Disiplin",
    color: COLORS.primary,
  },
};

export const ResponsiveDashboardCharts = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('trends');

  // Get violation trends
  const { data: violationTrends, isLoading: loadingViolations } = useQuery({
    queryKey: ['violation-trends'],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from('student_violations')
        .select('violation_date')
        .gte('violation_date', sixMonthsAgo.toISOString().split('T')[0])
        .eq('status', 'active');

      if (error) throw error;

      const monthlyData = data?.reduce((acc: Record<string, number>, violation) => {
        const month = new Date(violation.violation_date).toLocaleDateString('id-ID', { 
          month: 'short' 
        });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {}) || {};

      return Object.entries(monthlyData).map(([month, count]) => ({
        month,
        count,
        fill: COLORS.danger
      }));
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('tppk')),
  });

  if (!user?.roles || user.roles.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Tidak ada data untuk ditampilkan</p>
      </div>
    );
  }

  const isLoading = loadingViolations;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 sm:h-80 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3">
          <TabsTrigger value="trends" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Trend Data</span>
            <span className="sm:hidden">Trend</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Performa</span>
            <span className="sm:hidden">Data</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Violation Trends */}
            {(user.roles.includes('admin') || user.roles.includes('tppk')) && violationTrends && (
              <Card className="border-red-200 bg-red-50/30">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                    <span className="truncate">Trend Pelanggaran</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    6 bulan terakhir
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-6">
                  <div className="h-48 sm:h-64 md:h-80 w-full">
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={violationTrends}
                          margin={{ 
                            top: 10, 
                            right: 10, 
                            left: 0, 
                            bottom: 0 
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 10 }}
                            tickLine={{ stroke: '#cbd5e1' }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis 
                            tick={{ fontSize: 10 }}
                            tickLine={{ stroke: '#cbd5e1' }}
                            width={30}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar 
                            dataKey="count" 
                            fill={COLORS.danger}
                            radius={[2, 2, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-4 sm:mt-6">
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4" />
            <p>Data performa akan segera hadir</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
