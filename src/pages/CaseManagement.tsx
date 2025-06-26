
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { CaseReportForm } from '@/components/cases/CaseReportForm';
import { CaseManagement as CaseManagementComponent } from '@/components/cases/CaseManagement';
import { StudentCaseReports } from '@/components/cases/StudentCaseReports';
import { useAuth } from '@/hooks/useAuth';

const CaseManagement = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('management');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    
    if (view === 'student') {
      setActiveView('student');
    } else if (view === 'report') {
      setActiveView('report');
    }
  }, [location.search]);

  const renderContent = () => {
    // Show student case reports for students
    if (user?.roles?.includes('siswa') && activeView === 'student') {
      return <StudentCaseReports />;
    }
    
    // Show public case report form
    if (activeView === 'report' || !user) {
      return <CaseReportForm />;
    }

    // Show case management for staff
    return <CaseManagementComponent />;
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default CaseManagement;
