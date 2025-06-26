
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts';
import { Shield, AlertTriangle, TrendingDown, Award } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface StudentDisciplineStatsProps {
  studentId: string;
}

export const StudentDisciplineStats = ({ studentId }: StudentDisciplineStatsProps) => {
  const { data: disciplineData, isLoading } = useQuery({
    queryKey: ['student-discipline-stats', studentId],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      // Get violations
      const { data: violations } = await supabase
        .from('student_violations')
        .select(`
          *,
          violation_types(violation_name, point_deduction)
        `)
        .eq('student_id', studentId)
        .gte('violation_date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .order('violation_date', { ascending: false });

      // Get discipline points
      const { data: disciplinePoints } = await supabase
        .from('student_discipline_points')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1);

      const currentPoints = disciplinePoints?.[0]?.current_points || 0;
      const totalDeductions = violations?.reduce((sum, v) => sum + (v.point_deduction || 0), 0) || 0;

      // Prepare chart data
      const violationsByDate: Record<string, number> = {};
      violations?.forEach(violation => {
        const date = violation.violation_date;
        violationsByDate[date] = (violationsByDate[date] || 0) + (violation.point_deduction || 0);
      });

      const chartData = Object.entries(violationsByDate)
        .map(([date, points]) => ({
          date: format(new Date(date), 'dd/MM', { locale: localeId }),
          points
        }))
        .slice(-14)
        .reverse();

      // Group violations by type
      const violationsByType: Record<string, number> = {};
      violations?.forEach(violation => {
        const typeName = violation.violation_types?.violation_name || 'Lainnya';
        violationsByType[typeName] = (violationsByType[typeName] || 0) + 1;
      });

      const violationTypeData = Object.entries(violationsByType)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      return {
        currentPoints,
        totalDeductions,
        violationsCount: violations?.length || 0,
        recentViolations: violations?.slice(0, 5) || [],
        chartData,
        violationTypeData
      };
    },
    enabled: !!studentId
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { currentPoints, totalDeductions, violationsCount, recentViolations, chartData, violationTypeData } = disciplineData || {};

  const disciplineStatus = currentPoints >= 80 ? 'Sangat Baik' : 
                          currentPoints >= 60 ? 'Baik' : 
                          currentPoints >= 40 ? 'Perlu Perhatian' : 'Bermasalah';

  const statusColor = currentPoints >= 80 ? 'text-green-600' : 
                     currentPoints >= 60 ? 'text-blue-600' : 
                     currentPoints >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Poin Disiplin</CardTitle>
            <Shield className={`h-4 w-4 ${statusColor}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${statusColor}`}>{currentPoints}</div>
            <p className="text-xs text-muted-foreground">{disciplineStatus}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggaran</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{violationsCount}</div>
            <p className="text-xs text-muted-foreground">30 hari terakhir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Poin Dikurangi</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalDeductions}</div>
            <p className="text-xs text-muted-foreground">total poin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Award className={`h-4 w-4 ${statusColor}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold ${statusColor}`}>{disciplineStatus}</div>
            <p className="text-xs text-muted-foreground">saat ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trend Pelanggaran (14 Hari)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                points: { label: "Poin Dikurangi", color: "#ef4444" }
              }}
              className="h-[250px]"
            >
              <LineChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="points" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jenis Pelanggaran</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Jumlah", color: "#f59e0b" }
              }}
              className="h-[250px]"
            >
              <BarChart data={violationTypeData}>
                <XAxis dataKey="type" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Violations */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pelanggaran Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {recentViolations?.length > 0 ? (
            <div className="space-y-3">
              {recentViolations.map((violation, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-red-100 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {violation.violation_types?.violation_name || 'Pelanggaran'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(violation.violation_date), 'dd MMMM yyyy', { locale: localeId })}
                      </p>
                      {violation.description && (
                        <p className="text-sm text-gray-500 mt-1">{violation.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-red-600">
                      -{violation.point_deduction}
                    </span>
                    <p className="text-xs text-gray-500">poin</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">Tidak Ada Pelanggaran</h3>
              <p className="text-gray-600">Pertahankan disiplin yang baik!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
