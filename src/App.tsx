
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import StudentManagement from "./pages/StudentManagement";
import AttendanceManagement from "./pages/AttendanceManagement";
import EnhancedAttendanceManagement from "./pages/EnhancedAttendanceManagement";
import ViolationManagement from "./pages/ViolationManagement";
import PermitManagement from "./pages/PermitManagement";
import CaseManagement from "./pages/CaseManagement";
import CounselingManagement from "./pages/CounselingManagement";
import ExtracurricularManagement from "./pages/ExtracurricularManagement";
import ActivityProposal from "./pages/ActivityProposal";
import HomeroomJournalManagement from "./pages/HomeroomJournalManagement";
import ParentPortal from "./pages/ParentPortal";
import EnhancedParentPortal from "./pages/EnhancedParentPortal";
import DocumentManagement from "./pages/DocumentManagement";
import NotificationManagement from "./pages/NotificationManagement";
import UserManagement from "./pages/UserManagement";
import MasterData from "./pages/MasterData";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import AIManagement from "./pages/AIManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentManagement />} />
            <Route path="/attendance/*" element={<EnhancedAttendanceManagement />} />
            <Route path="/violations" element={<ViolationManagement />} />
            <Route path="/permits" element={<PermitManagement />} />
            <Route path="/cases" element={<CaseManagement />} />
            <Route path="/counseling" element={<CounselingManagement />} />
            <Route path="/extracurricular" element={<ExtracurricularManagement />} />
            <Route path="/proposals" element={<ActivityProposal />} />
            <Route path="/homeroom-journal" element={<HomeroomJournalManagement />} />
            <Route path="/parent-portal" element={<EnhancedParentPortal />} />
            <Route path="/documents" element={<DocumentManagement />} />
            <Route path="/notifications" element={<NotificationManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/master-data" element={<MasterData />} />
            <Route path="/analytics" element={<AdvancedAnalytics />} />
            <Route path="/ai" element={<AIManagement />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
