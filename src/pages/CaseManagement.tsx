
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CaseManagement } from '@/components/cases/CaseManagement';

const CaseManagementPage = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CaseManagement />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default CaseManagementPage;
