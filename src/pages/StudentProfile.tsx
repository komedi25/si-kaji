
import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SimpleStudentProfile } from '@/components/student/SimpleStudentProfile';

const StudentProfile = () => {
  return (
    <AppLayout>
      <SimpleStudentProfile />
    </AppLayout>
  );
};

export default StudentProfile;
