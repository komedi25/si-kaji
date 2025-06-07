
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomeroomJournalForm } from '@/components/homeroom/HomeroomJournalForm';
import { HomeroomJournalList } from '@/components/homeroom/HomeroomJournalList';
import { StudentProgressTracking } from '@/components/homeroom/StudentProgressTracking';
import { ParentCommunicationLog } from '@/components/homeroom/ParentCommunicationLog';
import { ClassAnalytics } from '@/components/homeroom/ClassAnalytics';

const HomeroomJournalManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const renderContent = () => {
    switch (activeTab) {
      case 'create':
        return <HomeroomJournalForm />;
      case 'list':
        return <HomeroomJournalList />;
      case 'progress':
        return <StudentProgressTracking />;
      case 'communication':
        return <ParentCommunicationLog />;
      case 'analytics':
        return <ClassAnalytics />;
      default:
        return <HomeroomJournalForm />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Sistem Jurnal Perwalian</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Kelola jurnal digital wali kelas dan pantau perkembangan siswa secara komprehensif
          </p>
        </div>

        <div className="space-y-4">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
};

export default HomeroomJournalManagement;
