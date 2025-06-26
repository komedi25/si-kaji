
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

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator
  }

  if (!user) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<div>Login Page</div>} />
      <Route path="/register" element={<div>Register Page</div>} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/homeroom-dashboard" element={<HomeroomDashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* Protected Routes */}
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
        
        <Route path="/cases/reports" element={<StudentCaseReportsPage />} />
        
        <Route path="*" element={<div>Page not found</div>} />
      </Route>
    </Routes>
  );
};
