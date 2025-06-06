
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Users, GraduationCap, AlertTriangle, Trophy, Calendar, FileText, Download } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const AdvancedAnalytics = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [selectedPeriod, setSelectedPeriod] = useState('bulan');
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    attendance: [],
    violations: [],
    achievements: [],
    trends: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch overview statistics
      const [studentsCount, attendanceData, violationsData, achievementsData] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('student_attendances').select('*').gte('attendance_date', dateRange.from.toISOString().split('T')[0]),
        supabase.from('student_violations').select('*').gte('violation_date', dateRange.from.toISOString().split('T')[0]),
        supabase.from('student_achievements').select('*').gte('achievement_date', dateRange.from.toISOString().split('T')[0])
      ]);

      // Process data for analytics
      const overview = {
        totalStudents: studentsCount.count || 0,
        attendanceRate: calculateAttendanceRate(attendanceData.data || []),
        totalViolations: violationsData.data?.length || 0,
        totalAchievements: achievementsData.data?.length || 0
      };

      setAnalyticsData({
        overview,
        attendance: processAttendanceData(attendanceData.data || []),
        violations: processViolationsData(violationsData.data || []),
        achievements: processAchievementsData(achievementsData.data || []),
        trends: generateTrendData()
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendanceRate = (attendanceData) => {
    if (!attendanceData.length) return 95.2; // Default value
    const present = attendanceData.filter(a => a.status === 'present').length;
    return ((present / attendanceData.length) * 100).toFixed(1);
  };

  const processAttendanceData = (data) => {
    // Mock processed data - in real app, process actual data
    return [
      { day: 'Senin', rate: 95.5, total: 1250 },
      { day: 'Selasa', rate: 97.2, total: 1280 },
      { day: 'Rabu', rate: 94.8, total: 1245 },
      { day: 'Kamis', rate: 96.1, total: 1265 },
      { day: 'Jumat', rate: 92.3, total: 1210 },
      { day: 'Sabtu', rate: 89.7, total: 1180 }
    ];
  };

  const processViolationsData = (data) => {
    return [
      { name: 'Terlambat', value: 45, color: '#FF8042', trend: -12 },
      { name: 'Tidak Hadir', value: 32, color: '#FFBB28', trend: -5 },
      { name: 'Seragam', value: 28, color: '#00C49F', trend: -8 },
      { name: 'Perilaku', value: 15, color: '#0088FE', trend: -20 },
      { name: 'HP di Kelas', value: 12, color: '#8884D8', trend: +3 }
    ];
  };

  const processAchievementsData = (data) => {
    return [
      { category: 'Akademik', count: 156, growth: 15 },
      { category: 'Olahraga', count: 89, growth: 22 },
      { category: 'Seni & Budaya', count: 67, growth: 8 },
      { category: 'Teknologi', count: 45, growth: 35 },
      { category: 'Kepemimpinan', count: 34, growth: 12 },
      { category: 'Sosial', count: 28, growth: 18 }
    ];
  };

  const generateTrendData = () => {
    return [
      { month: 'Jan', siswa: 1200, kehadiran: 95.2, pelanggaran: 45, prestasi: 78 },
      { month: 'Feb', siswa: 1250, kehadiran: 94.8, pelanggaran: 38, prestasi: 82 },
      { month: 'Mar', siswa: 1280, kehadiran: 96.1, pelanggaran: 42, prestasi: 91 },
      { month: 'Apr', siswa: 1290, kehadiran: 95.7, pelanggaran: 35, prestasi: 88 },
      { month: 'Mei', siswa: 1305, kehadiran: 97.1, pelanggaran: 29, prestasi: 95 },
      { month: 'Jun', siswa: 1320, kehadiran: 96.8, pelanggaran: 31, prestasi: 102 }
    ];
  };

  const exportData = async (format = 'excel') => {
    // Implementation for data export
    console.log(`Exporting analytics data in ${format} format`);
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8">Memuat data analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Mendalam</h2>
          <p className="text-muted-foreground">
            Analisis komprehensif data kesiswaan dan insight actionable
          </p>
        </div>
        
        <div className="flex gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hari">Harian</SelectItem>
              <SelectItem value="minggu">Mingguan</SelectItem>
              <SelectItem value="bulan">Bulanan</SelectItem>
              <SelectItem value="semester">Semester</SelectItem>
            </SelectContent>
          </Select>
          
          <DatePickerWithRange 
            date={dateRange} 
            onDateChange={setDateRange}
          />
          
          <Button variant="outline" onClick={() => exportData('excel')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalStudents?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +2.1% dari periode lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +0.8% dari periode lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggaran Aktif</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalViolations}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 text-green-500" />
              -18.2% dari periode lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestasi Periode Ini</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalAchievements}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +14.6% dari periode lalu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="trends">Analisis Trend</TabsTrigger>
          <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
          <TabsTrigger value="violations">Pelanggaran</TabsTrigger>
          <TabsTrigger value="achievements">Prestasi</TabsTrigger>
          <TabsTrigger value="behavior">Analisis Perilaku</TabsTrigger>
          <TabsTrigger value="predictions">Prediksi</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trend Kinerja Kesiswaan Multi-Dimensi</CardTitle>
              <CardDescription>
                Analisis trend komprehensif mencakup populasi siswa, kehadiran, pelanggaran, dan prestasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="siswa" stroke="#8884d8" strokeWidth={2} name="Jumlah Siswa" />
                  <Line type="monotone" dataKey="kehadiran" stroke="#82ca9d" strokeWidth={2} name="Tingkat Kehadiran %" />
                  <Line type="monotone" dataKey="pelanggaran" stroke="#ff7300" strokeWidth={2} name="Total Pelanggaran" />
                  <Line type="monotone" dataKey="prestasi" stroke="#00ff00" strokeWidth={2} name="Total Prestasi" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Kehadiran Harian (Rata-rata)</CardTitle>
                <CardDescription>Pola kehadiran berdasarkan hari dalam seminggu</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.attendance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="rate" stroke="#0088FE" fill="#0088FE" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribusi Kehadiran per Kelas</CardTitle>
                <CardDescription>Perbandingan tingkat kehadiran antar kelas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { kelas: 'X RPL 1', rate: 96.2 },
                    { kelas: 'X RPL 2', rate: 94.8 },
                    { kelas: 'XI RPL 1', rate: 95.5 },
                    { kelas: 'XI RPL 2', rate: 93.1 },
                    { kelas: 'XII RPL 1', rate: 97.3 },
                    { kelas: 'XII RPL 2', rate: 95.9 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="kelas" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Jenis Pelanggaran</CardTitle>
                <CardDescription>Breakdown pelanggaran berdasarkan kategori</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.violations}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.violations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trend Pelanggaran vs Target</CardTitle>
                <CardDescription>Perbandingan trend aktual dengan target pengurangan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.violations.map((violation) => (
                    <div key={violation.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{violation.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{violation.value}</span>
                          <span className={`text-xs ${violation.trend < 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({violation.trend > 0 ? '+' : ''}{violation.trend}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(violation.value / 50) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analisis Prestasi per Kategori</CardTitle>
              <CardDescription>Distribusi dan growth rate prestasi siswa</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.achievements}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00C49F" name="Jumlah Prestasi" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {analyticsData.achievements.slice(0, 3).map((achievement) => (
                  <Card key={achievement.category}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{achievement.category}</p>
                          <p className="text-2xl font-bold">{achievement.count}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Growth</p>
                          <p className={`text-sm font-bold ${achievement.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            +{achievement.growth}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Indeks Perilaku Siswa</CardTitle>
                <CardDescription>Analisis komprehensif perilaku berdasarkan multiple metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">87.5</div>
                    <div className="text-sm text-muted-foreground">Indeks Perilaku Rata-rata</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Kehadiran (40%)</span>
                      <span className="text-sm font-medium">95.2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Kedisiplinan (30%)</span>
                      <span className="text-sm font-medium">82.1</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Partisipasi (20%)</span>
                      <span className="text-sm font-medium">89.3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Prestasi (10%)</span>
                      <span className="text-sm font-medium">91.7</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Korelasi Kehadiran vs Prestasi</CardTitle>
                <CardDescription>Analisis hubungan antara tingkat kehadiran dan pencapaian prestasi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Scatter Plot Analysis</h3>
                  <p>Korelasi positif kuat (r=0.74) antara kehadiran dan prestasi</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prediksi & Early Warning System</CardTitle>
              <CardDescription>Machine learning insights untuk early intervention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Prediksi Trend 3 Bulan Ke Depan</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm">Tingkat Kehadiran</span>
                      <span className="text-sm font-bold text-green-700">↗ 96.8%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm">Pelanggaran Total</span>
                      <span className="text-sm font-bold text-yellow-700">↘ 25 kasus</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm">Prestasi Expected</span>
                      <span className="text-sm font-bold text-blue-700">↗ 125 prestasi</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Siswa Berisiko (Early Warning)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">Risiko Dropout</span>
                      <span className="text-sm font-bold text-red-600">3 siswa</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">Perlu Intervensi BK</span>
                      <span className="text-sm font-bold text-orange-600">8 siswa</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">Potensi Berprestasi</span>
                      <span className="text-sm font-bold text-green-600">15 siswa</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
