
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function DashboardCharts() {
  const [violationData, setViolationData] = useState<any[]>([]);
  const [achievementData, setAchievementData] = useState<any[]>([]);
  const [disciplineData, setDisciplineData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      setLoading(true);

      // Load violation trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: violations } = await supabase
        .from('student_violations')
        .select(`
          violation_date,
          violation_types (category)
        `)
        .gte('violation_date', sixMonthsAgo.toISOString().split('T')[0])
        .eq('status', 'active');

      // Process violation data by month
      const violationByMonth = violations?.reduce((acc: any, violation) => {
        const month = new Date(violation.violation_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        if (!acc[month]) acc[month] = 0;
        acc[month]++;
        return acc;
      }, {}) || {};

      const violationChartData = Object.entries(violationByMonth).map(([month, count]) => ({
        month,
        pelanggaran: count
      }));

      setViolationData(violationChartData);

      // Load achievement data
      const { data: achievements } = await supabase
        .from('student_achievements')
        .select(`
          achievement_date,
          achievement_types (category)
        `)
        .gte('achievement_date', sixMonthsAgo.toISOString().split('T')[0])
        .eq('status', 'verified');

      const achievementByMonth = achievements?.reduce((acc: any, achievement) => {
        const month = new Date(achievement.achievement_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        if (!acc[month]) acc[month] = 0;
        acc[month]++;
        return acc;
      }, {}) || {};

      const achievementChartData = Object.entries(achievementByMonth).map(([month, count]) => ({
        month,
        prestasi: count
      }));

      setAchievementData(achievementChartData);

      // Load discipline status distribution
      const { data: disciplinePoints } = await supabase
        .from('student_discipline_points')
        .select('discipline_status');

      const disciplineDistribution = disciplinePoints?.reduce((acc: any, point) => {
        if (!acc[point.discipline_status]) acc[point.discipline_status] = 0;
        acc[point.discipline_status]++;
        return acc;
      }, {}) || {};

      const disciplineChartData = Object.entries(disciplineDistribution).map(([status, count]) => ({
        name: status === 'excellent' ? 'Sangat Baik' : 
              status === 'good' ? 'Baik' :
              status === 'warning' ? 'Peringatan' :
              status === 'probation' ? 'Probasi' : 'Kritis',
        value: count
      }));

      setDisciplineData(disciplineChartData);

      // Load attendance data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: attendances } = await supabase
        .from('student_attendances')
        .select('attendance_date, status')
        .gte('attendance_date', thirtyDaysAgo.toISOString().split('T')[0]);

      const attendanceByDate = attendances?.reduce((acc: any, attendance) => {
        const date = new Date(attendance.attendance_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        if (!acc[date]) acc[date] = { hadir: 0, tidak_hadir: 0 };
        if (attendance.status === 'present') {
          acc[date].hadir++;
        } else {
          acc[date].tidak_hadir++;
        }
        return acc;
      }, {}) || {};

      const attendanceChartData = Object.entries(attendanceByDate).map(([date, data]: [string, any]) => ({
        tanggal: date,
        hadir: data.hadir,
        tidak_hadir: data.tidak_hadir
      }));

      setAttendanceData(attendanceChartData.slice(-14)); // Last 14 days

    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Violation Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Pelanggaran</CardTitle>
          <CardDescription>Data pelanggaran 6 bulan terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={violationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="pelanggaran" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Achievement Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Prestasi</CardTitle>
          <CardDescription>Data prestasi 6 bulan terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={achievementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="prestasi" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Discipline Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Status Disiplin</CardTitle>
          <CardDescription>Sebaran tingkat kedisiplinan siswa</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={disciplineData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {disciplineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Attendance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Kehadiran</CardTitle>
          <CardDescription>Data kehadiran 14 hari terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tanggal" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hadir" stackId="a" fill="#10b981" />
              <Bar dataKey="tidak_hadir" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
