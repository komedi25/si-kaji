
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PermitForm } from '@/components/permits/PermitForm';
import { PermitApproval } from '@/components/permits/PermitApproval';
import PermitReport from '@/components/permits/PermitReport';
import { AppLayout } from '@/components/layout/AppLayout';

const PermitManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('form');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const renderContent = () => {
    switch (activeTab) {
      case 'form':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Formulir Perizinan</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Buat perizinan baru untuk siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermitForm />
            </CardContent>
          </Card>
        );
      case 'approval':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Persetujuan Perizinan</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Tinjau dan setujui pengajuan perizinan siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermitApproval />
            </CardContent>
          </Card>
        );
      case 'report':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Laporan Perizinan</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Lihat laporan perizinan siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermitReport />
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Formulir Perizinan</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Buat perizinan baru untuk siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermitForm />
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manajemen Perizinan</h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Ajukan dan kelola perizinan dan dispensasi siswa
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
};

export default PermitManagement;
