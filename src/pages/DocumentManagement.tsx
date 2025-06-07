
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LetterRequestForm } from '@/components/letters/LetterRequestForm';
import { StudentMutation } from '@/components/documents/StudentMutation';
import { LetterTemplates } from '@/components/documents/LetterTemplates';

const DocumentManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('letters');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const renderContent = () => {
    switch (activeTab) {
      case 'letters':
        return <LetterRequestForm />;
      case 'mutations':
        return <StudentMutation />;
      case 'templates':
        return <LetterTemplates />;
      default:
        return <LetterRequestForm />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Sistem Permohonan Surat & Mutasi</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Kelola permohonan surat keterangan dan proses mutasi siswa
          </p>
        </div>

        <div className="space-y-4">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
};

export default DocumentManagement;
