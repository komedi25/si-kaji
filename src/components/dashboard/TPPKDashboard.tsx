import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
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
  Line
} from 'recharts';
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  FileText,
  Clock,
  Target,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

const chartConfig = {
  violations: { label: "Pelanggaran", color: "#ef4444" },
  cases: { label: "Kasus", color: "#f59e0b" },
  attendance: { label: "Presensi", color: "#10b981" }
};

export const TPPKDashboard = () => {
  const { user } = useAuth();

  // Get violation statistics
  const { data: violationStats, isLoading: loadingViolations } = useQuery({
    queryKey: ['tppk-violation-stats', user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('student_violations')
        .select(`
          *,
          violation_types (name, category, point_deduction),
          students (full_name, nis)
        `)
        .gte('violation_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('violation_date', { ascending: false });
      
      if (error) throw error;
      
      // Statistics
      const stats = {
        total: data?.length || 0,
        ringan: data?.filter(v => v.violation_types?.category === 'ringan').length || 0,
        sedang: data?.filter(v => v.violation_types?.category === 'sedang').length || 0,
        berat: data?.filter(v => v.violation_types?.category === 'berat').length || 0,
        recent: data?.slice(0, 10) || []
      };

      // Daily trend for last 7 days
      const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        const dayData = data?.filter(v => v.violation_date === dateStr);
        
        return {
          date: format(date, 'dd/MM'),
          day: format(date, 'EEE', { locale: id }),
          count: dayData?.length || 0,
          ringan: dayData?.filter(v => v.violation_types?.category === 'ringan').length || 0,
          sedang: dayData?.filter(v => v.violation_types?.category === 'sedang').length || 0,
          berat: dayData?.filter(v => v.violation_types?.category === 'berat').length || 0
        };
      });
      
      return { ...stats, weeklyData };
    },
    enabled: !!user?.id,
  });

  // Get case statistics
  const { data: caseStats, isLoading: loadingCases } = useQuery({
    queryKey: ['tppk-case-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_cases')
        .select('*')
        .in('category', ['bullying', 'kekerasan'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return {
        total: data?.length || 0,
        pending: data?.filter(c => c.status === 'pending').length || 0,
        under_review: data?.filter(c => c.status === 'under_review').length || 0,
        resolved: data?.filter(c => c.status === 'resolved').length || 0,
        recent: data?.slice(0, 5) || []
      };
    },
    enabled: !!user?.id,
  });

  // Get today's attendance for manual input tracking
  const { data: attendanceToday, isLoading: loadingAttendance } = useQuery({
    queryKey: ['tppk-attendance-today', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('student_attendances')
        .select(`
          *,
          students (full_name, nis)
        `)
        .eq('attendance_date', today)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return {
        total: data?.length || 0,
        present: data?.filter(a => a.status === 'present').length || 0,
        absent: data?.filter(a => a.status === 'absent').length || 0,
        late: data?.filter(a => a.status === 'late').length || 0,
        permission: data?.filter(a => a.status === 'permission').length || 0,
        recent: data?.slice(0, 10) || []
      };
    },
    enabled: !!user?.id,
  });

  if (loadingViolations || loadingCases || loadingAttendance) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const violationChartData = [
    { category: 'Ringan', count: violationStats?.ringan || 0, fill: COLORS[2] },
    { category: 'Sedang', count: violationStats?.sedang || 0, fill: COLORS[1] },
    { category: 'Berat', count: violationStats?.berat || 0, fill: COLORS[0] }
  ].filter(item => item.count > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-4 p-4 md:p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl p-4 md:p-6">
          <div className="flex flex-col space-y-2">
            <h1 className="text-xl md:text-3xl font-bold">
              Dashboard TPPK
            </h1>
            <p className="text-red-100 text-sm md:text-base">
              Tim Pencegahan dan Penanganan Kekerasan - Monitoring & Input Manual
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-red-800 flex items-center gap-1 md:gap-2">
                <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Pelanggaran</span>
                <span className="sm:hidden">Total</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-red-700">
                {violationStats?.total || 0}
              </div>
              <p className="text-xs text-red-600 mt-1">
                30 hari terakhir
              </p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-orange-800 flex items-center gap-1 md:gap-2">
                <Shield className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Kasus Aktif</span>
                <span className="sm:hidden">Kasus</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-orange-700">
                {(caseStats?.pending || 0) + (caseStats?.under_review || 0)}
              </div>
              <p className="text-xs text-orange-600 mt-1">
                Perlu tindak lanjut
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-blue-800 flex items-center gap-1 md:gap-2">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Presensi Hari Ini</span>
                <span className="sm:hidden">Presensi</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-blue-700">
                {attendanceToday?.total || 0}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Input manual
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-green-800 flex items-center gap-1 md:gap-2">
                <Target className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Kasus Selesai</span>
                <span className="sm:hidden">Selesai</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-green-700">
                {caseStats?.resolved || 0}
              </div>
              <p className="text-xs text-green-600 mt-1">
                Total resolved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="violations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="violations" className="text-xs md:text-sm p-2 md:p-3">
              Pelanggaran
            </TabsTrigger>
            <TabsTrigger value="cases" className="text-xs md:text-sm p-2 md:p-3">
              Kasus
            </TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs md:text-sm p-2 md:p-3">
              Presensi
            </TabsTrigger>
          </TabsList>

          {/* Violations Tab */}
          <TabsContent value="violations" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm md:text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                    Tren Pelanggaran Harian
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">7 hari terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-48 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={violationStats?.weeklyData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm md:text-base">Kategori Pelanggaran</CardTitle>
                  <CardDescription className="text-xs md:text-sm">30 hari terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-48 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={violationChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, count }) => `${category}: ${count}`}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="count"
                          className="text-xs md:text-sm"
                        >
                          {violationChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Violations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm md:text-base">Pelanggaran Terbaru</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-4">
                  {violationStats?.recent?.slice(0, 5).map((violation: any) => (
                    <div key={violation.id} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                          {violation.students?.full_name} ({violation.students?.nis})
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {violation.violation_types?.name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <Badge variant={violation.violation_types?.category === 'berat' ? 'destructive' : 
                                      violation.violation_types?.category === 'sedang' ? 'default' : 'secondary'}
                               className="text-xs">
                          {violation.violation_types?.category?.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(violation.violation_date), 'dd/MM')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cases Tab */}
          <TabsContent value="cases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm md:text-base">Kasus Terbaru</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-4">
                  {caseStats?.recent?.map((case_item: any) => (
                    <div key={case_item.id} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                          {case_item.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {case_item.case_number}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <Badge variant={case_item.status === 'pending' ? 'destructive' : 
                                      case_item.status === 'under_review' ? 'default' : 'secondary'}
                               className="text-xs">
                          {case_item.status?.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(case_item.created_at), 'dd/MM')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm md:text-base">Input Presensi Manual Hari Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
                  <div className="text-center p-2 md:p-3 bg-green-50 rounded-lg">
                    <div className="text-lg md:text-xl font-bold text-green-600">
                      {attendanceToday?.present || 0}
                    </div>
                    <div className="text-xs text-green-600">Hadir</div>
                  </div>
                  <div className="text-center p-2 md:p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg md:text-xl font-bold text-yellow-600">
                      {attendanceToday?.late || 0}
                    </div>
                    <div className="text-xs text-yellow-600">Terlambat</div>
                  </div>
                  <div className="text-center p-2 md:p-3 bg-red-50 rounded-lg">
                    <div className="text-lg md:text-xl font-bold text-red-600">
                      {attendanceToday?.absent || 0}
                    </div>
                    <div className="text-xs text-red-600">Tidak Hadir</div>
                  </div>
                  <div className="text-center p-2 md:p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg md:text-xl font-bold text-blue-600">
                      {attendanceToday?.permission || 0}
                    </div>
                    <div className="text-xs text-blue-600">Izin</div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={() => window.location.href = '/attendance-qr'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    🔍 Buka Scanner QR Presensi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};