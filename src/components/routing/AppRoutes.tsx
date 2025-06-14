
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
import CounselingManagement from '@/pages/CounselingManagement';

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
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/students" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'guru_bk']}>
          <StudentManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/violations" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'guru_bk', 'tppk']}>
          <ViolationManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/achievements" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'guru_bk']}>
          <AchievementManagement />
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
      
      <Route path="/attendance" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'arps']}>
          <AttendanceManagement />
        </ProtectedRoute>
      } />
      
      {/* Cases route - sekarang admin bisa akses */}
      <Route path="/cases" element={
        <ProtectedRoute requiredRoles={['admin', 'guru_bk', 'tppk', 'arps', 'p4gn']}>
          <CaseManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/permits" element={
        <ProtectedRoute>
          <PermitManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/counseling" element={
        <ProtectedRoute requiredRoles={['admin', 'guru_bk']}>
          <CounselingManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/extracurricular" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'pelatih_ekstrakurikuler']}>
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
      
      <Route path="/documents" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'guru_bk']}>
          <DocumentManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/document-repository" element={
        <ProtectedRoute>
          <DocumentRepositoryManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/notifications" element={
        <ProtectedRoute requiredRoles={['admin']}>
          <NotificationManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute requiredRoles={['admin']}>
          <UserManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/master-data" element={
        <ProtectedRoute requiredRoles={['admin']}>
          <MasterData />
        </ProtectedRoute>
      } />
      
      <Route path="/activity-proposal" element={
        <ProtectedRoute requiredRoles={['admin', 'wali_kelas', 'siswa']}>
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
