
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ViolationRecorder } from '@/components/violations/ViolationRecorder';
import { ViolationReport } from '@/components/violations/ViolationReport';
import { AppLayout } from '@/components/layout/AppLayout';

const ViolationManagement = () => {
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
              <CardTitle className="text-xl md:text-2xl">Catat Pelanggaran</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Input pelanggaran siswa dengan sistem poin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ViolationRecorder />
            </CardContent>
          </Card>
        );
      case 'report':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Laporan Pelanggaran</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Lihat dan pantau catatan pelanggaran siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ViolationReport />
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Catat Pelanggaran</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Input pelanggaran siswa dengan sistem poin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ViolationRecorder />
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manajemen Pelanggaran</h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Catat pelanggaran siswa dan pantau poin disiplin
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
};

export default ViolationManagement;
