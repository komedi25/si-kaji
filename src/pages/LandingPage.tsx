
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  TrendingUp, 
  Shield, 
  BookOpen,
  Star,
  Trophy,
  MessageSquare,
  Clock,
  ArrowRight,
  CheckCircle,
  Zap,
  Target,
  Heart
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="relative z-50 bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/b258db0b-54a9-4826-a0ce-5850c64b6fc7.png" 
                alt="Logo SMKN 1 Kendal" 
                className="h-10 w-10 rounded-full shadow-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-blue-900">Si-Kaji</h1>
                <p className="text-xs text-blue-600 font-medium">SMK Negeri 1 Kendal</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Fitur
              </a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Tentang
              </a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Kontak
              </a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  Masuk
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200 px-4 py-2">
              ✨ Sistem Informasi Kesiswaan Terpadu
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Kelola Data Siswa dengan
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}Mudah & Efisien
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              Si-Kaji adalah platform digital yang mengintegrasikan seluruh aspek manajemen kesiswaan, 
              dari presensi hingga evaluasi prestasi, dalam satu sistem yang mudah digunakan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Mulai Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-3 rounded-xl">
                Pelajari Lebih Lanjut
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Fitur Unggulan Si-Kaji
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Solusi lengkap untuk mengelola seluruh aspek kesiswaan dengan teknologi modern
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="h-8 w-8" />,
                title: "Manajemen Siswa",
                description: "Kelola data siswa, kelas, dan wali kelas dalam satu platform terpadu",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: <Calendar className="h-8 w-8" />,
                title: "Presensi Digital",
                description: "Sistem absensi otomatis dengan teknologi geolocation dan QR code",
                color: "from-green-500 to-green-600"
              },
              {
                icon: <Trophy className="h-8 w-8" />,
                title: "Tracking Prestasi",
                description: "Catat dan pantau perkembangan prestasi siswa secara real-time",
                color: "from-yellow-500 to-yellow-600"
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Sistem Kedisiplinan",
                description: "Monitoring pelanggaran dan poin kedisiplinan siswa",
                color: "from-red-500 to-red-600"
              },
              {
                icon: <MessageSquare className="h-8 w-8" />,
                title: "Konseling Digital",
                description: "Platform konseling dan bimbingan siswa yang terintegrasi",
                color: "from-purple-500 to-purple-600"
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: "Analytics & Laporan",
                description: "Dashboard analitik dengan visualisasi data yang komprehensif",
                color: "from-indigo-500 to-indigo-600"
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:transform hover:scale-105">
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Dipercaya oleh Ribuan Pengguna
            </h2>
            <p className="text-xl text-blue-100">
              Bergabunglah dengan komunitas sekolah yang telah merasakan manfaat Si-Kaji
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: "1000+", label: "Siswa Aktif" },
              { number: "50+", label: "Guru & Staff" },
              { number: "98%", label: "Tingkat Kepuasan" },
              { number: "24/7", label: "Support" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Siap Memulai Transformasi Digital?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan Si-Kaji dan rasakan kemudahan mengelola data kesiswaan 
            dengan teknologi terdepan.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Mulai Gratis Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/lovable-uploads/b258db0b-54a9-4826-a0ce-5850c64b6fc7.png" 
                  alt="Logo SMKN 1 Kendal" 
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <h3 className="font-bold">Si-Kaji</h3>
                  <p className="text-sm text-gray-400">SMK N 1 Kendal</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Sistem Informasi Kesiswaan yang mengintegrasikan seluruh aspek manajemen siswa.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Fitur</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Manajemen Siswa</li>
                <li>Presensi Digital</li>
                <li>Tracking Prestasi</li>
                <li>Konseling Online</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Bantuan</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Dokumentasi</li>
                <li>Tutorial</li>
                <li>FAQ</li>
                <li>Support</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <div className="text-sm text-gray-400 space-y-2">
                <p>SMK Negeri 1 Kendal</p>
                <p>Jl. Soekarno Hatta No. 1</p>
                <p>Kendal, Jawa Tengah</p>
                <p>Telp: (0294) 381-234</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Si-Kaji SMK Negeri 1 Kendal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
