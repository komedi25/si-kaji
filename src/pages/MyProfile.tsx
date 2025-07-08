import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SimpleStudentProfile } from '@/components/student/SimpleStudentProfile';

const MyProfile = () => {
  return (
    <AppLayout>
      <DashboardLayout>
        <SimpleStudentProfile />
      </DashboardLayout>
    </AppLayout>
  );
};

export default MyProfile;