
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DocumentRepository } from '@/components/documents/DocumentRepository';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentVersionHistory } from '@/components/documents/DocumentVersionHistory';
import { PolicyManager } from '@/components/documents/PolicyManager';
import { DocumentCategories } from '@/components/documents/DocumentCategories';

const DocumentRepositoryManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('repository');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const renderContent = () => {
    switch (activeTab) {
      case 'repository':
        return <DocumentRepository />;
      case 'upload':
        return <DocumentUpload />;
      case 'policies':
        return <PolicyManager />;
      case 'categories':
        return <DocumentCategories />;
      case 'versions':
        return <DocumentVersionHistory />;
      default:
        return <DocumentRepository />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Repositori Dokumen & Kebijakan</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Kelola dokumen sekolah, kebijakan, dan panduan dengan sistem version control
          </p>
        </div>

        <div className="space-y-4">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
};

export default DocumentRepositoryManagement;
