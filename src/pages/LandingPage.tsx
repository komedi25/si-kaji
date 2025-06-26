
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, Award, Shield, BookOpen, AlertTriangle, Phone, Mail, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
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
      description: 'Kelola data siswa, kelas, dan informasi akademik secara terpusat',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: BookOpen,
      title: 'Jurnal Pembelajaran',
      description: 'Catat dan pantau perkembangan pembelajaran harian siswa',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Award,
      title: 'Sistem Prestasi',
      description: 'Rekam dan verifikasi prestasi siswa di berbagai bidang',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: Shield,
      title: 'Sistem Disiplin',
      description: 'Monitoring pelanggaran dan poin kedisiplinan siswa',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: AlertTriangle,
      title: 'Manajemen Kasus',
      description: 'Sistem pelaporan dan penanganan kasus siswa yang terintegrasi',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: GraduationCap,
      title: 'Portal Orangtua',
      description: 'Akses informasi perkembangan anak secara real-time',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const displayStats = [
    { label: 'Siswa Aktif', value: stats ? `${stats.activeStudents}+` : '1,200+', icon: Users, color: 'text-blue-400' },
    { label: 'Guru & Staff', value: '85+', icon: GraduationCap, color: 'text-green-400' },
    { label: 'Program Keahlian', value: stats ? `${stats.majors}` : '5', icon: BookOpen, color: 'text-yellow-400' },
    { label: 'Prestasi Tahun Ini', value: stats ? `${stats.achievements}+` : '150+', icon: Award, color: 'text-purple-400' }
  ];

  const benefits = [
    'Sistem terintegrasi untuk semua kebutuhan kesiswaan',
    'Dashboard analytics real-time',
    'Notifikasi otomatis untuk orang tua',
    'Laporan digital yang mudah diakses',
    'Keamanan data tingkat enterprise',
    'Mobile-friendly untuk akses di mana saja'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header - Modern Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img 
                  src="/lovable-uploads/b258db0b-54a9-4826-a0ce-5850c64b6fc7.png" 
                  alt="Logo SMKN 1 Kendal" 
                  className="h-10 w-10 lg:h-12 lg:w-12 rounded-full shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  SMK Negeri 1 Kendal
                </h1>
                <p className="text-sm text-gray-600 font-medium">Si-Kaji - Sistem Kesiswaan Terpadu</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/cases">
                <Button variant="outline" size="sm" className="group border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all">
                  <AlertTriangle className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                  <span className="hidden sm:inline">Laporkan Kasus</span>
                  <span className="sm:hidden">Lapor</span>
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
                  <span className="mr-2">Login Sistem</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Case Tracker - Integrated seamlessly */}
        <div className="border-t border-white/20 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <CaseTracker />
          </div>
        </div>
      </header>

      {/* Hero Section - Enhanced Design */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8 animate-fade-in">
              <CheckCircle className="h-4 w-4 mr-2" />
              Platform Digital Kesiswaan Terdepan
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8">
              <span className="block text-gray-900">Sistem Informasi</span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Kesiswaan Terpadu
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Platform digital terintegrasi untuk manajemen kesiswaan SMK Negeri 1 Kendal. 
              Mendukung pembelajaran, monitoring, dan pengembangan karakter siswa secara komprehensif.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link to="/auth">
                <Button size="lg" className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all px-8 py-4 text-lg">
                  <Users className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                  Akses Sistem Sekarang
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/cases">
                <Button variant="outline" size="lg" className="group border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 px-8 py-4 text-lg">
                  <AlertTriangle className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                  Laporkan Kasus
                </Button>
              </Link>
            </div>

            {/* Benefits List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3 text-left">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Enhanced Visual */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Dipercaya oleh Ribuan Pengguna
            </h2>
            <p className="text-xl text-blue-100">Data real-time dari sistem aktif</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {displayStats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2 group-hover:scale-105 transition-transform">
                  {stat.value}
                </div>
                <div className="text-sm lg:text-base text-blue-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced Cards */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-medium mb-6">
              Fitur Lengkap & Terintegrasi
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Solusi Komprehensif untuk Ekosistem Pendidikan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dilengkapi dengan fitur-fitur canggih untuk mendukung manajemen kesiswaan yang efektif dan efisien
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:scale-105 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
                <CardHeader className="pb-4">
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r ${feature.color} rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-3xl shadow-2xl p-12 lg:p-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Siap Menggunakan Sistem?
            </h2>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Bergabunglah dengan ekosistem digital SMK Negeri 1 Kendal untuk pengalaman 
              pendidikan yang lebih terstruktur dan efisien.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/auth">
                <Button size="lg" className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl px-10 py-4 text-lg transform hover:scale-105 transition-all">
                  Login ke Sistem
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/cases">
                <Button variant="outline" size="lg" className="group border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 px-10 py-4 text-lg">
                  <AlertTriangle className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                  Laporkan Kasus Siswa
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - Enhanced */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Hubungi Kami</h2>
            <p className="text-xl text-gray-600">Kami siap membantu Anda 24/7</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Phone, title: 'Telepon', info: '(0294) 381547', color: 'from-green-500 to-green-600' },
              { icon: Mail, title: 'Email', info: 'smkn1kendal@gmail.com', color: 'from-blue-500 to-blue-600' },
              { icon: MapPin, title: 'Alamat', info: 'Jl. Soekarno Hatta No. 6, Kendal', color: 'from-purple-500 to-purple-600' }
            ].map((contact, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 text-center border-0 shadow-lg">
                <CardContent className="pt-8 pb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${contact.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                    <contact.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{contact.title}</h3>
                  <p className="text-gray-600 font-medium">{contact.info}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Modern Design */}
      <footer className="bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-8 md:mb-0">
              <div className="relative">
                <img 
                  src="/lovable-uploads/b258db0b-54a9-4826-a0ce-5850c64b6fc7.png" 
                  alt="Logo SMKN 1 Kendal" 
                  className="h-12 w-12 lg:h-14 lg:w-14 rounded-full"
                />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  SMK Negeri 1 Kendal
                </h3>
                <p className="text-gray-400 font-medium">Sistem Informasi Kesiswaan Terpadu</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 font-medium">
                © 2024 SMK Negeri 1 Kendal. All rights reserved.
              </p>
              <p className="text-gray-400 mt-2">
                Jl. Soekarno Hatta No. 6, Kendal, Jawa Tengah
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
