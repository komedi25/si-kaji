
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardHome } from '@/components/dashboard/DashboardHome';

const Dashboard = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DashboardHome />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Dashboard;
