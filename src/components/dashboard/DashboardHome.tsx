
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatisticsCard } from '@/components/dashboard/StatisticsCard';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { RealtimeUpdates } from '@/components/dashboard/RealtimeUpdates';
import { RoleBasedStats } from '@/components/dashboard/RoleBasedStats';
import { SelfAttendanceWidget } from '@/components/attendance/SelfAttendanceWidget';
import { useAuth } from '@/hooks/useAuth';
import { Users, UserCheck, AlertTriangle, Trophy } from 'lucide-react';

export const DashboardHome = () => {
  const { hasRole } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatisticsCard
          title="Total Siswa"
          value="1,234"
          description="+5% dari bulan lalu"
          icon={Users}
        />
        <StatisticsCard
          title="Presensi Hari Ini"
          value="98.5%"
          description="1,215 dari 1,234 siswa"
          icon={UserCheck}
        />
        <StatisticsCard
          title="Pelanggaran Aktif"
          value="23"
          description="-12% dari minggu lalu"
          icon={AlertTriangle}
        />
        <StatisticsCard
          title="Prestasi Bulan Ini"
          value="45"
          description="+23% dari bulan lalu"
          icon={Trophy}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Presensi Mandiri Widget untuk siswa */}
        {hasRole('siswa') && (
          <div className="lg:col-span-1">
            <SelfAttendanceWidget />
          </div>
        )}
        
        {/* Role-based statistics */}
        <div className={hasRole('siswa') ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <RoleBasedStats />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DashboardCharts />
        <RealtimeUpdates />
      </div>
    </div>
  );
};
