
import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
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
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Master Data Sekolah</h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Kelola data referensi dan master data untuk sistem informasi sekolah
          </p>
        </div>

        <Tabs defaultValue="academic" className="space-y-4 md:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full min-w-[600px] grid-cols-4 lg:grid-cols-6 lg:min-w-0">
              <TabsTrigger value="academic" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Akademik</span>
                <span className="sm:hidden">Akad</span>
              </TabsTrigger>
              <TabsTrigger value="structure" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <School className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Struktur</span>
                <span className="sm:hidden">Str</span>
              </TabsTrigger>
              <TabsTrigger value="violations" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <Shield className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Pelanggaran</span>
                <span className="sm:hidden">Pel</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <Trophy className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Prestasi</span>
                <span className="sm:hidden">Pre</span>
              </TabsTrigger>
              <TabsTrigger value="extracurricular" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <Activity className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Ekskul</span>
                <span className="sm:hidden">Eks</span>
              </TabsTrigger>
              <TabsTrigger value="facilities" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <Building className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Fasilitas</span>
                <span className="sm:hidden">Fas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="academic" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Tahun Ajaran</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Kelola data tahun ajaran sekolah
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AcademicYearManager />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Semester</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Kelola data semester dalam tahun ajaran
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SemesterManager />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="structure" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Jurusan</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Kelola data jurusan sekolah
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MajorManager />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Kelas</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Kelola data kelas sekolah
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ClassManager />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="violations" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Jenis Pelanggaran</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Kelola data jenis pelanggaran dan bobot poin pengurangan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ViolationTypeManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Jenis Prestasi</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Kelola data jenis prestasi dan bobot poin penghargaan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AchievementTypeManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extracurricular" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Ekstrakurikuler</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Kelola data kegiatan ekstrakurikuler sekolah
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExtracurricularManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facilities" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Fasilitas Sekolah</CardTitle>
                <CardDescription className="text-sm md:text-base">
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
    </AppLayout>
  );
};

export default MasterData;
