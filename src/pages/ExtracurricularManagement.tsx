
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ExtracurricularEnrollment } from '@/components/extracurricular/ExtracurricularEnrollment';
import { StudentExtracurricularEnrollment } from '@/components/student/StudentExtracurricularEnrollment';
import { StudentExtracurricularActivity } from '@/components/student/StudentExtracurricularActivity';
import { CoachActivityLog } from '@/components/extracurricular/CoachActivityLog';
import { CoachAttendance } from '@/components/extracurricular/CoachAttendance';
import { ExtracurricularManager } from '@/components/masterData/ExtracurricularManager';
import { useAuth } from '@/hooks/useAuth';

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

    // For other roles, show the management views
    switch (activeTab) {
      case 'enrollment':
        return <ExtracurricularEnrollment />;
      case 'activity-log':
        return <CoachActivityLog />;
      case 'attendance':
        return <CoachAttendance />;
      case 'master-data':
        return <ExtracurricularManager />;
      default:
        return <ExtracurricularEnrollment />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {hasRole('siswa') ? 'Ekstrakurikuler Saya' : 'Manajemen Ekstrakurikuler'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {hasRole('siswa') 
              ? 'Daftar ekstrakurikuler dan pantau kegiatan Anda'
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
