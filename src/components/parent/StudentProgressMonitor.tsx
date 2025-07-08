import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, Calendar, Award, AlertTriangle,
  BarChart3, Activity, Target, Clock
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ProgressData {
  id: string;
  tracking_date: string;
  attendance_percentage: number;
  discipline_score: number;
  achievement_count: number;
  violation_count: number;
  monthly_summary: any;
  semester_summary: any;
}

interface StudentInfo {
  id: string;
  full_name: string;
  nis: string;
  class_name?: string;
}

interface MonthlyTrend {
  month: string;
  attendance: number;
  discipline: number;
  achievements: number;
  violations: number;
}

export const StudentProgressMonitor = () => {
  const { user } = useAuth();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'3months' | '6months' | '1year'>('3months');

  useEffect(() => {
    if (user?.id) {
      fetchStudentInfo();
      fetchProgressData();
    }
  }, [user, selectedPeriod]);

  const fetchStudentInfo = async () => {
    try {
      const { data: parentAccess } = await supabase
        .from('parent_access')
        .select(`
          student_id,
          students!inner (
            id,
            full_name,
            nis,
            student_enrollments!inner (
              classes!inner (
                name,
                grade
              )
            )
          )
        `)
        .eq('parent_user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (parentAccess?.students) {
        const student = parentAccess.students;
        const enrollment = student.student_enrollments?.[0];
        
        setStudentInfo({
          id: student.id,
          full_name: student.full_name,
          nis: student.nis,
          class_name: enrollment ? `${enrollment.classes.grade} ${enrollment.classes.name}` : undefined
        });
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  const fetchProgressData = async () => {
    if (!studentInfo?.id) return;

    try {
      const monthsBack = selectedPeriod === '3months' ? 3 : selectedPeriod === '6months' ? 6 : 12;
      const startDate = startOfMonth(subMonths(new Date(), monthsBack));

      const { data, error } = await supabase
        .from('student_progress_tracking')
        .select('*')
        .eq('student_id', studentInfo.id)
        .gte('tracking_date', startDate.toISOString().split('T')[0])
        .order('tracking_date', { ascending: true });

      if (error) throw error;

      const progressData = data || [];
      setProgressData(progressData);
      
      // Process monthly trends
      const trends = processMonthlyTrends(progressData);
      setMonthlyTrends(trends);
      
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyTrends = (data: ProgressData[]): MonthlyTrend[] => {
    const monthlyData: { [key: string]: ProgressData[] } = {};
    
    // Group data by month
    data.forEach(item => {
      const monthKey = format(new Date(item.tracking_date), 'yyyy-MM');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(item);
    });

    // Calculate monthly averages
    return Object.entries(monthlyData).map(([monthKey, monthData]) => {
      const avgAttendance = monthData.reduce((sum, item) => sum + (item.attendance_percentage || 0), 0) / monthData.length;
      const avgDiscipline = monthData.reduce((sum, item) => sum + (item.discipline_score || 100), 0) / monthData.length;
      const totalAchievements = monthData.reduce((sum, item) => sum + (item.achievement_count || 0), 0);
      const totalViolations = monthData.reduce((sum, item) => sum + (item.violation_count || 0), 0);

      return {
        month: format(new Date(monthKey + '-01'), 'MMM yyyy', { locale: id }),
        attendance: Math.round(avgAttendance),
        discipline: Math.round(avgDiscipline),
        achievements: totalAchievements,
        violations: totalViolations
      };
    });
  };

  const getCurrentMonthData = () => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    return progressData.filter(item => 
      format(new Date(item.tracking_date), 'yyyy-MM') === currentMonth
    );
  };

  const getLatestData = () => {
    if (progressData.length === 0) return null;
    return progressData[progressData.length - 1];
  };

  const getTrendDirection = (current: number, previous: number) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'same';
  };

  const getTrendIcon = (direction: string, isPositive: boolean = true) => {
    const actualDirection = isPositive ? direction : direction === 'up' ? 'down' : direction === 'down' ? 'up' : 'same';
    
    if (actualDirection === 'up') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (actualDirection === 'down') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const currentData = getCurrentMonthData();
  const latestData = getLatestData();
  const previousData = progressData.length > 1 ? progressData[progressData.length - 2] : null;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!studentInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Data siswa tidak ditemukan
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Info Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monitor Progress: {studentInfo.full_name}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {studentInfo.nis} • {studentInfo.class_name}
          </div>
        </CardHeader>
      </Card>

      {/* Current Month Summary */}
      {latestData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Kehadiran</div>
                  <div className="text-2xl font-bold">
                    {latestData.attendance_percentage || 0}%
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  {previousData && getTrendIcon(
                    getTrendDirection(
                      latestData.attendance_percentage || 0,
                      previousData.attendance_percentage || 0
                    )
                  )}
                </div>
              </div>
              <Progress 
                value={latestData.attendance_percentage || 0} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Poin Disiplin</div>
                  <div className="text-2xl font-bold">
                    {latestData.discipline_score || 100}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-green-500" />
                  {previousData && getTrendIcon(
                    getTrendDirection(
                      latestData.discipline_score || 100,
                      previousData.discipline_score || 100
                    )
                  )}
                </div>
              </div>
              <Progress 
                value={latestData.discipline_score || 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Prestasi Bulan Ini</div>
                  <div className="text-2xl font-bold">
                    {latestData.achievement_count || 0}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4 text-yellow-500" />
                  {previousData && getTrendIcon(
                    getTrendDirection(
                      latestData.achievement_count || 0,
                      previousData.achievement_count || 0
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Pelanggaran</div>
                  <div className="text-2xl font-bold">
                    {latestData.violation_count || 0}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  {previousData && getTrendIcon(
                    getTrendDirection(
                      latestData.violation_count || 0,
                      previousData.violation_count || 0
                    ),
                    false // Lower violations is better
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics */}
      <Tabs value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="3months">3 Bulan</TabsTrigger>
            <TabsTrigger value="6months">6 Bulan</TabsTrigger>
            <TabsTrigger value="1year">1 Tahun</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={selectedPeriod} className="space-y-4">
          {/* Attendance & Discipline Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Tren Kehadiran & Disiplin</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="attendance" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Kehadiran (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="discipline" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Poin Disiplin"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Achievements vs Violations */}
          <Card>
            <CardHeader>
              <CardTitle>Prestasi vs Pelanggaran</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="achievements" fill="#fbbf24" name="Prestasi" />
                  <Bar dataKey="violations" fill="#ef4444" name="Pelanggaran" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Bulanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyTrends.map((trend, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">{trend.month}</h4>
                      <div className="flex gap-2">
                        <Badge 
                          variant={trend.attendance >= 90 ? "default" : trend.attendance >= 80 ? "secondary" : "destructive"}
                        >
                          Kehadiran: {trend.attendance}%
                        </Badge>
                        <Badge 
                          variant={trend.discipline >= 90 ? "default" : trend.discipline >= 80 ? "secondary" : "destructive"}
                        >
                          Disiplin: {trend.discipline}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span>{trend.achievements} Prestasi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span>{trend.violations} Pelanggaran</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {monthlyTrends.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Belum ada data untuk periode yang dipilih</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};