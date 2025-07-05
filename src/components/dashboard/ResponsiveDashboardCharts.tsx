
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const weeklyAttendanceData = [
  { day: 'Sen', present: 85, absent: 15 },
  { day: 'Sel', present: 82, absent: 18 },
  { day: 'Rab', present: 88, absent: 12 },
  { day: 'Kam', present: 86, absent: 14 },
  { day: 'Jum', present: 90, absent: 10 },
];

const violationData = [
  { month: 'Jan', count: 12 },
  { month: 'Feb', count: 8 },
  { month: 'Mar', count: 15 },
  { month: 'Apr', count: 6 },
  { month: 'Mei', count: 10 },
];

const achievementData = [
  { name: 'Akademik', value: 45, color: '#0088FE' },
  { name: 'Olahraga', value: 30, color: '#00C49F' },
  { name: 'Seni', value: 15, color: '#FFBB28' },
  { name: 'Lainnya', value: 10, color: '#FF8042' },
];

export const ResponsiveDashboardCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      {/* Weekly Attendance Trend */}
      <Card className="col-span-1 lg:col-span-2 xl:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Tren Kehadiran Mingguan</CardTitle>
          <CardDescription className="text-sm">
            Persentase kehadiran siswa per hari dalam seminggu terakhir
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          <div className="h-[200px] md:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weeklyAttendanceData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="present" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  name="Hadir (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Violations */}
      <Card className="col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Pelanggaran Bulanan</CardTitle>
          <CardDescription className="text-sm">
            Jumlah pelanggaran dalam 5 bulan terakhir
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          <div className="h-[200px] md:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={violationData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#ef4444" 
                  radius={[2, 2, 0, 0]}
                  name="Pelanggaran"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Distribution */}
      <Card className="col-span-1 lg:col-span-2 xl:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Distribusi Prestasi</CardTitle>
          <CardDescription className="text-sm">
            Pembagian prestasi siswa berdasarkan kategori
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          <div className="h-[200px] md:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={achievementData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  fontSize={10}
                >
                  {achievementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
