
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const initialTab = searchParams.get('tab') || 'self';

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manajemen Presensi</h1>
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto">
            <TabsTrigger value="self" className="text-xs md:text-sm">
              Presensi Mandiri
            </TabsTrigger>
            
            {(hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk')) && (
              <TabsTrigger value="record" className="text-xs md:text-sm">
                Input Presensi
              </TabsTrigger>
            )}
            
            {(hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk')) && (
              <TabsTrigger value="report" className="text-xs md:text-sm">
                Laporan Presensi
              </TabsTrigger>
            )}
            
            {hasRole('admin') && (
              <TabsTrigger value="location" className="text-xs md:text-sm">
                Kelola Lokasi
              </TabsTrigger>
            )}
            
            {hasRole('admin') && (
              <TabsTrigger value="schedule" className="text-xs md:text-sm">
                Kelola Jadwal
              </TabsTrigger>
            )}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="self" className="mt-0">
              <div className="max-w-md mx-auto">
                <SelfAttendanceWidget />
              </div>
            </TabsContent>

            {(hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk')) && (
              <TabsContent value="record" className="mt-0">
                <AttendanceRecorder />
              </TabsContent>
            )}

            {(hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk')) && (
              <TabsContent value="report" className="mt-0">
                <AttendanceReport />
              </TabsContent>
            )}

            {hasRole('admin') && (
              <TabsContent value="location" className="mt-0">
                <LocationManager />
              </TabsContent>
            )}

            {hasRole('admin') && (
              <TabsContent value="schedule" className="mt-0">
                <ScheduleManager />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AttendanceManagement;
