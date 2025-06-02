
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ParentDashboard } from '@/components/parent/ParentDashboard';

const ParentPortal = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ParentDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default ParentPortal;
