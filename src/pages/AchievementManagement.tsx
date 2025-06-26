
import React from 'react';
import { useLocation } from 'react-router-dom';
import { AchievementRecorder } from '@/components/achievements/AchievementRecorder';
import { AchievementReport } from '@/components/achievements/AchievementReport';
import { AchievementVerification } from '@/components/achievements/AchievementVerification';
import { StudentAchievementForm } from '@/components/student/StudentAchievementForm';
import { useAuth } from '@/hooks/useAuth';
import { useStudentData } from '@/hooks/useStudentData';
import { AppLayout } from '@/components/layout/AppLayout';

const AchievementManagement = () => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const { studentData } = useStudentData();
  
  // Determine the current tab from the path
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/achievements/submit') return 'submit';
    if (path === '/achievements/record') return 'record';
    if (path === '/achievements/report') return 'report';
    if (path === '/achievements/verification') return 'verification';
    return 'submit'; // default
  };

  const tab = getCurrentTab();

  const renderContent = () => {
    switch (tab) {
      case 'submit':
        if (hasRole('siswa') && studentData) {
          return (
            <div className="max-w-2xl mx-auto">
              <StudentAchievementForm 
                studentId={studentData.id}
                onClose={() => window.history.back()}
                onSuccess={() => {
                  // Refresh atau redirect setelah berhasil
                  window.location.reload();
                }}
              />
            </div>
          );
        }
        break;
      case 'record':
        if (hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk')) {
          return <AchievementRecorder />;
        }
        break;
      case 'report':
        if (hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk')) {
          return <AchievementReport />;
        }
        break;
      case 'verification':
        if (hasRole('admin') || hasRole('wali_kelas')) {
          return <AchievementVerification />;
        }
        break;
      default:
        if (hasRole('siswa') && studentData) {
          return (
            <div className="max-w-2xl mx-auto">
              <StudentAchievementForm 
                studentId={studentData.id}
                onClose={() => window.history.back()}
                onSuccess={() => {
                  window.location.reload();
                }}
              />
            </div>
          );
        }
    }

    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          {hasRole('siswa') && !studentData 
            ? 'Data siswa tidak ditemukan. Silakan hubungi admin.'
            : 'Anda tidak memiliki akses ke halaman ini'
          }
        </div>
      </div>
    );
  };

  const getPageTitle = () => {
    switch (tab) {
      case 'submit':
        return 'Tambah Prestasi';
      case 'record':
        return 'Input Prestasi';
      case 'report':
        return 'Laporan Prestasi';
      case 'verification':
        return 'Verifikasi Prestasi';
      default:
        return 'Manajemen Prestasi';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
        </div>

        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default AchievementManagement;
