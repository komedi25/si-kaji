
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { QueryClient } from './hooks/useQueryClient';
import { Toaster } from '@/components/ui/sonner';

import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import StudentManagement from './pages/StudentManagement';
import AttendanceManagement from './pages/AttendanceManagement';
import ViolationManagement from './pages/ViolationManagement';
import AchievementManagement from './pages/AchievementManagement';
import DisciplinePointsManagement from './pages/DisciplinePointsManagement';
import PermitManagement from './pages/PermitManagement';
import CounselingManagement from './pages/CounselingManagement';
import CaseManagement from './pages/CaseManagement';
import ExtracurricularManagement from './pages/ExtracurricularManagement';
import ActivityProposal from './pages/ActivityProposal';
import DocumentManagement from './pages/DocumentManagement';
import ParentPortal from './pages/ParentPortal';
import UserManagement from './pages/UserManagement';
import MasterData from './pages/MasterData';
import Settings from './pages/Settings';
import ComingSoon from './pages/ComingSoon';
import NotFound from './pages/NotFound';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { NotificationProvider } from '@/hooks/useNotifications';

function App() {
  return (
    <QueryClient>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <div className="relative flex min-h-screen flex-col">
              <Toaster />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Index />} />
                
                <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/student-management" element={<StudentManagement />} />
                  <Route path="/attendance-management" element={<AttendanceManagement />} />
                  <Route path="/violation-management" element={<ViolationManagement />} />
                  <Route path="/achievement-management" element={<AchievementManagement />} />
                  <Route path="/discipline-points-management" element={<DisciplinePointsManagement />} />
                  <Route path="/permit-management" element={<PermitManagement />} />
                  <Route path="/counseling-management" element={<CounselingManagement />} />
                  <Route path="/case-management" element={<CaseManagement />} />
                  <Route path="/extracurricular-management" element={<ExtracurricularManagement />} />
                  <Route path="/activity-proposal" element={<ActivityProposal />} />
                  <Route path="/document-management" element={<DocumentManagement />} />
                  <Route path="/parent-portal" element={<ParentPortal />} />
                  <Route path="/user-management" element={<UserManagement />} />
                  <Route path="/master-data" element={<MasterData />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/notifications" element={<Settings />} />
                  <Route path="/settings/analytics" element={<Settings />} />
                  <Route path="/settings/search" element={<Settings />} />
                  <Route path="/settings/export" element={<Settings />} />
                  <Route path="/settings/preferences" element={<Settings />} />
                  <Route path="/coming-soon" element={<ComingSoon title="Coming Soon" description="This feature is under development" />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </QueryClient>
  );
}

export default App;
