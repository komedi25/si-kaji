
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const ReportGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState<any>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [reportSections, setReportSections] = useState({
    attendance: true,
    violations: true,
    achievements: true,
    discipline: true,
    counseling: false,
    extracurricular: false
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Get classes and majors for filters
  const { data: classes } = useQuery({
    queryKey: ['classes-for-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          grade,
          major:majors(
            id,
            name,
            code
          )
        `)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: majors } = useQuery({
    queryKey: ['majors-for-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('majors')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get recent reports
  const { data: recentReports } = useQuery({
    queryKey: ['recent-reports'],
    queryFn: async () => {
      // This would typically come from a reports table
      // For now, we'll return mock data
      return [
        {
          id: '1',
          title: 'Laporan Bulanan Disiplin Siswa',
          type: 'discipline',
          createdAt: '2024-06-10',
          status: 'completed',
          fileUrl: '#'
        },
        {
          id: '2',
          title: 'Laporan Kehadiran Semester',
          type: 'attendance',
          createdAt: '2024-06-08',
          status: 'completed',
          fileUrl: '#'
        },
        {
          id: '3',
          title: 'Laporan Prestasi Siswa',
          type: 'achievements',
          createdAt: '2024-06-05',
          status: 'processing',
          fileUrl: null
        }
      ];
    },
    enabled: !!user,
  });

  const reportTypes = [
    { value: 'attendance', label: 'Laporan Kehadiran', description: 'Rekap kehadiran siswa per periode' },
    { value: 'discipline', label: 'Laporan Disiplin', description: 'Poin disiplin dan pelanggaran siswa' },
    { value: 'achievements', label: 'Laporan Prestasi', description: 'Prestasi dan penghargaan siswa' },
    { value: 'comprehensive', label: 'Laporan Komprehensif', description: 'Laporan lengkap semua aspek' },
    { value: 'class_progress', label: 'Laporan Perkembangan Kelas', description: 'Progress akademik per kelas' },
    { value: 'individual_progress', label: 'Laporan Individu Siswa', description: 'Laporan detail per siswa' }
  ];

  const handleSectionChange = (section: string, checked: boolean) => {
    setReportSections(prev => ({
      ...prev,
      [section]: checked
    }));
  };

  const generateReport = async () => {
    if (!reportType || !dateRange?.from || !dateRange?.to) {
      toast({
        title: "Error",
        description: "Mohon lengkapi jenis laporan dan periode tanggal",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Here you would typically call an API to generate the report
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast({
        title: "Berhasil",
        description: "Laporan sedang diproses. Anda akan mendapat notifikasi ketika selesai."
      });

      // Reset form
      setReportType('');
      setDateRange(null);
      setSelectedClasses([]);
      setSelectedMajors([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membuat laporan. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Selesai</Badge>;
      case 'processing':
        return <Badge variant="outline">Memproses</Badge>;
      case 'failed':
        return <Badge variant="destructive">Gagal</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (!user?.roles?.includes('admin') && !user?.roles?.includes('waka_kesiswaan') && !user?.roles?.includes('wali_kelas')) {
    return (
      <div className="text-center p-8">
        <p>Anda tidak memiliki akses untuk membuat laporan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Generator Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Generator Laporan Otomatis
              </CardTitle>
              <CardDescription>
                Buat laporan komprehensif dengan berbagai filter dan kustomisasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Jenis Laporan</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis laporan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Periode Laporan</label>
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
              </div>

              {/* Class Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Filter Kelas (Opsional)</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {classes?.map((cls: any) => (
                    <div key={cls.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`class-${cls.id}`}
                        checked={selectedClasses.includes(cls.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedClasses([...selectedClasses, cls.id]);
                          } else {
                            setSelectedClasses(selectedClasses.filter(id => id !== cls.id));
                          }
                        }}
                      />
                      <label htmlFor={`class-${cls.id}`} className="text-sm">
                        {cls.name} - {cls.major?.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Sections */}
              <div>
                <label className="text-sm font-medium mb-2 block">Bagian Laporan</label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(reportSections).map(([key, checked]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={checked}
                        onCheckedChange={(checked) => handleSectionChange(key, checked as boolean)}
                      />
                      <label htmlFor={key} className="text-sm capitalize">
                        {key.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generateReport} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Membuat Laporan...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Buat Laporan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Laporan Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports?.map((report: any) => (
                  <div key={report.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{report.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      {getStatusIcon(report.status)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {getStatusBadge(report.status)}
                      {report.status === 'completed' && (
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Report Templates */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Template Laporan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  Laporan Mingguan
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Laporan Bulanan
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Laporan Semester
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Laporan Tahunan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Report Preview/Templates Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Template Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Laporan Kehadiran</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Statistik kehadiran per kelas</li>
                <li>• Trend absensi bulanan</li>
                <li>• Daftar siswa dengan absensi tinggi</li>
                <li>• Grafik perbandingan antar kelas</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Laporan Disiplin</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Poin disiplin per siswa</li>
                <li>• Kategori pelanggaran terbanyak</li>
                <li>• Trend pelanggaran per periode</li>
                <li>• Rekomendasi tindak lanjut</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Laporan Prestasi</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Prestasi per kategori</li>
                <li>• Siswa berprestasi terbaik</li>
                <li>• Distribusi prestasi per kelas</li>
                <li>• Trend pencapaian prestasi</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
