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
import SystemStatus from '@/pages/SystemStatus';
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
              
              <Route path="/student-management" element={
                <ProtectedRoute>
                  <StudentManagement />
                </ProtectedRoute>
              } />
              <Route path="/students" element={
                <ProtectedRoute>
                  <StudentManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/violation-management" element={
                <ProtectedRoute>
                  <ViolationManagement />
                </ProtectedRoute>
              } />
              <Route path="/violations" element={
                <ProtectedRoute>
                  <ViolationManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/achievement-management" element={
                <ProtectedRoute>
                  <AchievementManagement />
                </ProtectedRoute>
              } />
              <Route path="/achievements" element={
                <ProtectedRoute>
                  <AchievementManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/attendance-management" element={
                <ProtectedRoute>
                  <AttendanceManagement />
                </ProtectedRoute>
              } />
              <Route path="/attendance" element={
                <ProtectedRoute>
                  <AttendanceManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/case-management" element={
                <ProtectedRoute>
                  <CaseManagement />
                </ProtectedRoute>
              } />
              <Route path="/cases" element={
                <ProtectedRoute>
                  <CaseManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/counseling-management" element={
                <ProtectedRoute>
                  <CounselingManagement />
                </ProtectedRoute>
              } />
              <Route path="/counseling" element={
                <ProtectedRoute>
                  <CounselingManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/permit-management" element={
                <ProtectedRoute>
                  <PermitManagement />
                </ProtectedRoute>
              } />
              <Route path="/permits" element={
                <ProtectedRoute>
                  <PermitManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/document-management" element={
                <ProtectedRoute>
                  <DocumentManagement />
                </ProtectedRoute>
              } />
              <Route path="/documents" element={
                <ProtectedRoute>
                  <DocumentManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/document-repository-management" element={
                <ProtectedRoute>
                  <DocumentRepositoryManagement />
                </ProtectedRoute>
              } />
              <Route path="/document-repository" element={
                <ProtectedRoute>
                  <DocumentRepositoryManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/extracurricular-management" element={
                <ProtectedRoute>
                  <ExtracurricularManagement />
                </ProtectedRoute>
              } />
              <Route path="/extracurricular" element={
                <ProtectedRoute>
                  <ExtracurricularManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/homeroom-journal-management" element={
                <ProtectedRoute>
                  <HomeroomJournalManagement />
                </ProtectedRoute>
              } />
              <Route path="/homeroom-journal" element={
                <ProtectedRoute>
                  <HomeroomJournalManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/activity-proposal-management" element={
                <ProtectedRoute>
                  <ActivityProposal />
                </ProtectedRoute>
              } />
              <Route path="/activity-proposal" element={
                <ProtectedRoute>
                  <ActivityProposal />
                </ProtectedRoute>
              } />
              
              <Route path="/master-data-management" element={
                <ProtectedRoute>
                  <MasterData />
                </ProtectedRoute>
              } />
              <Route path="/master-data" element={
                <ProtectedRoute>
                  <MasterData />
                </ProtectedRoute>
              } />
              
              <Route path="/user-management" element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/notification-management" element={
                <ProtectedRoute>
                  <NotificationManagement />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <NotificationManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/ai-management" element={
                <ProtectedRoute>
                  <AIManagement />
                </ProtectedRoute>
              } />
              <Route path="/ai" element={
                <ProtectedRoute>
                  <AIManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/parent-portal-management" element={
                <ProtectedRoute>
                  <ParentPortal />
                </ProtectedRoute>
              } />
              <Route path="/parent-portal" element={
                <ProtectedRoute>
                  <ParentPortal />
                </ProtectedRoute>
              } />
              
              <Route path="/discipline-points-management" element={
                <ProtectedRoute>
                  <DisciplinePointsManagement />
                </ProtectedRoute>
              } />
              <Route path="/discipline-points" element={
                <ProtectedRoute>
                  <DisciplinePointsManagement />
                </ProtectedRoute>
              } />
              
              {/* System Status Route */}
              <Route path="/system-status" element={
                <ProtectedRoute>
                  <SystemStatus />
                </ProtectedRoute>
              } />
              
              {/* Settings Routes */}
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/settings/notifications" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/settings/analytics" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/settings/search" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/settings/export" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/settings/preferences" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/settings/ai-keys" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/settings/ai-config" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
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
