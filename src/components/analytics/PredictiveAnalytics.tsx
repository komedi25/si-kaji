
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Brain,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';

export const PredictiveAnalytics = () => {
  const { user } = useAuth();
  const [selectedMetric, setSelectedMetric] = useState('discipline');
  const [selectedTimeframe, setSelectedTimeframe] = useState('3months');

  // Get predictive analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['predictive-analytics', selectedMetric, selectedTimeframe],
    queryFn: async () => {
      const months = selectedTimeframe === '3months' ? 3 : selectedTimeframe === '6months' ? 6 : 12;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Get discipline trends
      const { data: disciplineData } = await supabase
        .from('student_discipline_points')
        .select(`
          final_score,
          discipline_status,
          last_updated,
          students!inner(
            full_name,
            nis
          )
        `)
        .gte('last_updated', startDate.toISOString())
        .order('last_updated', { ascending: true });

      // Get violation patterns
      const { data: violationData } = await supabase
        .from('student_violations')
        .select(`
          violation_date,
          point_deduction,
          students!inner(
            id,
            full_name
          ),
          violation_types!inner(
            category,
            name
          )
        `)
        .gte('violation_date', startDate.toISOString().split('T')[0])
        .eq('status', 'active');

      // Get attendance patterns
      const { data: attendanceData } = await supabase
        .from('student_attendances')
        .select(`
          attendance_date,
          status,
          students!inner(
            id,
            full_name
          )
        `)
        .gte('attendance_date', startDate.toISOString().split('T')[0]);

      return {
        discipline: disciplineData || [],
        violations: violationData || [],
        attendance: attendanceData || []
      };
    },
    enabled: !!user && (user.roles?.includes('admin') || user.roles?.includes('waka_kesiswaan')),
  });

  // Process risk predictions
  const riskPredictions = React.useMemo(() => {
    if (!analyticsData) return [];

    const studentRisks = new Map();

    // Analyze discipline trends
    analyticsData.discipline.forEach((record: any) => {
      const studentId = record.students.nis;
      if (!studentRisks.has(studentId)) {
        studentRisks.set(studentId, {
          name: record.students.full_name,
          nis: studentId,
          disciplineScore: record.final_score,
          violationCount: 0,
          absenceRate: 0,
          riskLevel: 'low'
        });
      }
    });

    // Add violation data
    analyticsData.violations.forEach((violation: any) => {
      const studentId = violation.students.nis;
      if (studentRisks.has(studentId)) {
        const student = studentRisks.get(studentId);
        student.violationCount++;
      }
    });

    // Add attendance data
    const attendanceByStudent = analyticsData.attendance.reduce((acc: any, record: any) => {
      const studentId = record.students.id;
      if (!acc[studentId]) {
        acc[studentId] = { total: 0, absent: 0 };
      }
      acc[studentId].total++;
      if (record.status === 'absent') {
        acc[studentId].absent++;
      }
      return acc;
    }, {});

    // Calculate risk levels
    studentRisks.forEach((student, key) => {
      const attendance = attendanceByStudent[key];
      if (attendance) {
        student.absenceRate = Math.round((attendance.absent / attendance.total) * 100);
      }

      // Risk calculation algorithm
      let riskScore = 0;
      if (student.disciplineScore < 60) riskScore += 3;
      else if (student.disciplineScore < 75) riskScore += 2;
      else if (student.disciplineScore < 90) riskScore += 1;

      if (student.violationCount > 5) riskScore += 3;
      else if (student.violationCount > 3) riskScore += 2;
      else if (student.violationCount > 1) riskScore += 1;

      if (student.absenceRate > 20) riskScore += 3;
      else if (student.absenceRate > 10) riskScore += 2;
      else if (student.absenceRate > 5) riskScore += 1;

      if (riskScore >= 6) student.riskLevel = 'high';
      else if (riskScore >= 3) student.riskLevel = 'medium';
      else student.riskLevel = 'low';
    });

    return Array.from(studentRisks.values()).sort((a, b) => {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });
  }, [analyticsData]);

  // Process trend analysis
  const trendAnalysis = React.useMemo(() => {
    if (!analyticsData) return [];

    const monthlyData = analyticsData.discipline.reduce((acc: any, record: any) => {
      const month = new Date(record.last_updated).toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!acc[month]) {
        acc[month] = {
          month,
          avgScore: 0,
          count: 0,
          highRisk: 0,
          mediumRisk: 0,
          lowRisk: 0
        };
      }
      
      acc[month].avgScore += record.final_score;
      acc[month].count++;
      
      if (record.final_score < 60) acc[month].highRisk++;
      else if (record.final_score < 75) acc[month].mediumRisk++;
      else acc[month].lowRisk++;
      
      return acc;
    }, {});

    return Object.values(monthlyData).map((data: any) => ({
      ...data,
      avgScore: Math.round(data.avgScore / data.count)
    }));
  }, [analyticsData]);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge variant="destructive">Tinggi</Badge>;
      case 'medium':
        return <Badge variant="outline">Sedang</Badge>;
      default:
        return <Badge variant="default">Rendah</Badge>;
    }
  };

  const getRecommendations = (student: any) => {
    const recommendations = [];
    
    if (student.disciplineScore < 60) {
      recommendations.push('Perlu konseling intensif dan pendampingan khusus');
    }
    if (student.violationCount > 3) {
      recommendations.push('Implementasi program pembinaan karakter');
    }
    if (student.absenceRate > 10) {
      recommendations.push('Koordinasi dengan orang tua untuk meningkatkan kehadiran');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Pertahankan prestasi dan motivasi positif');
    }
    
    return recommendations;
  };

  if (!user?.roles?.includes('admin') && !user?.roles?.includes('waka_kesiswaan')) {
    return (
      <div className="text-center p-8">
        <p>Anda tidak memiliki akses untuk melihat analisis prediktif ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Analisis Prediktif & Early Warning System
          </CardTitle>
          <CardDescription>
            Identifikasi dini siswa yang memerlukan perhatian khusus menggunakan analisis data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discipline">Analisis Disiplin</SelectItem>
                  <SelectItem value="attendance">Analisis Kehadiran</SelectItem>
                  <SelectItem value="overall">Analisis Menyeluruh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">3 Bulan</SelectItem>
                  <SelectItem value="6months">6 Bulan</SelectItem>
                  <SelectItem value="12months">1 Tahun</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Summary Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto text-red-600 mb-2" />
                    <div className="text-2xl font-bold text-red-600">
                      {riskPredictions.filter(s => s.riskLevel === 'high').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Risiko Tinggi</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Target className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">
                      {riskPredictions.filter(s => s.riskLevel === 'medium').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Risiko Sedang</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="w-8 h-8 mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {riskPredictions.filter(s => s.riskLevel === 'low').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Risiko Rendah</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trend Chart */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Trend Skor Disiplin</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="avgScore" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        name="Rata-rata Skor"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Risk Distribution */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Risiko</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trendAnalysis.slice(-3).map((data: any, index) => (
                      <div key={index} className="space-y-2">
                        <div className="text-sm font-medium">{data.month}</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-red-600 font-bold">{data.highRisk}</div>
                            <div>Tinggi</div>
                          </div>
                          <div className="text-center">
                            <div className="text-yellow-600 font-bold">{data.mediumRisk}</div>
                            <div>Sedang</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-600 font-bold">{data.lowRisk}</div>
                            <div>Rendah</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* High Risk Students List */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Siswa yang Memerlukan Perhatian Khusus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskPredictions.filter(s => s.riskLevel === 'high' || s.riskLevel === 'medium').slice(0, 10).map((student, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{student.name}</h4>
                        <p className="text-sm text-muted-foreground">NIS: {student.nis}</p>
                      </div>
                      {getRiskBadge(student.riskLevel)}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Skor Disiplin: </span>
                        <span className="font-medium">{student.disciplineScore}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pelanggaran: </span>
                        <span className="font-medium">{student.violationCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Absensi: </span>
                        <span className="font-medium">{student.absenceRate}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Rekomendasi Intervensi:</p>
                      {getRecommendations(student).map((rec, recIndex) => (
                        <p key={recIndex} className="text-sm text-muted-foreground">• {rec}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
