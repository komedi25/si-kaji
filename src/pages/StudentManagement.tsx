
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const StudentManagement = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  useEffect(() => {
    // Redirect semua akses data siswa ke manajemen pengguna terpadu
    if (hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk')) {
      navigate('/user-management?tab=students');
    } else if (hasRole('siswa')) {
      navigate('/user-management?tab=students&filter=my-profile');
    } else {
      navigate('/dashboard');
    }
  }, [navigate, hasRole]);

  return (
    <div className="flex items-center justify-center h-64">
      <p>Mengalihkan ke halaman manajemen pengguna terpadu...</p>
    </div>
  );
};

export default StudentManagement;
