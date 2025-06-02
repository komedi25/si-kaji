
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AcademicYearManager } from '@/components/masterData/AcademicYearManager';
import { SemesterManager } from '@/components/masterData/SemesterManager';
import { MajorManager } from '@/components/masterData/MajorManager';
import { ClassManager } from '@/components/masterData/ClassManager';
import { ViolationTypeManager } from '@/components/masterData/ViolationTypeManager';
import { AchievementTypeManager } from '@/components/masterData/AchievementTypeManager';
import { ExtracurricularManager } from '@/components/masterData/ExtracurricularManager';
import { SchoolFacilityManager } from '@/components/masterData/SchoolFacilityManager';
import { 
  Calendar, 
  School, 
  Users, 
  BookOpen, 
  Shield, 
  Trophy, 
  Activity, 
  Building 
} from 'lucide-react';

const MasterData = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Master Data Sekolah</h1>
        <p className="text-gray-600 mt-2">
          Kelola data referensi dan master data untuk sistem informasi sekolah
        </p>
      </div>

      <Tabs defaultValue="academic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="academic" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Akademik
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            Struktur
          </TabsTrigger>
          <TabsTrigger value="violations" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Pelanggaran
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Prestasi
          </TabsTrigger>
          <TabsTrigger value="extracurricular" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Ekskul
          </TabsTrigger>
          <TabsTrigger value="facilities" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Fasilitas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tahun Ajaran</CardTitle>
                <CardDescription>
                  Kelola data tahun ajaran sekolah
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AcademicYearManager />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Semester</CardTitle>
                <CardDescription>
                  Kelola data semester dalam tahun ajaran
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SemesterManager />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="structure" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Jurusan</CardTitle>
                <CardDescription>
                  Kelola data jurusan sekolah
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MajorManager />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kelas</CardTitle>
                <CardDescription>
                  Kelola data kelas sekolah
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClassManager />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="violations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Jenis Pelanggaran</CardTitle>
              <CardDescription>
                Kelola data jenis pelanggaran dan bobot poin pengurangan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ViolationTypeManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Jenis Prestasi</CardTitle>
              <CardDescription>
                Kelola data jenis prestasi dan bobot poin penghargaan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AchievementTypeManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extracurricular" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ekstrakurikuler</CardTitle>
              <CardDescription>
                Kelola data kegiatan ekstrakurikuler sekolah
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExtracurricularManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fasilitas Sekolah</CardTitle>
              <CardDescription>
                Kelola data fasilitas dan sarana prasarana sekolah
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SchoolFacilityManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MasterData;
