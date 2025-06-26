
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect berdasarkan role user
        const roles = user.roles || [];
        if (roles.includes('siswa')) {
          navigate('/student-dashboard');
        } else if (roles.includes('wali_kelas')) {
          navigate('/homeroom-dashboard');
        } else {
          navigate('/admin-dashboard');
        }
      } else {
        navigate('/landing');
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  return null; // Will redirect
};

export default Index;
