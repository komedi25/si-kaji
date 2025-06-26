
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentAttendanceStats } from './StudentAttendanceStats';
import { StudentDisciplineStats } from './StudentDisciplineStats';
import { StudentAchievementStats } from './StudentAchievementStats';
import { StudentActivityOverview } from './StudentActivityOverview';
import { StudentQuickActions } from './StudentQuickActions';
import { useStudentData } from '@/hooks/useStudentData';
import { AlertTriangle, BookOpen, Trophy, Calendar } from 'lucide-react';

export const StudentDashboard = () => {
  const { studentData, loading } = useStudentData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Data Siswa Tidak Ditemukan</h3>
            <p className="text-muted-foreground">
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
        <h1 className="text-2xl font-bold mb-2">
          Selamat Datang, {studentData.full_name}
        </h1>
        <p className="opacity-90">
          NIS: {studentData.nis} • Dashboard Pribadi Siswa
        </p>
      </div>

      {/* Quick Actions */}
      <StudentQuickActions />

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Ringkasan
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Kehadiran
          </TabsTrigger>
          <TabsTrigger value="discipline" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Disiplin
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Prestasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <StudentActivityOverview studentId={studentData.id} />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <StudentAttendanceStats studentId={studentData.id} />
        </TabsContent>

        <TabsContent value="discipline" className="space-y-4">
          <StudentDisciplineStats studentId={studentData.id} />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <StudentAchievementStats studentId={studentData.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
