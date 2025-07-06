
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ExtracurricularEnrollment } from '@/components/extracurricular/ExtracurricularEnrollment';
import { EnhancedExtracurricularEnrollment } from '@/components/extracurricular/EnhancedExtracurricularEnrollment';
import { ExtracurricularCoordinatorDashboard } from '@/components/extracurricular/ExtracurricularCoordinatorDashboard';
import { StudentExtracurricularEnrollment } from '@/components/student/StudentExtracurricularEnrollment';
import { StudentExtracurricularActivity } from '@/components/student/StudentExtracurricularActivity';
import { CoachActivityLog } from '@/components/extracurricular/CoachActivityLog';
import { CoachAttendance } from '@/components/extracurricular/CoachAttendance';
import { CoachProgressTracker } from '@/components/extracurricular/CoachProgressTracker';
import { AutomatedAttendanceSystem } from '@/components/extracurricular/AutomatedAttendanceSystem';
import { ExtracurricularManager } from '@/components/masterData/ExtracurricularManager';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ExtracurricularManagement = () => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('enrollment');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const renderContent = () => {
    // If user is a student, show specific student views
    if (hasRole('siswa')) {
      switch (activeTab) {
        case 'enrollment':
          return <StudentExtracurricularEnrollment />;
        case 'my-activities':
          return <StudentExtracurricularActivity />;
        default:
          return <StudentExtracurricularEnrollment />;
      }
    }

    // If user is coordinator, show coordinator dashboard and management tools
    if (hasRole('koordinator_ekstrakurikuler')) {
      return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="enrollment">Pendaftaran</TabsTrigger>
            <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="activity-log">Jurnal</TabsTrigger>
            <TabsTrigger value="master-data">Master Data</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ExtracurricularCoordinatorDashboard />
          </TabsContent>
          
          <TabsContent value="enrollment">
            <EnhancedExtracurricularEnrollment />
          </TabsContent>
          
          <TabsContent value="attendance">
            <AutomatedAttendanceSystem />
          </TabsContent>
          
          <TabsContent value="progress">
            <CoachProgressTracker />
          </TabsContent>
          
          <TabsContent value="activity-log">
            <CoachActivityLog />
          </TabsContent>
          
          <TabsContent value="master-data">
            <ExtracurricularManager />
          </TabsContent>
        </Tabs>
      );
    }

    // If user is coach, show coach-specific tools
    if (hasRole('pelatih_ekstrakurikuler')) {
      return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
            <TabsTrigger value="progress">Progress Siswa</TabsTrigger>
            <TabsTrigger value="activity-log">Jurnal Kegiatan</TabsTrigger>
            <TabsTrigger value="my-attendance">Presensi Saya</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <AutomatedAttendanceSystem />
          </TabsContent>
          
          <TabsContent value="progress">
            <CoachProgressTracker />
          </TabsContent>
          
          <TabsContent value="activity-log">
            <CoachActivityLog />
          </TabsContent>
          
          <TabsContent value="my-attendance">
            <CoachAttendance />
          </TabsContent>
        </Tabs>
      );
    }

    // For other roles, show the management views
    switch (activeTab) {
      case 'enrollment':
        return <EnhancedExtracurricularEnrollment />;
      case 'activity-log':
        return <CoachActivityLog />;
      case 'attendance':
        return <CoachAttendance />;
      case 'master-data':
        return <ExtracurricularManager />;
      default:
        return <EnhancedExtracurricularEnrollment />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {hasRole('siswa') ? 'Ekstrakurikuler Saya' : 
             hasRole('koordinator_ekstrakurikuler') ? 'Manajemen Ekstrakurikuler' :
             hasRole('pelatih_ekstrakurikuler') ? 'Dashboard Pelatih' :
             'Manajemen Ekstrakurikuler'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {hasRole('siswa') 
              ? 'Daftar ekstrakurikuler dan pantau kegiatan Anda'
              : hasRole('koordinator_ekstrakurikuler')
              ? 'Kelola seluruh aspek ekstrakurikuler sekolah'
              : hasRole('pelatih_ekstrakurikuler')
              ? 'Kelola kegiatan dan progress siswa ekstrakurikuler Anda'
              : 'Kelola ekstrakurikuler, pendaftaran siswa, dan jurnal kegiatan pelatih'
            }
          </p>
        </div>

        <div className="space-y-4">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
};

export default ExtracurricularManagement;
