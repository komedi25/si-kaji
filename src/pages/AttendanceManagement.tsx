
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AttendanceRecorder } from '@/components/attendance/AttendanceRecorder';
import { AttendanceReport } from '@/components/attendance/AttendanceReport';
import { SelfAttendanceWidget } from '@/components/attendance/SelfAttendanceWidget';
import { LocationManager } from '@/components/attendance/LocationManager';
import { ScheduleManager } from '@/components/attendance/ScheduleManager';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';

const AttendanceManagement = () => {
  const [searchParams] = useSearchParams();
  const { hasRole } = useAuth();
  const tab = searchParams.get('tab') || 'self';

  const renderContent = () => {
    switch (tab) {
      case 'self':
        return (
          <div className="max-w-md mx-auto">
            <SelfAttendanceWidget />
          </div>
        );
      case 'record':
        if (hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk')) {
          return <AttendanceRecorder />;
        }
        break;
      case 'report':
        if (hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk')) {
          return <AttendanceReport />;
        }
        break;
      case 'location':
        if (hasRole('admin')) {
          return <LocationManager />;
        }
        break;
      case 'schedule':
        if (hasRole('admin')) {
          return <ScheduleManager />;
        }
        break;
      default:
        return (
          <div className="max-w-md mx-auto">
            <SelfAttendanceWidget />
          </div>
        );
    }

    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          Anda tidak memiliki akses ke halaman ini
        </div>
      </div>
    );
  };

  const getPageTitle = () => {
    switch (tab) {
      case 'self':
        return 'Presensi Mandiri';
      case 'record':
        return 'Input Presensi';
      case 'report':
        return 'Laporan Presensi';
      case 'location':
        return 'Kelola Lokasi';
      case 'schedule':
        return 'Kelola Jadwal';
      default:
        return 'Manajemen Presensi';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
        </div>

        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default AttendanceManagement;
