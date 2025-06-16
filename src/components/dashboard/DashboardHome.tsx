
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Siswa"
          value="1,234"
          description="+5% dari bulan lalu"
          icon={Users}
        />
        <StatsCard
          title="Presensi Hari Ini"
          value="98.5%"
          description="1,215 dari 1,234 siswa"
          icon={UserCheck}
        />
        <StatsCard
          title="Pelanggaran Aktif"
          value="23"
          description="-12% dari minggu lalu"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Prestasi Bulan Ini"
          value="45"
          description="+23% dari bulan lalu"
          icon={Trophy}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Self Attendance Widget - Only for students */}
        {hasRole('siswa') && (
          <div className="lg:col-span-4">
            <SelfAttendanceWidget />
          </div>
        )}
        
        {/* Role-based Statistics */}
        <div className={hasRole('siswa') ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <RoleBasedStats />
        </div>
      </div>

      {/* Charts and Updates */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        <div className="order-1">
          <DashboardCharts />
        </div>
        <div className="order-2">
          <RealtimeUpdates />
        </div>
      </div>
    </div>
  );
};
