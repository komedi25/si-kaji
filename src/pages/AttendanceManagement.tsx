
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceRecorder } from '@/components/attendance/AttendanceRecorder';
import { AttendanceReport } from '@/components/attendance/AttendanceReport';
import { AppLayout } from '@/components/layout/AppLayout';

const AttendanceManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('record');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const renderContent = () => {
    switch (activeTab) {
      case 'record':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Input Presensi Harian</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Catat kehadiran siswa per kelas dan tanggal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceRecorder />
            </CardContent>
          </Card>
        );
      case 'report':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Laporan Presensi</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Lihat dan analisis data kehadiran siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceReport />
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Input Presensi Harian</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Catat kehadiran siswa per kelas dan tanggal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceRecorder />
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manajemen Presensi</h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Kelola presensi harian siswa dan laporan kehadiran
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
};

export default AttendanceManagement;
