
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/useAuth';
import { NotificationProvider } from '@/hooks/useNotifications';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import StudentManagement from '@/pages/StudentManagement';
import ViolationManagement from '@/pages/ViolationManagement';
import AchievementManagement from '@/pages/AchievementManagement';
import AttendanceManagement from '@/pages/AttendanceManagement';
import CaseManagement from '@/pages/CaseManagement';
import CounselingManagement from '@/pages/CounselingManagement';
import PermitManagement from '@/pages/PermitManagement';
import DocumentManagement from '@/pages/DocumentManagement';
import DocumentRepositoryManagement from '@/pages/DocumentRepositoryManagement';
import ExtracurricularManagement from '@/pages/ExtracurricularManagement';
import HomeroomJournalManagement from '@/pages/HomeroomJournalManagement';
import ActivityProposal from '@/pages/ActivityProposal';
import MasterData from '@/pages/MasterData';
import UserManagement from '@/pages/UserManagement';
import NotificationManagement from '@/pages/NotificationManagement';
import AIManagement from '@/pages/AIManagement';
import ParentPortal from '@/pages/ParentPortal';
import DisciplinePointsManagement from '@/pages/DisciplinePointsManagement';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              {/* Student Management */}
              <Route path="/student-management" element={
                <ProtectedRoute>
                  <StudentManagement />
                </ProtectedRoute>
              } />
              
              {/* Academic & Discipline Routes */}
              <Route path="/attendance-management" element={
                <ProtectedRoute>
                  <AttendanceManagement />
                </ProtectedRoute>
              } />
              <Route path="/violation-management" element={
                <ProtectedRoute>
                  <ViolationManagement />
                </ProtectedRoute>
              } />
              <Route path="/achievement-management" element={
                <ProtectedRoute>
                  <AchievementManagement />
                </ProtectedRoute>
              } />
              <Route path="/discipline-points-management" element={
                <ProtectedRoute>
                  <DisciplinePointsManagement />
                </ProtectedRoute>
              } />
              
              {/* Homeroom & Counseling Routes */}
              <Route path="/homeroom-journal-management" element={
                <ProtectedRoute>
                  <HomeroomJournalManagement />
                </ProtectedRoute>
              } />
              <Route path="/counseling-management" element={
                <ProtectedRoute>
                  <CounselingManagement />
                </ProtectedRoute>
              } />
              <Route path="/case-management" element={
                <ProtectedRoute>
                  <CaseManagement />
                </ProtectedRoute>
              } />
              
              {/* Extracurricular & Activities */}
              <Route path="/extracurricular-management" element={
                <ProtectedRoute>
                  <ExtracurricularManagement />
                </ProtectedRoute>
              } />
              <Route path="/activity-proposal-management" element={
                <ProtectedRoute>
                  <ActivityProposal />
                </ProtectedRoute>
              } />
              
              {/* Administration Routes */}
              <Route path="/permit-management" element={
                <ProtectedRoute>
                  <PermitManagement />
                </ProtectedRoute>
              } />
              <Route path="/document-management" element={
                <ProtectedRoute>
                  <DocumentManagement />
                </ProtectedRoute>
              } />
              <Route path="/document-repository-management" element={
                <ProtectedRoute>
                  <DocumentRepositoryManagement />
                </ProtectedRoute>
              } />
              
              {/* Parent Portal */}
              <Route path="/parent-portal-management" element={
                <ProtectedRoute>
                  <ParentPortal />
                </ProtectedRoute>
              } />
              
              {/* AI Management */}
              <Route path="/ai-management" element={
                <ProtectedRoute>
                  <AIManagement />
                </ProtectedRoute>
              } />
              
              {/* System Settings */}
              <Route path="/user-management" element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/master-data-management" element={
                <ProtectedRoute>
                  <MasterData />
                </ProtectedRoute>
              } />
              <Route path="/notification-management" element={
                <ProtectedRoute>
                  <NotificationManagement />
                </ProtectedRoute>
              } />
              
              {/* Settings Routes */}
              <Route path="/settings/*" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
              {/* Legacy redirects for backward compatibility */}
              <Route path="/students" element={<Navigate to="/student-management" replace />} />
              <Route path="/violations" element={<Navigate to="/violation-management" replace />} />
              <Route path="/achievements" element={<Navigate to="/achievement-management" replace />} />
              <Route path="/attendance" element={<Navigate to="/attendance-management" replace />} />
              <Route path="/cases" element={<Navigate to="/case-management" replace />} />
              <Route path="/counseling" element={<Navigate to="/counseling-management" replace />} />
              <Route path="/permits" element={<Navigate to="/permit-management" replace />} />
              <Route path="/documents" element={<Navigate to="/document-management" replace />} />
              <Route path="/document-repository" element={<Navigate to="/document-repository-management" replace />} />
              <Route path="/extracurricular" element={<Navigate to="/extracurricular-management" replace />} />
              <Route path="/homeroom-journal" element={<Navigate to="/homeroom-journal-management" replace />} />
              <Route path="/activity-proposal" element={<Navigate to="/activity-proposal-management" replace />} />
              <Route path="/master-data" element={<Navigate to="/master-data-management" replace />} />
              <Route path="/users" element={<Navigate to="/user-management" replace />} />
              <Route path="/notifications" element={<Navigate to="/notification-management" replace />} />
              <Route path="/ai" element={<Navigate to="/ai-management" replace />} />
              <Route path="/parent-portal" element={<Navigate to="/parent-portal-management" replace />} />
              <Route path="/discipline-points" element={<Navigate to="/discipline-points-management" replace />} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
