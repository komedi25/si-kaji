
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Shield, AlertTriangle, TrendingDown, Award } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';

interface StudentDisciplineStatsProps {
  studentId: string;
}

export const StudentDisciplineStats = ({ studentId }: StudentDisciplineStatsProps) => {
  // Query untuk statistik pelanggaran
  const { data: violationStats, isLoading: loadingViolations } = useQuery({
    queryKey: ['student-violations', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_violations')
        .select(`
          *,
          violation_types (
            name,
            category,
            point_deduction
          )
        `)
        .eq('student_id', studentId)
        .order('violation_date', { ascending: false });

      if (error) throw error;

      const active = data?.filter(v => v.status === 'active').length || 0;
      const resolved = data?.filter(v => v.status === 'resolved').length || 0;
      const totalPoints = data?.reduce((sum, v) => sum + (v.point_deduction || 0), 0) || 0;

      // Group by category
      const categoryStats: Record<string, number> = {};
      data?.forEach(violation => {
        const category = violation.violation_types?.category || 'lainnya';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });

      return {
        total: data?.length || 0,
        active,
        resolved,
        totalPoints,
        violations: data || [],
        categoryStats: Object.entries(categoryStats).map(([category, count]) => ({
          category,
          count
        }))
      };
    },
  });

  // Query untuk poin disiplin
  const { data: disciplinePoints, isLoading: loadingPoints } = useQuery({
    queryKey: ['student-discipline-points', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_discipline_points')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  if (loadingViolations || loadingPoints) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const disciplineScore = disciplinePoints?.final_score || 100;
  const disciplineStatus = disciplinePoints?.discipline_status || 'good';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'probation': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'Sangat Baik';
      case 'good': return 'Baik';
      case 'warning': return 'Peringatan';
      case 'probation': return 'Masa Percobaan';
      case 'critical': return 'Kritis';
      default: return 'Tidak Diketahui';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skor Disiplin</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{disciplineScore}</div>
            <p className="text-xs text-muted-foreground">Dari 100 poin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Disiplin</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-sm font-semibold px-2 py-1 rounded-full inline-block ${getStatusColor(disciplineStatus)}`}>
              {getStatusText(disciplineStatus)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggaran</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{violationStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {violationStats?.active || 0} aktif, {violationStats?.resolved || 0} selesai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Poin Dikurangi</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{violationStats?.totalPoints || 0}</div>
            <p className="text-xs text-muted-foreground">Poin pelanggaran</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Kategori Pelanggaran</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                ringan: { label: "Ringan", color: "#10b981" },
                sedang: { label: "Sedang", color: "#f59e0b" },
                berat: { label: "Berat", color: "#ef4444" }
              }}
              className="h-[300px]"
            >
              <BarChart data={violationStats?.categoryStats || []}>
                <XAxis dataKey="category" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#f59e0b" name="Jumlah" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Discipline Score Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Skor Disiplin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{disciplineScore}</div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full ${
                      disciplineScore >= 90 ? 'bg-green-500' :
                      disciplineScore >= 75 ? 'bg-blue-500' :
                      disciplineScore >= 60 ? 'bg-yellow-500' :
                      disciplineScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(disciplineScore, 0)}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Status: {getStatusText(disciplineStatus)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Violations */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pelanggaran Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {violationStats?.violations.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-600 mb-2">Tidak Ada Pelanggaran</h3>
              <p className="text-muted-foreground">
                Selamat! Anda belum memiliki catatan pelanggaran.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {violationStats?.violations.slice(0, 10).map((violation) => (
                <div key={violation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-5 w-5 ${
                      violation.violation_types?.category === 'berat' ? 'text-red-600' :
                      violation.violation_types?.category === 'sedang' ? 'text-orange-600' :
                      'text-yellow-600'
                    }`} />
                    <div>
                      <p className="font-medium">{violation.violation_types?.name || 'Pelanggaran'}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(violation.violation_date), 'dd MMMM yyyy', { locale: id })}
                        {violation.description && ` • ${violation.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">
                      -{violation.point_deduction} poin
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      violation.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {violation.status === 'active' ? 'Aktif' : 'Selesai'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
