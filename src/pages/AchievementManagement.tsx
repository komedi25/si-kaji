
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AchievementInputForm } from '@/components/achievements/AchievementInputForm';
import { AchievementRecorder } from '@/components/achievements/AchievementRecorder';
import { AchievementReport } from '@/components/achievements/AchievementReport';
import { AchievementVerification } from '@/components/achievements/AchievementVerification';
import { StudentAchievementForm } from '@/components/achievements/StudentAchievementForm';
import { useAuth } from '@/hooks/useAuth';

const AchievementManagement = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('record');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const view = params.get('view');
    
    if (view === 'student') {
      setActiveTab('student');
    } else if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const renderContent = () => {
    switch (activeTab) {
      case 'student':
        return <StudentAchievementForm />;
      case 'verification':
        return <AchievementVerification />;
      case 'record':
        return <AchievementRecorder />;
      case 'report':
        return <AchievementReport />;
      default:
        if (user?.roles?.includes('siswa')) {
          return <StudentAchievementForm />;
        }
        return <AchievementRecorder />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default AchievementManagement;
