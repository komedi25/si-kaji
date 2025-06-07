
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AcademicYearManager } from '@/components/masterData/AcademicYearManager';
import { SemesterManager } from '@/components/masterData/SemesterManager';
import { MajorManager } from '@/components/masterData/MajorManager';
import { ClassManager } from '@/components/masterData/ClassManager';
import { ViolationTypeManager } from '@/components/masterData/ViolationTypeManager';
import { AchievementTypeManager } from '@/components/masterData/AchievementTypeManager';
import { ExtracurricularManager } from '@/components/masterData/ExtracurricularManager';
import { SchoolFacilityManager } from '@/components/masterData/SchoolFacilityManager';

const MasterData = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('academic');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const renderContent = () => {
    switch (activeTab) {
      case 'academic':
        return (
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
        );
      case 'structure':
        return (
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
        );
      case 'violations':
        return (
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
        );
      case 'achievements':
        return (
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
        );
      case 'extracurricular':
        return (
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
        );
      case 'facilities':
        return (
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
        );
      default:
        return (
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
        );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Master Data Sekolah</h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Kelola data referensi dan master data untuk sistem informasi sekolah
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
};

export default MasterData;
