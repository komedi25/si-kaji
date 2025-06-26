
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentAttendanceStats } from './StudentAttendanceStats';
import { StudentDisciplineStats } from './StudentDisciplineStats';
import { StudentAchievementStats } from './StudentAchievementStats';
import { StudentActivityOverview } from './StudentActivityOverview';
import { StudentQuickActions } from './StudentQuickActions';
import { useStudentData } from '@/hooks/useStudentData';
import { AlertTriangle, BookOpen, Trophy, Calendar, User, TrendingUp } from 'lucide-react';

export const StudentDashboard = () => {
  const { studentData, loading } = useStudentData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard siswa...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-amber-800">Data Siswa Tidak Ditemukan</h3>
            <p className="text-amber-700">
              Silakan hubungi admin untuk menghubungkan akun Anda dengan data siswa.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Selamat Datang, {studentData.full_name}
            </h1>
            <p className="opacity-90 text-lg">
              NIS: {studentData.nis} • Dashboard Pribadi Siswa
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm opacity-90">Pantau Perkembangan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <StudentQuickActions />

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Ringkasan</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Kehadiran</span>
          </TabsTrigger>
          <TabsTrigger value="discipline" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Disiplin</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Prestasi</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ringkasan Aktivitas Siswa
              </CardTitle>
              <CardDescription>
                Gambaran umum perkembangan dan aktivitas Anda di sekolah
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentActivityOverview studentId={studentData.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Statistik Kehadiran
              </CardTitle>
              <CardDescription>
                Analisis kehadiran dan rekap absensi Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentAttendanceStats studentId={studentData.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discipline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Rekam Kedisiplinan
              </CardTitle>
              <CardDescription>
                Poin kedisiplinan dan riwayat pelanggaran
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentDisciplineStats studentId={studentData.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Prestasi & Penghargaan
              </CardTitle>
              <CardDescription>
                Koleksi prestasi dan pencapaian Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentAchievementStats studentId={studentData.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil Pribadi
              </CardTitle>
              <CardDescription>
                Kelola data pribadi dan informasi kontak Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">NIS</label>
                  <p className="text-lg font-semibold">{studentData.nis}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                  <p className="text-lg font-semibold">{studentData.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Jenis Kelamin</label>
                  <p className="text-lg">{studentData.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="text-lg capitalize">{studentData.status}</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Catatan:</strong> Untuk mengubah data pribadi, silakan hubungi wali kelas atau tata usaha sekolah.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
