
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Calendar, Award, AlertTriangle, GraduationCap } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const ClassAnalytics = () => {
  // Mock data - in production, this would come from database
  const attendanceData = [
    { day: 'Sen', rate: 95 },
    { day: 'Sel', rate: 97 },
    { day: 'Rab', rate: 94 },
    { day: 'Kam', rate: 96 },
    { day: 'Jum', rate: 92 },
    { day: 'Sab', rate: 89 }
  ];

  const behaviorData = [
    { name: 'Sangat Baik', value: 60, color: '#00C49F' },
    { name: 'Baik', value: 25, color: '#0088FE' },
    { name: 'Perhatian', value: 12, color: '#FFBB28' },
    { name: 'Kritis', value: 3, color: '#FF8042' }
  ];

  const monthlyProgress = [
    { month: 'Jan', kehadiran: 95, perilaku: 85, prestasi: 78 },
    { month: 'Feb', kehadiran: 94, perilaku: 87, prestasi: 82 },
    { month: 'Mar', kehadiran: 96, perilaku: 89, prestasi: 85 },
    { month: 'Apr', kehadiran: 93, perilaku: 88, prestasi: 88 },
    { month: 'Mei', kehadiran: 95, perilaku: 91, prestasi: 92 },
    { month: 'Jun', kehadiran: 97, perilaku: 93, prestasi: 95 }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              Kapasitas penuh
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.8%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +2.1% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Disiplin</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.5</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +5.2 poin dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prestasi</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +8 prestasi bulan ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trend Kehadiran Harian</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[85, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#0088FE" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Status Perilaku</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={behaviorData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {behaviorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progres Bulanan Kelas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="kehadiran" fill="#0088FE" name="Kehadiran %" />
              <Bar dataKey="perilaku" fill="#00C49F" name="Perilaku Score" />
              <Bar dataKey="prestasi" fill="#FFBB28" name="Prestasi Score" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Student Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Performa Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Kehadiran Sangat Baik (≥95%)</span>
                  <span className="text-sm text-muted-foreground">28 siswa</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Disiplin Baik (≥80)</span>
                  <span className="text-sm text-muted-foreground">30 siswa</span>
                </div>
                <Progress value={85.7} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memiliki Prestasi</span>
                  <span className="text-sm text-muted-foreground">18 siswa</span>
                </div>
                <Progress value={51.4} className="h-2" />
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Rekomendasi Tindak Lanjut</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 5 siswa memerlukan perhatian khusus untuk peningkatan kehadiran</li>
                <li>• 3 siswa perlu bimbingan konseling untuk perbaikan perilaku</li>
                <li>• 17 siswa potensial untuk dikembangkan prestasinya</li>
                <li>• Komunikasi intensif dengan 8 orang tua siswa yang perlu perhatian</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
