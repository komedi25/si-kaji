
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, Award, Shield, BookOpen, AlertTriangle, Phone, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CaseTracker } from '@/components/cases/CaseTracker';

export default function LandingPage() {
  // Fetch real statistics from database
  const { data: stats } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: async () => {
      const [studentsResult, teachersResult, majorsResult, achievementsResult] = await Promise.all([
        supabase.from('students').select('id').eq('status', 'active'),
        supabase.from('profiles').select('id').limit(100), // Approximation for staff
        supabase.from('majors').select('id').eq('is_active', true),
        supabase.from('student_achievements').select('id').eq('status', 'verified')
          .gte('achievement_date', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
      ]);

      return {
        activeStudents: studentsResult.data?.length || 0,
        staffCount: Math.min(teachersResult.data?.length || 0, 85), // Cap at reasonable number
        majors: majorsResult.data?.length || 0,
        achievements: achievementsResult.data?.length || 0
      };
    },
  });

  const features = [
    {
      icon: Users,
      title: 'Manajemen Siswa',
      description: 'Kelola data siswa, kelas, dan informasi akademik secara terpusat'
    },
    {
      icon: BookOpen,
      title: 'Jurnal Pembelajaran',
      description: 'Catat dan pantau perkembangan pembelajaran harian siswa'
    },
    {
      icon: Award,
      title: 'Sistem Prestasi',
      description: 'Rekam dan verifikasi prestasi siswa di berbagai bidang'
    },
    {
      icon: Shield,
      title: 'Sistem Disiplin',
      description: 'Monitoring pelanggaran dan poin kedisiplinan siswa'
    },
    {
      icon: AlertTriangle,
      title: 'Manajemen Kasus',
      description: 'Sistem pelaporan dan penanganan kasus siswa yang terintegrasi'
    },
    {
      icon: GraduationCap,
      title: 'Portal Orangtua',
      description: 'Akses informasi perkembangan anak secara real-time'
    }
  ];

  const displayStats = [
    { label: 'Siswa Aktif', value: stats ? `${stats.activeStudents}+` : '1,200+' },
    { label: 'Guru & Staff', value: '85+' },
    { label: 'Program Keahlian', value: stats ? `${stats.majors}` : '5' },
    { label: 'Prestasi Tahun Ini', value: stats ? `${stats.achievements}+` : '150+' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-6">
            <div className="flex items-center flex-shrink-0">
              <img 
                src="/lovable-uploads/b258db0b-54a9-4826-a0ce-5850c64b6fc7.png" 
                alt="Logo SMKN 1 Kendal" 
                className="h-10 w-10 lg:h-12 lg:w-12 mr-3"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg lg:text-xl font-bold text-gray-900">SMK Negeri 1 Kendal</h1>
                <p className="text-xs lg:text-sm text-gray-600">Sistem Informasi Kesiswaan Terpadu</p>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="hidden lg:block">
                <CaseTracker />
              </div>
              <Link to="/cases">
                <Button variant="outline" size="sm" className="text-xs lg:text-sm px-2 lg:px-4">
                  <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Laporkan</span>
                  <span className="sm:hidden">Lapor</span>
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="text-xs lg:text-sm px-2 lg:px-4">
                  <span className="hidden sm:inline">Login Sistem</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              </Link>
            </div>
          </div>
          {/* Mobile Case Tracker */}
          <div className="block lg:hidden pb-4">
            <CaseTracker />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            Sistem Informasi
            <span className="text-blue-600 block">Kesiswaan Terpadu</span>
          </h1>
          <p className="text-base lg:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Platform digital terintegrasi untuk manajemen kesiswaan SMK Negeri 1 Kendal. 
            Mendukung pembelajaran, monitoring, dan pengembangan karakter siswa secara komprehensif.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                <Users className="h-5 w-5 mr-2" />
                Akses Sistem
              </Button>
            </Link>
            <Link to="/cases">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Laporkan Kasus
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 lg:py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
            {displayStats.map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm lg:text-base text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-4">
              Fitur Unggulan Sistem
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
              Solusi komprehensif untuk mendukung ekosistem pendidikan yang modern dan terintegrasi
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-10 w-10 lg:h-12 lg:w-12 text-blue-600 mb-4" />
                  <CardTitle className="text-lg lg:text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-sm lg:text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-6">
            Siap Menggunakan Sistem?
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 mb-8">
            Bergabunglah dengan ekosistem digital SMK Negeri 1 Kendal untuk pengalaman 
            pendidikan yang lebih terstruktur dan efisien.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Login ke Sistem
              </Button>
            </Link>
            <Link to="/cases">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <AlertTriangle className="h-4 w-5 mr-2" />
                Laporkan Kasus Siswa
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Kontak Sekolah</h2>
            <p className="text-gray-600">Hubungi kami untuk informasi lebih lanjut</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center">
              <Phone className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Telepon</h3>
              <p className="text-gray-600 text-sm lg:text-base">(0294) 381547</p>
            </div>
            
            <div className="text-center">
              <Mail className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 text-sm lg:text-base">smkn1kendal@gmail.com</p>
            </div>
            
            <div className="text-center">
              <MapPin className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Alamat</h3>
              <p className="text-gray-600 text-sm lg:text-base">Jl. Soekarno Hatta No. 6, Kendal</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img 
                src="/lovable-uploads/b258db0b-54a9-4826-a0ce-5850c64b6fc7.png" 
                alt="Logo SMKN 1 Kendal" 
                className="h-8 w-8 lg:h-10 lg:w-10 mr-3"
              />
              <div>
                <h3 className="font-bold text-sm lg:text-base">SMK Negeri 1 Kendal</h3>
                <p className="text-xs lg:text-sm text-gray-400">Sistem Informasi Kesiswaan</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs lg:text-sm text-gray-400">
                © 2024 SMK Negeri 1 Kendal. All rights reserved.
              </p>
              <p className="text-xs lg:text-sm text-gray-400 mt-1">
                Jl. Soekarno Hatta No. 6, Kendal, Jawa Tengah
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
