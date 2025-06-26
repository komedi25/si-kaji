
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

  // Redirect siswa ke student dashboard, lainnya ke dashboard utama
  if (user.roles.includes('siswa')) {
    return <Navigate to="/student-dashboard" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes - hanya satu route untuk login */}
      <Route path="/login" element={<AuthForm />} />
      
      {/* Logout handler */}
      <Route path="/logout" element={<Navigate to="/login" replace />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Dashboard redirect logic */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
        
        {/* Specific dashboards */}
        <Route path="/admin-dashboard" element={<Dashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/homeroom-dashboard" element={<HomeroomDashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* Management Routes */}
        <Route path="/attendance/*" element={<AttendanceManagement />} />
        <Route path="/violations/*" element={<ViolationManagement />} />
        <Route path="/achievements/*" element={<AchievementManagement />} />
        <Route path="/permits/*" element={<PermitManagement />} />
        <Route path="/cases/*" element={<CaseManagement />} />
        <Route path="/extracurricular/*" element={<ExtracurricularManagement />} />
        <Route path="/counseling/*" element={<CounselingManagement />} />
        <Route path="/homeroom/*" element={<HomeroomJournalManagement />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/user-management" element={<UserManagement />} />
        
        {/* Specific feature routes */}
        <Route path="/cases/reports" element={<StudentCaseReportsPage />} />
        
        {/* Default redirect for authenticated users */}
        <Route path="/" element={<DashboardRedirect />} />
      </Route>
      
      {/* 404 handler */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
