
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { ViolationRecorder } from '@/components/violations/ViolationRecorder';
import { ViolationReport } from '@/components/violations/ViolationReport';

const ViolationManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Pelanggaran</h1>
        <p className="text-gray-600 mt-2">
          Catat pelanggaran siswa dan pantau poin disiplin
        </p>
      </div>

      <Tabs defaultValue="record" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="record" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Input Pelanggaran
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Laporan Pelanggaran
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Catat Pelanggaran</CardTitle>
              <CardDescription>
                Input pelanggaran siswa dengan sistem poin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ViolationRecorder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Pelanggaran</CardTitle>
              <CardDescription>
                Lihat dan pantau catatan pelanggaran siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ViolationReport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ViolationManagement;
