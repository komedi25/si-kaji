
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Import pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import StudentManagement from '@/pages/StudentManagement';
import UserManagement from '@/pages/UserManagement';
import ActivityProposal from '@/pages/ActivityProposal';
import AchievementManagement from '@/pages/AchievementManagement';

// Student specific pages
import StudentProfile from '@/pages/StudentProfile';
import StudentAchievements from '@/pages/StudentAchievements';
import StudentProposals from '@/pages/StudentProposals';

// Lazy load other pages that exist
import { lazy, Suspense } from 'react';

const PermitManagement = lazy(() => import('@/pages/PermitManagement'));
const CounselingManagement = lazy(() => import('@/pages/CounselingManagement'));
const CaseManagement = lazy(() => import('@/pages/CaseManagement'));
const MasterData = lazy(() => import('@/pages/MasterData'));
const ExtracurricularManagement = lazy(() => import('@/pages/ExtracurricularManagement'));
const Settings = lazy(() => import('@/pages/Settings'));

// Create placeholder for missing pages
const ComingSoon = lazy(() => import('@/pages/ComingSoon'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

export const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
      />
      
      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      {/* Student Management - redirects to User Management */}
      <Route path="/students" element={<ProtectedRoute><StudentManagement /></ProtectedRoute>} />
      <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      
      {/* Student specific routes */}
      <Route path="/profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
      <Route path="/achievements" element={<ProtectedRoute><StudentAchievements /></ProtectedRoute>} />
      <Route path="/proposals" element={<ProtectedRoute><StudentProposals /></ProtectedRoute>} />
      
      {/* Attendance routes - using ComingSoon placeholder */}      
      <Route path="/attendance" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ComingSoon title="Sistem Presensi" description="Fitur pencatatan dan monitoring kehadiran siswa" features={["Presensi manual", "QR Code scanning", "Geofencing", "Laporan kehadiran"]} /></Suspense></ProtectedRoute>} />
      <Route path="/attendance/report" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ComingSoon title="Laporan Presensi" description="Laporan dan analisis data kehadiran siswa" features={["Laporan harian", "Statistik bulanan", "Export data", "Grafik kehadiran"]} /></Suspense></ProtectedRoute>} />
      <Route path="/attendance/self" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ComingSoon title="Presensi Mandiri" description="Sistem presensi mandiri untuk siswa" features={["Self check-in", "Lokasi otomatis", "Notifikasi reminder", "Riwayat presensi"]} /></Suspense></ProtectedRoute>} />
      
      {/* Activity & Achievement routes */}
      <Route path="/activity-proposals" element={<ProtectedRoute><ActivityProposal /></ProtectedRoute>} />
      <Route path="/achievement-management" element={<ProtectedRoute><AchievementManagement /></ProtectedRoute>} />
      
      {/* Other management routes */}
      <Route path="/permits" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><PermitManagement /></Suspense></ProtectedRoute>} />
      <Route path="/counseling" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><CounselingManagement /></Suspense></ProtectedRoute>} />
      <Route path="/cases" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><CaseManagement /></Suspense></ProtectedRoute>} />
      <Route path="/master-data" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><MasterData /></Suspense></ProtectedRoute>} />
      <Route path="/letters" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ComingSoon title="Sistem Surat" description="Permohonan dan penerbitan surat keterangan" features={["Surat aktif kuliah", "Surat keterangan siswa", "Template otomatis", "Tracking status"]} /></Suspense></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ComingSoon title="Repositori Dokumen" description="Penyimpanan dan pengelolaan dokumen sekolah" features={["Upload dokumen", "Kategorisasi", "Version control", "Search dokumen"]} /></Suspense></ProtectedRoute>} />
      <Route path="/homeroom-journal" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ComingSoon title="Jurnal Perwalian" description="Jurnal digital untuk wali kelas" features={["Catatan harian", "Progress siswa", "Komunikasi ortu", "Laporan perwalian"]} /></Suspense></ProtectedRoute>} />
      <Route path="/extracurricular" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ExtracurricularManagement /></Suspense></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><Settings /></Suspense></ProtectedRoute>} />
      <Route path="/coach" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ComingSoon title="Dashboard Pelatih" description="Portal khusus untuk pelatih ekstrakurikuler" features={["Jurnal latihan", "Presensi pelatih", "Progress siswa", "Laporan kegiatan"]} /></Suspense></ProtectedRoute>} />
      <Route path="/parent" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ComingSoon title="Portal Orang Tua" description="Akses informasi untuk orang tua siswa" features={["Monitoring anak", "Notifikasi sekolah", "Komunikasi guru", "Laporan progress"]} /></Suspense></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ComingSoon title="AI Assistant" description="Asisten AI untuk analisis dan rekomendasi" features={["Analisis perilaku", "Prediksi risiko", "Rekomendasi intervensi", "Chat assistant"]} /></Suspense></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ComingSoon title="Analytics Dashboard" description="Dashboard analitik dan laporan komprehensif" features={["Data visualization", "Trend analysis", "Performance metrics", "Custom reports"]} /></Suspense></ProtectedRoute>} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
