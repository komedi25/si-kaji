import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileX, 
  ListChecks,
  FileText
} from 'lucide-react';
import { PermitForm } from '@/components/permits/PermitForm';
import { PermitApproval } from '@/components/permits/PermitApproval';
import PermitReport from '@/components/permits/PermitReport';

const PermitManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Perizinan</h1>
        <p className="text-gray-600 mt-2">
          Ajukan dan kelola perizinan dan dispensasi siswa
        </p>
      </div>

      <Tabs defaultValue="form" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <FileX className="h-4 w-4" />
            Buat Izin
          </TabsTrigger>
          <TabsTrigger value="approval" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Persetujuan
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Laporan Izin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Formulir Perizinan</CardTitle>
              <CardDescription>
                Buat perizinan baru untuk siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermitForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Persetujuan Perizinan</CardTitle>
              <CardDescription>
                Tinjau dan setujui pengajuan perizinan siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermitApproval />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Perizinan</CardTitle>
              <CardDescription>
                Lihat laporan perizinan siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermitReport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PermitManagement;
