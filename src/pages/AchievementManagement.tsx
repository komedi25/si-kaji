
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AchievementRecorder } from '@/components/achievements/AchievementRecorder';
import { AchievementReport } from '@/components/achievements/AchievementReport';
import { AppLayout } from '@/components/layout/AppLayout';

const AchievementManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('record');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const renderContent = () => {
    switch (activeTab) {
      case 'record':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Catat Prestasi</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Input prestasi siswa dengan sistem poin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AchievementRecorder />
            </CardContent>
          </Card>
        );
      case 'report':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Laporan Prestasi</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Lihat dan analisis prestasi siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AchievementReport />
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Catat Prestasi</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Input prestasi siswa dengan sistem poin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AchievementRecorder />
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manajemen Prestasi</h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Catat prestasi siswa dan pantau perkembangan
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
};

export default AchievementManagement;
