
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PermitInputForm } from '@/components/permits/PermitInputForm';
import { PermitApproval } from '@/components/permits/PermitApproval';
import { PermitForm } from '@/components/permits/PermitForm';
import { PermitReport } from '@/components/permits/PermitReport';
import { PermitLetter } from '@/components/permits/PermitLetter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PermitManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('input');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Manajemen Perizinan</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Kelola pengajuan izin siswa dengan workflow persetujuan otomatis
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="input">Input Izin</TabsTrigger>
            <TabsTrigger value="approval">Persetujuan</TabsTrigger>
            <TabsTrigger value="form">Form Izin</TabsTrigger>
            <TabsTrigger value="report">Laporan</TabsTrigger>
            <TabsTrigger value="letter">Surat Izin</TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-4">
            <PermitInputForm />
          </TabsContent>

          <TabsContent value="approval" className="space-y-4">
            <PermitApproval />
          </TabsContent>

          <TabsContent value="form" className="space-y-4">
            <PermitForm />
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            <PermitReport />
          </TabsContent>

          <TabsContent value="letter" className="space-y-4">
            <PermitLetter />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default PermitManagement;
