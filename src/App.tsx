
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import StudentManagement from "./pages/StudentManagement";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import MasterData from "./pages/MasterData";
import AttendanceManagement from "./pages/AttendanceManagement";
import ViolationManagement from "./pages/ViolationManagement";
import AchievementManagement from "./pages/AchievementManagement";
import DisciplinePointsManagement from "./pages/DisciplinePointsManagement";
import PermitManagement from "./pages/PermitManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute requiredRoles={['admin_sistem']}>
                <AppLayout>
                  <UserManagement />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/siswa" element={
              <ProtectedRoute requiredRoles={['admin_kesiswaan', 'wali_kelas', 'guru_bk', 'waka_kesiswaan', 'kepala_sekolah']}>
                <AppLayout>
                  <StudentManagement />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/presensi" element={
              <ProtectedRoute requiredRoles={['admin_kesiswaan', 'wali_kelas', 'guru_bk', 'waka_kesiswaan']}>
                <AppLayout>
                  <AttendanceManagement />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/pelanggaran" element={
              <ProtectedRoute requiredRoles={['admin_kesiswaan', 'wali_kelas', 'guru_bk', 'waka_kesiswaan']}>
                <AppLayout>
                  <ViolationManagement />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/prestasi" element={
              <ProtectedRoute requiredRoles={['admin_kesiswaan', 'wali_kelas', 'waka_kesiswaan']}>
                <AppLayout>
                  <AchievementManagement />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/poin-disiplin" element={
              <ProtectedRoute requiredRoles={['admin_kesiswaan', 'wali_kelas', 'guru_bk', 'waka_kesiswaan', 'kepala_sekolah']}>
                <AppLayout>
                  <DisciplinePointsManagement />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/perizinan" element={
              <ProtectedRoute requiredRoles={['admin_kesiswaan', 'wali_kelas', 'guru_bk', 'waka_kesiswaan', 'kepala_sekolah', 'siswa']}>
                <AppLayout>
                  <PermitManagement />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/ekstrakurikuler" element={
              <ProtectedRoute requiredRoles={['koordinator_ekstrakurikuler', 'pelatih_ekstrakurikuler']}>
                <AppLayout>
                  <ComingSoon 
                    title="Ekstrakurikuler"
                    description="Modul manajemen ekstrakurikuler sedang dalam pengembangan"
                    features={[
                      "Manajemen kegiatan",
                      "Jurnal aktivitas",
                      "Presensi anggota",
                      "Laporan kegiatan"
                    ]}
                  />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/kasus" element={
              <ProtectedRoute requiredRoles={['guru_bk', 'tppk', 'arps', 'p4gn']}>
                <AppLayout>
                  <ComingSoon 
                    title="Kasus & BK"
                    description="Modul manajemen kasus dan bimbingan konseling sedang dalam pengembangan"
                    features={[
                      "Pencatatan kasus",
                      "Konseling siswa",
                      "Follow-up treatment",
                      "Laporan BK"
                    ]}
                  />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/laporan" element={
              <ProtectedRoute requiredRoles={['kepala_sekolah', 'waka_kesiswaan', 'admin_kesiswaan']}>
                <AppLayout>
                  <ComingSoon 
                    title="Laporan"
                    description="Modul sistem pelaporan sedang dalam pengembangan"
                    features={[
                      "Dashboard analytics",
                      "Export laporan",
                      "Grafik statistik",
                      "Approval workflow"
                    ]}
                  />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/master-data" element={
              <ProtectedRoute requiredRoles={['admin_sistem']}>
                <AppLayout>
                  <MasterData />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout>
                  <ComingSoon 
                    title="Pengaturan"
                    description="Halaman pengaturan sedang dalam pengembangan"
                    features={[
                      "Profil pengguna",
                      "Ubah password",
                      "Notifikasi",
                      "Preferensi sistem"
                    ]}
                  />
                </AppLayout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
