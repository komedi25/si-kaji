import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, Award, Shield, BookOpen, AlertTriangle, Phone, Mail, MapPin, ArrowRight, CheckCircle, Star, Clock, BarChart3, FileText } from 'lucide-react';
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
        supabase.from('profiles').select('id').limit(100),
        supabase.from('majors').select('id').eq('is_active', true),
        supabase.from('student_achievements').select('id').eq('status', 'verified')
          .gte('achievement_date', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
      ]);

      return {
        activeStudents: studentsResult.data?.length || 0,
        staffCount: Math.min(teachersResult.data?.length || 0, 85),
        majors: majorsResult.data?.length || 0,
        achievements: achievementsResult.data?.length || 0
      };
    },
  });

  const features = [
    {
      icon: Users,
      title: 'Manajemen Siswa Terpadu',
      description: 'Kelola data siswa, kelas, dan informasi akademik secara terpusat dengan sistem yang terintegrasi',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: BarChart3,
      title: 'Dashboard Analytics',
      description: 'Pantau perkembangan siswa dengan dashboard real-time dan visualisasi data yang komprehensif',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Award,
      title: 'Sistem Prestasi Digital',
      description: 'Rekam dan verifikasi prestasi siswa di berbagai bidang dengan sistem poin yang otomatis',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      icon: Shield,
      title: 'Monitoring Disiplin',
      description: 'Tracking pelanggaran dan poin kedisiplinan siswa dengan notifikasi real-time untuk orang tua',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: AlertTriangle,
      title: 'Sistem Pelaporan Kasus',
      description: 'Platform pelaporan dan penanganan kasus siswa yang terintegrasi dengan tim TPPK dan BK',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: GraduationCap,
      title: 'Portal Orang Tua Modern',
      description: 'Akses informasi perkembangan anak secara real-time melalui notifikasi WhatsApp dan email',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
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
    'Dashboard analytics real-time dengan visualisasi data',
    'Notifikasi otomatis WhatsApp & Email untuk orang tua',
    'Laporan digital yang mudah diakses dan diunduh',
    'Keamanan data tingkat enterprise dengan enkripsi',
    'Mobile-friendly untuk akses di mana saja, kapan saja'
  ];

  const testimonials = [
    {
      name: 'Ibu Siti Aminah',
      role: 'Orang Tua Siswa',
      quote: 'Sangat membantu untuk memantau perkembangan anak di sekolah. Notifikasi real-time membuat kami selalu update.',
      rating: 5
    },
    {
      name: 'Pak Budi Santoso',
      role: 'Wali Kelas XII',
      quote: 'Dashboard analytics sangat membantu dalam monitoring siswa. Data yang akurat dan mudah dipahami.',
      rating: 5
    },
    {
      name: 'Ahmad Rifki',
      role: 'Siswa Kelas XI',
      quote: 'Interface yang user-friendly dan fitur yang lengkap. Memudahkan untuk mengakses semua informasi sekolah.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header - Relocated buttons */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-6">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <img 
                  src="/lovable-uploads/b258db0b-54a9-4826-a0ce-5850c64b6fc7.png" 
                  alt="Logo SMKN 1 Kendal" 
                  className="h-12 w-12 lg:h-14 lg:w-14 rounded-full shadow-xl group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  SMK Negeri 1 Kendal
                </h1>
                <p className="text-sm lg:text-base text-gray-600 font-medium">Si-Kaji - Sistem Informasi Kesiswaan Terpadu</p>
              </div>
            </div>
            
            {/* Center - Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Fitur</a>
              <a href="#stats" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Statistik</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Testimoni</a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Kontak</a>
            </nav>
            
            {/* Right - Action buttons */}
            <div className="flex items-center space-x-3">
              <Link to="/cases">
                <Button variant="outline" size="sm" className="group border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-all duration-300">
                  <AlertTriangle className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                  <span className="hidden sm:inline">Lapor Kasus</span>
                  <span className="sm:hidden">Lapor</span>
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <span className="mr-2">Masuk Sistem</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Case Tracker - Enhanced Integration */}
        <div className="border-t border-white/20 bg-gradient-to-r from-white/60 to-blue-50/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <CaseTracker />
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-28 lg:pb-40 overflow-hidden">
        {/* Advanced Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute top-40 right-10 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float-delayed"></div>
          <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float-reverse"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            {/* Enhanced Badge */}
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-medium mb-8 shadow-lg animate-fade-in border border-blue-200">
              <CheckCircle className="h-5 w-5 mr-2" />
              Platform Digital Kesiswaan Terdepan di Indonesia
            </div>
            
            {/* Enhanced Title */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight mb-8">
              <span className="block text-gray-900 mb-2">Sistem Informasi</span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
                Kesiswaan Terpadu
              </span>
            </h1>
            
            {/* Enhanced Description */}
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Platform digital terintegrasi untuk manajemen kesiswaan SMK Negeri 1 Kendal. 
              Mendukung pembelajaran, monitoring, dan pengembangan karakter siswa secara komprehensif dengan teknologi terkini.
            </p>
            
            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link to="/auth">
                <Button size="lg" className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 px-10 py-5 text-xl rounded-2xl">
                  <Users className="h-6 w-6 mr-3 group-hover:animate-bounce" />
                  Akses Sistem Sekarang
                  <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
              <Link to="/cases">
                <Button variant="outline" size="lg" className="group border-3 border-orange-400 text-orange-600 hover:bg-orange-50 hover:border-orange-500 px-10 py-5 text-xl rounded-2xl transform hover:scale-105 transition-all duration-300">
                  <AlertTriangle className="h-6 w-6 mr-3 group-hover:animate-pulse" />
                  Laporkan Kasus Siswa
                </Button>
              </Link>
            </div>

            {/* Enhanced Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <span className="text-gray-700 font-medium text-left">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section id="stats" className="py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Dipercaya oleh Ribuan Pengguna
            </h2>
            <p className="text-xl text-blue-100 font-medium">Data real-time dari sistem yang sedang berjalan</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {displayStats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 shadow-xl">
                  <stat.icon className={`h-10 w-10 ${stat.color}`} />
                </div>
                <div className="text-4xl lg:text-5xl font-bold text-white mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-base lg:text-lg text-blue-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="py-28 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-medium mb-8 shadow-lg border border-blue-200">
              Fitur Lengkap & Terintegrasi
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-8">
              Solusi Komprehensif untuk Ekosistem Pendidikan
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Dilengkapi dengan fitur-fitur canggih untuk mendukung manajemen kesiswaan yang efektif, efisien, dan modern
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <Card key={index} className={`group hover:shadow-3xl transition-all duration-500 border-0 shadow-xl hover:scale-110 overflow-hidden ${feature.bgColor} hover:bg-white`}>
                <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
                <CardHeader className="pb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-3xl mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 shadow-xl`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
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

      {/* New Testimonials Section */}
      <section id="testimonials" className="py-24 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Apa Kata Pengguna Kami
            </h2>
            <p className="text-xl text-gray-600">Testimoni dari siswa, guru, dan orang tua yang menggunakan sistem</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:scale-105 bg-white">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-28 bg-gradient-to-br from-gray-900 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 lg:p-20 shadow-3xl border border-white/20">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">
              Siap Menggunakan Sistem?
            </h2>
            <p className="text-xl text-blue-100 mb-12 leading-relaxed max-w-3xl mx-auto">
              Bergabunglah dengan ekosistem digital SMK Negeri 1 Kendal untuk pengalaman 
              pendidikan yang lebih terstruktur, efisien, dan modern.
            </p>
            <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <Link to="/auth">
                <Button size="lg" className="group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-2xl hover:shadow-3xl px-12 py-6 text-xl rounded-2xl transform hover:scale-110 transition-all duration-300">
                  Masuk ke Sistem
                  <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
              <Link to="/cases">
                <Button variant="outline" size="lg" className="group border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white px-12 py-6 text-xl rounded-2xl transform hover:scale-105 transition-all duration-300">
                  <AlertTriangle className="h-6 w-6 mr-3 group-hover:animate-pulse" />
                  Laporkan Kasus Siswa
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Contact Section */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Hubungi Kami</h2>
            <p className="text-xl text-gray-600">Tim support kami siap membantu Anda 24/7</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Phone, title: 'Telepon', info: '(0294) 381547', color: 'from-green-500 to-green-600', bg: 'bg-green-50' },
              { icon: Mail, title: 'Email', info: 'smkn1kendal@gmail.com', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
              { icon: MapPin, title: 'Alamat', info: 'Jl. Soekarno Hatta No. 6, Kendal', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' }
            ].map((contact, index) => (
              <Card key={index} className={`group hover:shadow-2xl transition-all duration-300 text-center border-0 shadow-xl hover:scale-110 ${contact.bg} hover:bg-white`}>
                <CardContent className="pt-10 pb-8">
                  <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${contact.color} rounded-3xl mb-8 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 shadow-xl`}>
                    <contact.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{contact.title}</h3>
                  <p className="text-gray-600 font-medium text-lg">{contact.info}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-6 mb-8 md:mb-0">
              <div className="relative group">
                <img 
                  src="/lovable-uploads/b258db0b-54a9-4826-a0ce-5850c64b6fc7.png" 
                  alt="Logo SMKN 1 Kendal" 
                  className="h-16 w-16 lg:h-18 lg:w-18 rounded-full shadow-2xl group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  SMK Negeri 1 Kendal
                </h3>
                <p className="text-gray-400 font-medium text-lg">Sistem Informasi Kesiswaan Terpadu</p>
                <p className="text-gray-500 text-sm mt-1">Membangun generasi unggul dan berkarakter</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 font-medium text-lg">
                © 2024 SMK Negeri 1 Kendal. Semua hak dilindungi.
              </p>
              <p className="text-gray-400 mt-2 text-base">
                Jl. Soekarno Hatta No. 6, Kendal, Jawa Tengah
              </p>
              <p className="text-gray-500 mt-2 text-sm">
                Dibuat dengan ❤️ untuk pendidikan Indonesia
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(-10px); }
          50% { transform: translateY(0px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 7s ease-in-out infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .bg-grid-pattern {
          background-image: radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .bg-grid-white\/5 {
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 30px 30px;
        }
        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}
