
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
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Presensi</h1>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList>
          {hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk') ? (
            <TabsTrigger value="record">Input Presensi</TabsTrigger>
          ) : null}
          
          {hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk') ? (
            <TabsTrigger value="report">Laporan Presensi</TabsTrigger>
          ) : null}
          
          <TabsTrigger value="self">Presensi Mandiri</TabsTrigger>
          
          {hasRole('admin') ? (
            <>
              <TabsTrigger value="location">Pengaturan Lokasi</TabsTrigger>
              <TabsTrigger value="schedule">Pengaturan Jadwal</TabsTrigger>
            </>
          ) : null}
        </TabsList>

        {hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk') ? (
          <TabsContent value="record">
            <AttendanceRecorder />
          </TabsContent>
        ) : null}

        {hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('tppk') ? (
          <TabsContent value="report">
            <AttendanceReport />
          </TabsContent>
        ) : null}

        <TabsContent value="self">
          <div className="max-w-md mx-auto">
            <SelfAttendanceWidget />
          </div>
        </TabsContent>

        {hasRole('admin') ? (
          <TabsContent value="location">
            <LocationManager />
          </TabsContent>
        ) : null}

        {hasRole('admin') ? (
          <TabsContent value="schedule">
            <ScheduleManager />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
};

export default AttendanceManagement;
