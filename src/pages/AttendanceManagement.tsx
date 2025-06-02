
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceRecorder } from '@/components/attendance/AttendanceRecorder';
import { AttendanceReport } from '@/components/attendance/AttendanceReport';
import { 
  Calendar, 
  FileText
} from 'lucide-react';

const AttendanceManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Presensi</h1>
        <p className="text-gray-600 mt-2">
          Kelola presensi harian siswa dan laporan kehadiran
        </p>
      </div>

      <Tabs defaultValue="record" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="record" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Input Presensi
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Laporan Presensi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Input Presensi Harian</CardTitle>
              <CardDescription>
                Catat kehadiran siswa per kelas dan tanggal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceRecorder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Presensi</CardTitle>
              <CardDescription>
                Lihat dan analisis data kehadiran siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceReport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendanceManagement;
