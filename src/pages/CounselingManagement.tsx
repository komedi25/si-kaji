
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CounselingManagement } from '@/components/counseling/CounselingManagement';

const CounselingManagementPage = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CounselingManagement />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default CounselingManagementPage;
