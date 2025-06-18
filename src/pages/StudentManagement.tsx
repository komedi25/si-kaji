
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const StudentManagement = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  useEffect(() => {
    // Redirect to user management since student management is now integrated there
    if (hasRole('admin')) {
      navigate('/user-management?tab=students');
    } else if (hasRole('siswa')) {
      navigate('/student-profile');
    } else {
      navigate('/');
    }
  }, [navigate, hasRole]);

  return (
    <div className="flex items-center justify-center h-64">
      <p>Mengalihkan ke halaman manajemen pengguna...</p>
    </div>
  );
};

export default StudentManagement;
