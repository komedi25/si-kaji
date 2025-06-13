import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface FeatureStatus {
  name: string;
  status: 'completed' | 'in-progress' | 'not-started' | 'needs-review';
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export const SystemAnalysis = () => {
  const features: FeatureStatus[] = [
    {
      name: 'Dashboard Interaktif',
      status: 'completed',
      description: 'Dashboard role-based dengan statistik dan grafik responsif',
      priority: 'high'
    },
    {
      name: 'Manajemen Siswa',
      status: 'completed',
      description: 'CRUD siswa dengan import/export Excel',
      priority: 'high'
    },
    {
      name: 'Sistem Presensi',
      status: 'in-progress',
      description: 'Input dan laporan presensi harian',
      priority: 'high'
    },
    {
      name: 'Manajemen Pelanggaran',
      status: 'in-progress',
      description: 'Pencatatan dan pelaporan pelanggaran siswa',
      priority: 'high'
    },
    {
      name: 'Sistem Prestasi',
      status: 'in-progress',
      description: 'Pencatatan dan verifikasi prestasi siswa',
      priority: 'medium'
    },
    {
      name: 'Poin Disiplin',
      status: 'completed',
      description: 'Kalkulasi otomatis poin disiplin dari pelanggaran/prestasi',
      priority: 'high'
    },
    {
      name: 'Jurnal Perwalian',
      status: 'not-started',
      description: 'Jurnal wali kelas untuk monitoring siswa',
      priority: 'medium'
    },
    {
      name: 'Sesi Konseling',
      status: 'completed',
      description: 'Manajemen sesi konseling BK dengan kalender dan riwayat',
      priority: 'medium'
    },
    {
      name: 'Manajemen Kasus',
      status: 'completed',
      description: 'Workflow penanganan kasus siswa',
      priority: 'high'
    },
    {
      name: 'Sistem Perizinan',
      status: 'not-started',
      description: 'Pengajuan dan persetujuan izin siswa',
      priority: 'medium'
    },
    {
      name: 'Ekstrakurikuler',
      status: 'not-started',
      description: 'Manajemen kegiatan ekstrakurikuler',
      priority: 'medium'
    },
    {
      name: 'Proposal Kegiatan',
      status: 'completed',
      description: 'Workflow persetujuan proposal kegiatan',
      priority: 'medium'
    },
    {
      name: 'Dokumen & Surat',
      status: 'in-progress',
      description: 'Manajemen dokumen dan template surat',
      priority: 'low'
    },
    {
      name: 'Portal Orang Tua',
      status: 'not-started',
      description: 'Interface untuk orang tua melihat progress anak',
      priority: 'medium'
    },
    {
      name: 'AI Assistant',
      status: 'not-started',
      description: 'Asisten AI untuk analisis dan rekomendasi',
      priority: 'low'
    },
    {
      name: 'Master Data',
      status: 'completed',
      description: 'Manajemen data master sistem',
      priority: 'high'
    },
    {
      name: 'User Management',
      status: 'completed',
      description: 'Manajemen user dan role',
      priority: 'high'
    },
    {
      name: 'Notification System',
      status: 'completed',
      description: 'Sistem notifikasi multi-channel',
      priority: 'medium'
    },
    {
      name: 'Mobile Responsive',
      status: 'needs-review',
      description: 'Optimasi tampilan untuk perangkat mobile',
      priority: 'high'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'needs-review':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'not-started':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'completed': 'default',
      'in-progress': 'secondary',
      'needs-review': 'destructive',
      'not-started': 'outline'
    } as const;

    const labels = {
      'completed': 'Selesai',
      'in-progress': 'Dalam Progress',
      'needs-review': 'Perlu Review',
      'not-started': 'Belum Dimulai'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      'high': 'destructive',
      'medium': 'secondary',
      'low': 'outline'
    } as const;

    const labels = {
      'high': 'Tinggi',
      'medium': 'Sedang',
      'low': 'Rendah'
    };

    return (
      <Badge variant={variants[priority as keyof typeof variants]} className="ml-2">
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  const completedCount = features.filter(f => f.status === 'completed').length;
  const inProgressCount = features.filter(f => f.status === 'in-progress').length;
  const notStartedCount = features.filter(f => f.status === 'not-started').length;
  const needsReviewCount = features.filter(f => f.status === 'needs-review').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-600">Selesai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-yellow-600">Dalam Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-orange-600">Perlu Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{needsReviewCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-red-600">Belum Dimulai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notStartedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Fitur Sistem</CardTitle>
          <CardDescription>
            Progress pengembangan semua fitur dalam sistem kesiswaan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(feature.status)}
                  <div>
                    <h4 className="font-medium">{feature.name}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {getStatusBadge(feature.status)}
                  {getPriorityBadge(feature.priority)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
