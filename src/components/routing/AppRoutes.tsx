
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

// Pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import StudentManagement from '@/pages/StudentManagement';
import ViolationManagement from '@/pages/ViolationManagement';
import AchievementManagement from '@/pages/AchievementManagement';
import DisciplinePointsManagement from '@/pages/DisciplinePointsManagement';
import AttendanceManagement from '@/pages/AttendanceManagement';
import CaseManagement from '@/pages/CaseManagement';
import DocumentManagement from '@/pages/DocumentManagement';
import EnhancedDocumentManagement from '@/pages/EnhancedDocumentManagement';
import DocumentRepositoryManagement from '@/pages/DocumentRepositoryManagement';
import NotificationManagement from '@/pages/NotificationManagement';
import UserManagement from '@/pages/UserManagement';
import SystemStatus from '@/pages/SystemStatus';
import Settings from '@/pages/Settings';
import MasterData from '@/pages/MasterData';
import ActivityProposal from '@/pages/ActivityProposal';
import AchievementVerification from '@/pages/AchievementVerification';
import ComingSoon from '@/pages/ComingSoon';
import NotFound from '@/pages/NotFound';
import ExtracurricularManagement from '@/pages/ExtracurricularManagement';
import HomeroomJournalManagement from '@/pages/HomeroomJournalManagement';
import ParentPortal from '@/pages/ParentPortal';
import AIManagement from '@/pages/AIManagement';
import PermitManagement from '@/pages/PermitManagement';
import PermitVerificationPage from '@/pages/PermitVerification';
import CounselingManagement from '@/pages/CounselingManagement';

// New Student-specific components
import { StudentAchievementForm } from '@/components/achievements/StudentAchievementForm';
import { StudentCaseReports } from '@/components/cases/StudentCaseReports';
import { TPPKQRAttendance } from '@/components/attendance/TPPKQRAttendance';
import MyProfile from '@/pages/MyProfile';

export function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Index />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthForm />} />
      
      {/* Public case reporting - accessible without login */}
      <Route path="/cases" element={<CaseManagement />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* User Management - unified for all user types */}
      <Route path="/user-management" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'guru_bk', 'siswa']}>
          <UserManagement />
        </ProtectedRoute>
      } />
      
      {/* Legacy student route - redirect to user management */}
      <Route path="/students" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'guru_bk', 'siswa']}>
          <StudentManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/violations" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'guru_bk', 'tppk']}>
          <ViolationManagement />
        </ProtectedRoute>
      } />
      
      {/* Enhanced achievements route with student view */}
      <Route path="/achievements" element={
        <ProtectedRoute>
          {/* Conditional rendering based on user role and view parameter */}
          {user?.roles?.includes('siswa') && new URLSearchParams(location.search).get('view') === 'student' ? (
            <StudentAchievementForm />
          ) : (
            <AchievementManagement />
          )}
        </ProtectedRoute>
      } />
      
      <Route path="/achievement-verification" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas']}>
          <AchievementVerification />
        </ProtectedRoute>
      } />
      
      <Route path="/discipline-points" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'guru_bk', 'tppk']}>
          <DisciplinePointsManagement />
        </ProtectedRoute>
      } />
      
      {/* Attendance routes - updated to handle all attendance sub-routes */}
      <Route path="/attendance" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'guru_bk', 'tppk', 'siswa']}>
          <AttendanceManagement />
        </ProtectedRoute>
      } />
      <Route path="/attendance-qr" element={
        <ProtectedRoute requiredRoles={['tppk']}>
          <div className="space-y-6">
            <TPPKQRAttendance />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/attendance/self" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'guru_bk', 'tppk', 'siswa']}>
          <AttendanceManagement />
        </ProtectedRoute>
      } />
      <Route path="/attendance/record" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'guru_bk', 'tppk']}>
          <AttendanceManagement />
        </ProtectedRoute>
      } />
      <Route path="/attendance/report" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'guru_bk', 'tppk']}>
          <AttendanceManagement />
        </ProtectedRoute>
      } />
      <Route path="/attendance/location" element={
        <ProtectedRoute requiredRoles={['admin']}>
          <AttendanceManagement />
        </ProtectedRoute>
      } />
      <Route path="/attendance/schedule" element={
        <ProtectedRoute requiredRoles={['admin']}>
          <AttendanceManagement />
        </ProtectedRoute>
      } />
      <Route path="/attendance/polygon" element={
        <ProtectedRoute requiredRoles={['admin']}>
          <AttendanceManagement />
        </ProtectedRoute>
      } />
      <Route path="/attendance/auto-detector" element={
        <ProtectedRoute requiredRoles={['admin', 'tppk']}>
          <AttendanceManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/permits" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'siswa']}>
          <PermitManagement />
        </ProtectedRoute>
      } />
      
      {/* Public permit verification */}
      <Route path="/verify-permit" element={<PermitVerificationPage />} />
      <Route path="/verify-permit/:permitId" element={<PermitVerificationPage />} />
      
      <Route path="/counseling" element={
        <ProtectedRoute requiredRoles={['admin', 'guru_bk', 'siswa']}>
          <CounselingManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/extracurricular" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'pelatih_ekstrakurikuler', 'koordinator_ekstrakurikuler', 'siswa']}>
          <ExtracurricularManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/homeroom-journal" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas']}>
          <HomeroomJournalManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/parent-portal" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'orang_tua']}>
          <ParentPortal />
        </ProtectedRoute>
      } />
      
      <Route path="/ai-management" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'guru_bk']}>
          <AIManagement />
        </ProtectedRoute>
      } />
      
        <Route path="/document-management" element={
          <ProtectedRoute requiredRoles={['admin', 'siswa', 'wali_kelas', 'waka_kesiswaan']}>
            <DocumentManagement />
          </ProtectedRoute>
        } />
        <Route path="/letter-request" element={
          <ProtectedRoute requiredRoles={['siswa', 'admin', 'wali_kelas', 'waka_kesiswaan']}>
            <DocumentManagement />
          </ProtectedRoute>
        } />
        <Route path="/my-profile" element={
          <ProtectedRoute requiredRoles={['siswa']}>
            <MyProfile />
          </ProtectedRoute>
        } />
        <Route path="/enhanced-document-management" element={
          <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'waka_kesiswaan']}>
            <EnhancedDocumentManagement />
          </ProtectedRoute>
        } />
        <Route path="/document-repository" element={
          <ProtectedRoute requiredRoles={['admin', 'siswa']}>
            <DocumentRepositoryManagement />
          </ProtectedRoute>
        } />
      
      <Route path="/notifications" element={
        <ProtectedRoute requiredRoles={['admin']}>
          <NotificationManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/master-data" element={
        <ProtectedRoute requiredRoles={['admin']}>
          <MasterData />
        </ProtectedRoute>
      } />
      
      <Route path="/activity-proposal" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'siswa', 'koordinator_ekstrakurikuler']}>
          <ActivityProposal />
        </ProtectedRoute>
      } />
      
      <Route path="/system-status" element={
        <ProtectedRoute requiredRoles={['admin']}>
          <SystemStatus />
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
