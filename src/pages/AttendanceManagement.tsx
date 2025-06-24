
import React from 'react';
import { useLocation } from 'react-router-dom';
import { AttendanceRecorder } from '@/components/attendance/AttendanceRecorder';
import { AttendanceReport } from '@/components/attendance/AttendanceReport';
import { SelfAttendanceWithRefresh } from '@/components/attendance/SelfAttendanceWithRefresh';
import { LocationManager } from '@/components/attendance/LocationManager';
import { ScheduleManager } from '@/components/attendance/ScheduleManager';
import { DatabaseDiagnostic } from '@/components/debug/DatabaseDiagnostic';
import { useAuth } from '@/hooks/useAuth';
import { useStudentData } from '@/hooks/useStudentData';
import { AppLayout } from '@/components/layout/AppLayout';

const AttendanceManagement = () => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const { studentData, error: studentError } = useStudentData();
  
  // Determine the current tab from the path
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/attendance/self') return 'self';
    if (path === '/attendance/record') return 'record';
    if (path === '/attendance/report') return 'report';
    if (path === '/attendance/location') return 'location';
    if (path === '/attendance/schedule') return 'schedule';
    return 'self'; // default
  };

  const tab = getCurrentTab();

  const renderContent = () => {
    switch (tab) {
      case 'self':
        // Show diagnostic if there's a student data error
        if (studentError && !studentData) {
          return (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">Database Diagnostic Mode</h3>
                <p className="text-sm text-yellow-700">
                  Karena terjadi error dalam mengambil data siswa, sistem menampilkan diagnostic tool untuk membantu identifikasi masalah.
                </p>
              </div>
              <DatabaseDiagnostic />
              <SelfAttendanceWithRefresh />
            </div>
          );
        }
        return (
          <div className="max-w-md mx-auto">
            <SelfAttendanceWithRefresh />
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
            <SelfAttendanceWithRefresh />
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
