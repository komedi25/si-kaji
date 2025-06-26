
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Trophy, AlertTriangle, Clock, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentQuickActions = () => {
  const quickActions = [
    {
      title: 'Presensi Hari Ini',
      description: 'Presensi kehadiran harian',
      icon: Clock,
      href: '/attendance/self',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Ajukan Izin',
      description: 'Buat pengajuan surat izin',
      icon: FileText,
      href: '/permits',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      iconColor: 'text-green-600'
    },
    {
      title: 'Input Prestasi',
      description: 'Laporkan prestasi terbaru',
      icon: Trophy,
      href: '/achievements/submit',
      color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Lapor Kasus',
      description: 'Laporkan masalah atau kasus',
      icon: AlertTriangle,
      href: '/cases/reports',
      color: 'bg-red-50 hover:bg-red-100 border-red-200',
      iconColor: 'text-red-600'
    },
    {
      title: 'Jadwal Kegiatan',
      description: 'Lihat jadwal ekstrakurikuler',
      icon: Calendar,
      href: '/extracurricular',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Konsultasi BK',
      description: 'Jadwalkan sesi konseling',
      icon: BookOpen,
      href: '/counseling',
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
      iconColor: 'text-indigo-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Aksi Cepat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.href}>
              <Button 
                variant="outline" 
                className={`h-auto p-4 flex flex-col items-center text-center space-y-2 w-full ${action.color} transition-all duration-200 hover:scale-105 hover:shadow-md`}
              >
                <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                <div>
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-gray-600 mt-1">{action.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
