
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { AttendanceRecorder } from '@/components/attendance/AttendanceRecorder';
import { AttendanceReport } from '@/components/attendance/AttendanceReport';
import { SelfAttendanceWidget } from '@/components/attendance/SelfAttendanceWidget';
import { LocationManager } from '@/components/attendance/LocationManager';
import { ScheduleManager } from '@/components/attendance/ScheduleManager';
import { useAuth } from '@/hooks/useAuth';

const AttendanceManagement = () => {
  const [searchParams] = useSearchParams();
  const { hasRole } = useAuth();
  const initialTab = searchParams.get('tab') || 'record';

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Presensi</h1>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          {(hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk')) && (
            <TabsTrigger value="record">Input Presensi</TabsTrigger>
          )}
          
          {(hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk')) && (
            <TabsTrigger value="report">Laporan Presensi</TabsTrigger>
          )}
          
          <TabsTrigger value="self">Presensi Mandiri</TabsTrigger>
          
          {hasRole('admin') && (
            <>
              <TabsTrigger value="location">Pengaturan Lokasi</TabsTrigger>
              <TabsTrigger value="schedule">Pengaturan Jadwal</TabsTrigger>
            </>
          )}
        </TabsList>

        {(hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk')) && (
          <TabsContent value="record" className="space-y-6">
            <AttendanceRecorder />
          </TabsContent>
        )}

        {(hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk')) && (
          <TabsContent value="report" className="space-y-6">
            <AttendanceReport />
          </TabsContent>
        )}

        <TabsContent value="self" className="space-y-6">
          <div className="max-w-2xl mx-auto">
            <SelfAttendanceWidget />
          </div>
        </TabsContent>

        {hasRole('admin') && (
          <TabsContent value="location" className="space-y-6">
            <LocationManager />
          </TabsContent>
        )}

        {hasRole('admin') && (
          <TabsContent value="schedule" className="space-y-6">
            <ScheduleManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AttendanceManagement;
