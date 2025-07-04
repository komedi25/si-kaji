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

// Lazy load other pages
import { lazy, Suspense } from 'react';

const AttendanceRecording = lazy(() => import('@/pages/AttendanceRecording'));
const AttendanceReport = lazy(() => import('@/pages/AttendanceReport'));
const SelfAttendance = lazy(() => import('@/pages/SelfAttendance'));
const PermitManagement = lazy(() => import('@/pages/PermitManagement'));
const CounselingManagement = lazy(() => import('@/pages/CounselingManagement'));
const CaseManagement = lazy(() => import('@/pages/CaseManagement'));
const MasterData = lazy(() => import('@/pages/MasterData'));
const LetterRequests = lazy(() => import('@/pages/LetterRequests'));
const DocumentRepository = lazy(() => import('@/pages/DocumentRepository'));
const HomeroomJournal = lazy(() => import('@/pages/HomeroomJournal'));
const ExtracurricularManagement = lazy(() => import('@/pages/ExtracurricularManagement'));
const Settings = lazy(() => import('@/pages/Settings'));
const CoachDashboard = lazy(() => import('@/pages/CoachDashboard'));
const ParentDashboard = lazy(() => import('@/pages/ParentDashboard'));
const AIAssistant = lazy(() => import('@/pages/AIAssistant'));
const Analytics = lazy(() => import('@/pages/Analytics'));

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
      
      {/* Attendance routes */}      
      <Route path="/attendance" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><AttendanceRecording /></Suspense></ProtectedRoute>} />
      <Route path="/attendance/report" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><AttendanceReport /></Suspense></ProtectedRoute>} />
      <Route path="/attendance/self" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><SelfAttendance /></Suspense></ProtectedRoute>} />
      
      {/* Activity & Achievement routes */}
      <Route path="/activity-proposals" element={<ProtectedRoute><ActivityProposal /></ProtectedRoute>} />
      <Route path="/achievement-management" element={<ProtectedRoute><AchievementManagement /></ProtectedRoute>} />
      
      {/* Other management routes */}
      <Route path="/permits" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><PermitManagement /></Suspense></ProtectedRoute>} />
      <Route path="/counseling" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><CounselingManagement /></Suspense></ProtectedRoute>} />
      <Route path="/cases" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><CaseManagement /></Suspense></ProtectedRoute>} />
      <Route path="/master-data" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><MasterData /></Suspense></ProtectedRoute>} />
      <Route path="/letters" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><LetterRequests /></Suspense></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><DocumentRepository /></Suspense></ProtectedRoute>} />
      <Route path="/homeroom-journal" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><HomeroomJournal /></Suspense></ProtectedRoute>} />
      <Route path="/extracurricular" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ExtracurricularManagement /></Suspense></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><Settings /></Suspense></ProtectedRoute>} />
      <Route path="/coach" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><CoachDashboard /></Suspense></ProtectedRoute>} />
      <Route path="/parent" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ParentDashboard /></Suspense></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><AIAssistant /></Suspense></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><Analytics /></Suspense></ProtectedRoute>} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
