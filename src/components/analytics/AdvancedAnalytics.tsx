
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, GraduationCap, AlertTriangle, Trophy } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AdvancedAnalytics = () => {
  // Mock data - in real implementation, this would come from API
  const studentTrendData = [
    { month: 'Jan', students: 1200, violations: 45, achievements: 78 },
    { month: 'Feb', students: 1250, violations: 38, achievements: 82 },
    { month: 'Mar', students: 1280, violations: 42, achievements: 91 },
    { month: 'Apr', students: 1290, violations: 35, achievements: 88 },
    { month: 'May', students: 1305, violations: 29, achievements: 95 },
    { month: 'Jun', students: 1320, violations: 31, achievements: 102 }
  ];

  const violationTypeData = [
    { name: 'Terlambat', value: 45, color: '#FF8042' },
    { name: 'Tidak Hadir', value: 32, color: '#FFBB28' },
    { name: 'Seragam', value: 28, color: '#00C49F' },
    { name: 'Perilaku', value: 15, color: '#0088FE' },
    { name: 'Lainnya', value: 12, color: '#8884D8' }
  ];

  const achievementData = [
    { category: 'Akademik', count: 156 },
    { category: 'Olahraga', count: 89 },
    { category: 'Seni', count: 67 },
    { category: 'Teknologi', count: 45 },
    { category: 'Kepemimpinan', count: 34 }
  ];

  const attendanceData = [
    { day: 'Sen', rate: 95 },
    { day: 'Sel', rate: 97 },
    { day: 'Rab', rate: 94 },
    { day: 'Kam', rate: 96 },
    { day: 'Jum', rate: 92 },
    { day: 'Sab', rate: 89 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive data insights and visualizations
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,320</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +2.1% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +0.8% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggaran Aktif</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">31</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 text-green-500" />
              -18.2% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestasi Bulan Ini</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">102</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +14.6% dari bulan lalu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          <TabsTrigger value="violations">Violation Analysis</TabsTrigger>
          <TabsTrigger value="achievements">Achievement Analysis</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Population & Performance Trends</CardTitle>
              <CardDescription>
                Monthly trends showing student count, violations, and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={studentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="students" stroke="#8884d8" strokeWidth={2} name="Siswa" />
                  <Line type="monotone" dataKey="violations" stroke="#ff7300" strokeWidth={2} name="Pelanggaran" />
                  <Line type="monotone" dataKey="achievements" stroke="#00ff00" strokeWidth={2} name="Prestasi" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Violation Types Distribution</CardTitle>
                <CardDescription>
                  Breakdown of violation types this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={violationTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {violationTypeData.map((entry, index) => (
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
                <CardTitle>Violation Trend</CardTitle>
                <CardDescription>
                  Monthly violation counts by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={studentTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="violations" fill="#ff7300" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievement Categories</CardTitle>
              <CardDescription>
                Distribution of achievements by category this year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={achievementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Attendance Rates</CardTitle>
              <CardDescription>
                Average attendance percentage by day of week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="rate" stroke="#0088FE" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
