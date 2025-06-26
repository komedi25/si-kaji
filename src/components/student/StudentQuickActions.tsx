
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  FileText, 
  Trophy, 
  AlertCircle, 
  Users, 
  MessageSquare,
  Calendar,
  BookOpen 
} from 'lucide-react';

export const StudentQuickActions = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: Clock,
      title: 'Presensi',
      description: 'Check in/out mandiri',
      color: 'bg-blue-100 text-blue-600',
      onClick: () => navigate('/attendance/self')
    },
    {
      icon: FileText,
      title: 'Pengajuan Surat',
      description: 'Minta surat keterangan',
      color: 'bg-green-100 text-green-600',
      onClick: () => navigate('/permits')
    },
    {
      icon: Trophy,
      title: 'Tambah Prestasi',
      description: 'Input prestasi baru',
      color: 'bg-yellow-100 text-yellow-600',
      onClick: () => {/* Will be handled by parent component */}
    },
    {
      icon: MessageSquare,
      title: 'Lapor Kasus',
      description: 'Laporkan kejadian',
      color: 'bg-red-100 text-red-600',
      onClick: () => navigate('/cases/report')
    },
    {
      icon: Users,
      title: 'Ekstrakurikuler',
      description: 'Lihat kegiatan',
      color: 'bg-purple-100 text-purple-600',
      onClick: () => navigate('/extracurricular')
    },
    {
      icon: Calendar,
      title: 'Konseling',
      description: 'Jadwal BK',
      color: 'bg-orange-100 text-orange-600',
      onClick: () => navigate('/counseling')
    }
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Aksi Cepat</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={action.onClick}
              className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-gray-50"
            >
              <div className={`p-2 rounded-full ${action.color}`}>
                <action.icon className="h-4 w-4" />
              </div>
              <div className="text-center">
                <div className="text-xs font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
