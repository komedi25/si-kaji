
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardHome } from '@/components/dashboard/DashboardHome';

const Dashboard = () => {
  return (
    <AppLayout>
      <DashboardLayout>
        <DashboardHome />
      </DashboardLayout>
    </AppLayout>
  );
};

export default Dashboard;
