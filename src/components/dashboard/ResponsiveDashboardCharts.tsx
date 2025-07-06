
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Sample data
const attendanceData = [
  { day: 'Sen', hadir: 450, izin: 12, alpha: 8 },
  { day: 'Sel', hadir: 445, izin: 15, alpha: 10 },
  { day: 'Rab', hadir: 448, izin: 10, alpha: 12 },
  { day: 'Kam', hadir: 442, izin: 18, alpha: 10 },
  { day: 'Jum', hadir: 440, izin: 20, alpha: 10 },
];

const weeklyTrendData = [
  { week: 'W1', kehadiran: 95.2 },
  { week: 'W2', kehadiran: 94.8 },
  { week: 'W3', kehadiran: 96.1 },
  { week: 'W4', kehadiran: 93.5 },
];

const violationData = [
  { name: 'Terlambat', value: 45, color: '#ef4444' },
  { name: 'Tidak Hadir', value: 23, color: '#f97316' },
  { name: 'Seragam', value: 12, color: '#eab308' },
  { name: 'Lainnya', value: 8, color: '#6b7280' },
];

export const ResponsiveDashboardCharts = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Daily Attendance Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Presensi Harian</CardTitle>
          <CardDescription>Data kehadiran siswa per hari dalam seminggu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attendanceData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 0,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="day" 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="hadir" stackId="a" fill="#22c55e" name="Hadir" />
                <Bar dataKey="izin" stackId="a" fill="#f59e0b" name="Izin" />
                <Bar dataKey="alpha" stackId="a" fill="#ef4444" name="Alpha" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tren Kehadiran Mingguan</CardTitle>
          <CardDescription className="text-sm">Persentase kehadiran per minggu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weeklyTrendData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  fontSize={11}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  domain={['dataMin - 2', 'dataMax + 2']}
                  fontSize={11}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Kehadiran']}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="kehadiran" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Violation Distribution */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Distribusi Pelanggaran</CardTitle>
          <CardDescription className="text-sm">Jenis pelanggaran bulan ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={violationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {violationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [value, 'Jumlah']}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
