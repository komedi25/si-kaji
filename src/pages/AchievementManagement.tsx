
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Award,
  FileText
} from 'lucide-react';
import { AchievementRecorder } from '@/components/achievements/AchievementRecorder';
import { AchievementReport } from '@/components/achievements/AchievementReport';

const AchievementManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Prestasi</h1>
        <p className="text-gray-600 mt-2">
          Catat prestasi siswa dan pantau perkembangan
        </p>
      </div>

      <Tabs defaultValue="record" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="record" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Input Prestasi
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Laporan Prestasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Catat Prestasi</CardTitle>
              <CardDescription>
                Input prestasi siswa dengan sistem poin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AchievementRecorder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Prestasi</CardTitle>
              <CardDescription>
                Lihat dan analisis prestasi siswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AchievementReport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AchievementManagement;
