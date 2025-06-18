
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { StudentDataManager } from '@/components/student/StudentDataManager';
import { StudentProfile } from '@/components/student/StudentProfile';
import { useAuth } from '@/hooks/useAuth';

const StudentManagement = () => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const renderContent = () => {
    // If user is a student, only show their profile
    if (hasRole('siswa')) {
      return <StudentProfile />;
    }

    // For admins and teachers, show the full student management
    switch (activeTab) {
      case 'profile':
        return <StudentProfile />;
      default:
        return <StudentDataManager />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {hasRole('siswa') ? 'Data Pribadi' : 'Manajemen Data Siswa'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {hasRole('siswa') 
              ? 'Lihat dan kelola data pribadi Anda'
              : 'Kelola data induk siswa, profil, dan informasi akademik'
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

export default StudentManagement;
