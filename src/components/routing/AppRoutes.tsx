import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AttendanceManagement from '@/pages/AttendanceManagement';
import ViolationManagement from '@/pages/ViolationManagement';
import AchievementManagement from '@/pages/AchievementManagement';
import PermitManagement from '@/pages/PermitManagement';
import CaseManagement from '@/pages/CaseManagement';
import ExtracurricularManagement from '@/pages/ExtracurricularManagement';
import CounselingManagement from '@/pages/CounselingManagement';
import HomeroomJournalManagement from '@/pages/HomeroomJournalManagement';
import StudentDataManager from '@/pages/StudentDataManager';
import Settings from '@/pages/Settings';
import AcademicCalendar from '@/pages/AcademicCalendar';
import LocationManagement from '@/pages/LocationManagement';
import ScheduleManagement from '@/pages/ScheduleManagement';
import AchievementTypeManagement from '@/pages/AchievementTypeManagement';
import ViolationTypeManagement from '@/pages/ViolationTypeManagement';
import UserManagement from '@/pages/UserManagement';
import StudentDashboard from '@/pages/StudentDashboard';
import HomeroomDashboard from '@/pages/HomeroomDashboard';
import StudentCaseReportsPage from '@/pages/StudentCaseReportsPage';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator
  }

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

import { Outlet } from 'react-router-dom';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/homeroom-dashboard" element={<HomeroomDashboard />} />
        
        {/* Protected Routes */}
        <Route path="/attendance/*" element={<AttendanceManagement />} />
        <Route path="/violations/*" element={<ViolationManagement />} />
        <Route path="/achievements/*" element={<AchievementManagement />} />
        <Route path="/permits/*" element={<PermitManagement />} />
        <Route path="/cases/*" element={<CaseManagement />} />
        <Route path="/extracurricular/*" element={<ExtracurricularManagement />} />
        <Route path="/counseling/*" element={<CounselingManagement />} />
        <Route path="/homeroom/*" element={<HomeroomJournalManagement />} />
        <Route path="/student-data" element={<StudentDataManager />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/academic-calendar" element={<AcademicCalendar />} />
        <Route path="/location-management" element={<LocationManagement />} />
        <Route path="/schedule-management" element={<ScheduleManagement />} />
        <Route path="/achievement-types" element={<AchievementTypeManagement />} />
        <Route path="/violation-types" element={<ViolationTypeManagement />} />
        <Route path="/user-management" element={<UserManagement />} />
        
        <Route path="/cases/reports" element={<StudentCaseReportsPage />} />
        
        <Route path="*" element={<div>Page not found</div>} />
      </Route>
    </Routes>
  );
};
