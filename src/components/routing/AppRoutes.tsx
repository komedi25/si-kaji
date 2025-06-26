
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from '@/pages/Dashboard';
import AttendanceManagement from '@/pages/AttendanceManagement';
import ViolationManagement from '@/pages/ViolationManagement';
import AchievementManagement from '@/pages/AchievementManagement';
import PermitManagement from '@/pages/PermitManagement';
import CaseManagement from '@/pages/CaseManagement';
import ExtracurricularManagement from '@/pages/ExtracurricularManagement';
import CounselingManagement from '@/pages/CounselingManagement';
import HomeroomJournalManagement from '@/pages/HomeroomJournalManagement';
import Settings from '@/pages/Settings';
import UserManagement from '@/pages/UserManagement';
import StudentDashboard from '@/pages/StudentDashboard';
import HomeroomDashboard from '@/pages/HomeroomDashboard';
import StudentCaseReportsPage from '@/pages/StudentCaseReportsPage';
import ProfilePage from '@/pages/ProfilePage';
import ActivityProposal from '@/pages/ActivityProposal';
import DocumentManagement from '@/pages/DocumentManagement';
import MasterData from '@/pages/MasterData';
import SystemStatus from '@/pages/SystemStatus';
import StudentManagement from '@/pages/StudentManagement';
import ReportManagement from '@/pages/ReportManagement';
import AIManagement from '@/pages/AIManagement';
import NotificationManagement from '@/pages/NotificationManagement';
import AchievementVerification from '@/pages/AchievementVerification';
import DisciplinePointsManagement from '@/pages/DisciplinePointsManagement';
import ComingSoon from '@/pages/ComingSoon';
import { AuthForm } from '@/components/auth/AuthForm';
import NotFound from '@/pages/NotFound';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect berdasarkan role user
  if (user.roles.includes('siswa')) {
    return <Navigate to="/student-dashboard" replace />;
  } else if (user.roles.includes('wali_kelas')) {
    return <Navigate to="/homeroom-dashboard" replace />;
  } else {
    return <Navigate to="/admin-dashboard" replace />;
  }
};

// Logout handler component
const LogoutHandler = () => {
  const { signOut } = useAuth();

  React.useEffect(() => {
    const handleLogout = async () => {
      await signOut();
    };
    handleLogout();
  }, [signOut]);

  return <Navigate to="/login" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<AuthForm />} />
      
      {/* Logout handler - now properly handles logout */}
      <Route path="/logout" element={<LogoutHandler />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Dashboard redirect logic */}
        <Route path="/" element={<DashboardRedirect />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        
        {/* Specific dashboards */}
        <Route path="/admin-dashboard" element={<Dashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/homeroom-dashboard" element={<HomeroomDashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* Student Management */}
        <Route path="/student-management" element={<StudentManagement />} />
        
        {/* Attendance Routes */}
        <Route path="/attendance/*" element={<AttendanceManagement />} />
        <Route path="/attendance/record" element={<AttendanceManagement />} />
        <Route path="/attendance/self" element={<AttendanceManagement />} />
        <Route path="/attendance/recap" element={<AttendanceManagement />} />
        <Route path="/attendance/location" element={<ComingSoon />} />
        <Route path="/attendance/schedule" element={<ComingSoon />} />
        
        {/* Violations & Discipline */}
        <Route path="/violations/*" element={<ViolationManagement />} />
        <Route path="/discipline-points" element={<DisciplinePointsManagement />} />
        
        {/* Achievements */}
        <Route path="/achievements/*" element={<AchievementManagement />} />
        <Route path="/achievements/submit" element={<AchievementManagement />} />
        <Route path="/achievement-verification" element={<AchievementVerification />} />
        
        {/* Permits & Letters */}
        <Route path="/permits/*" element={<PermitManagement />} />
        
        {/* Cases & Reports */}
        <Route path="/cases/*" element={<CaseManagement />} />
        <Route path="/cases/reports" element={<StudentCaseReportsPage />} />
        
        {/* Extracurricular */}
        <Route path="/extracurricular/*" element={<ExtracurricularManagement />} />
        
        {/* Counseling */}
        <Route path="/counseling/*" element={<CounselingManagement />} />
        
        {/* Homeroom */}
        <Route path="/homeroom/*" element={<HomeroomJournalManagement />} />
        
        {/* Activity Proposals */}
        <Route path="/proposals/*" element={<ActivityProposal />} />
        
        {/* Documents */}
        <Route path="/documents/*" element={<DocumentManagement />} />
        <Route path="/document-management" element={<DocumentManagement />} />
        <Route path="/document-repository" element={<ComingSoon />} />
        
        {/* Reports & Analytics */}
        <Route path="/reports" element={<ReportManagement />} />
        <Route path="/advanced-analytics" element={<ComingSoon />} />
        <Route path="/export-data" element={<ComingSoon />} />
        <Route path="/import-data" element={<ComingSoon />} />
        
        {/* AI & Notifications */}
        <Route path="/ai-management" element={<AIManagement />} />
        <Route path="/notifications" element={<NotificationManagement />} />
        
        {/* Admin Tools */}
        <Route path="/master-data" element={<MasterData />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/global-search" element={<ComingSoon />} />
        <Route path="/audit-logs" element={<ComingSoon />} />
        <Route path="/backup-maintenance" element={<ComingSoon />} />
        <Route path="/system-config" element={<ComingSoon />} />
        <Route path="/template-manager" element={<ComingSoon />} />
        <Route path="/system-status" element={<SystemStatus />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      
      {/* 404 handler */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
