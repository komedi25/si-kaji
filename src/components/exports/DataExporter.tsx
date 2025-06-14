
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type ExportType = 'violations' | 'achievements' | 'attendance' | 'students' | 'all';

export const DataExporter = () => {
  const [exportType, setExportType] = useState<ExportType>('violations');
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportConfigs = {
    violations: {
      title: 'Data Pelanggaran Siswa',
      description: 'Export data pelanggaran dengan detail siswa dan jenis pelanggaran',
      icon: FileText
    },
    achievements: {
      title: 'Data Prestasi Siswa',
      description: 'Export data prestasi dengan detail siswa dan jenis prestasi',
      icon: FileText
    },
    attendance: {
      title: 'Data Kehadiran Siswa',
      description: 'Export data kehadiran harian siswa',
      icon: Calendar
    },
    students: {
      title: 'Data Master Siswa',
      description: 'Export data lengkap siswa dan kelas',
      icon: FileText
    },
    all: {
      title: 'Data Lengkap Sistem',
      description: 'Export semua data dalam satu file (Excel dengan multiple sheets)',
      icon: Download
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let data: any[] = [];
      let filename = '';

      switch (exportType) {
        case 'violations':
          const { data: violations } = await supabase
            .from('student_violations')
            .select(`
              *,
              students(full_name, nis),
              violation_types(name, category, point_deduction)
            `)
            .gte('violation_date', startDate)
            .lte('violation_date', endDate)
            .order('violation_date', { ascending: false });
          
          data = violations?.map(v => ({
            'Tanggal': format(new Date(v.violation_date), 'dd/MM/yyyy'),
            'Nama Siswa': v.students?.full_name,
            'NIS': v.students?.nis,
            'Jenis Pelanggaran': v.violation_types?.name,
            'Kategori': v.violation_types?.category,
            'Poin Dikurangi': v.point_deduction,
            'Deskripsi': v.description || '-',
            'Status': v.status
          })) || [];
          
          filename = `Data_Pelanggaran_${format(new Date(startDate), 'ddMMyyyy')}_${format(new Date(endDate), 'ddMMyyyy')}`;
          break;

        case 'achievements':
          const { data: achievements } = await supabase
            .from('student_achievements')
            .select(`
              *,
              students(full_name, nis),
              achievement_types(name, category, level, point_reward)
            `)
            .gte('achievement_date', startDate)
            .lte('achievement_date', endDate)
            .order('achievement_date', { ascending: false });
          
          data = achievements?.map(a => ({
            'Tanggal': format(new Date(a.achievement_date), 'dd/MM/yyyy'),
            'Nama Siswa': a.students?.full_name,
            'NIS': a.students?.nis,
            'Jenis Prestasi': a.achievement_types?.name,
            'Kategori': a.achievement_types?.category,
            'Level': a.achievement_types?.level,
            'Poin Reward': a.point_reward,
            'Deskripsi': a.description || '-',
            'Status': a.status
          })) || [];
          
          filename = `Data_Prestasi_${format(new Date(startDate), 'ddMMyyyy')}_${format(new Date(endDate), 'ddMMyyyy')}`;
          break;

        case 'students':
          const { data: students } = await supabase
            .from('students')
            .select(`
              *,
              current_enrollment:student_enrollments(
                classes(name, grade, majors(name))
              )
            `)
            .eq('status', 'active');
          
          data = students?.map(s => ({
            'NIS': s.nis,
            'NISN': s.nisn || '-',
            'Nama Lengkap': s.full_name,
            'Jenis Kelamin': s.gender === 'male' ? 'Laki-laki' : 'Perempuan',
            'Tempat Lahir': s.birth_place || '-',
            'Tanggal Lahir': s.birth_date ? format(new Date(s.birth_date), 'dd/MM/yyyy') : '-',
            'Kelas': s.current_enrollment?.[0]?.classes?.name || '-',
            'Jurusan': s.current_enrollment?.[0]?.classes?.majors?.name || '-',
            'Alamat': s.address || '-',
            'No. HP': s.phone || '-',
            'Status': s.status
          })) || [];
          
          filename = `Data_Siswa_${format(new Date(), 'ddMMyyyy')}`;
          break;
      }

      // Convert to CSV format
      if (data.length === 0) {
        toast({
          title: "Tidak Ada Data",
          description: "Tidak ada data untuk periode yang dipilih",
          variant: "destructive"
        });
        return;
      }

      const csvContent = convertToCSV(data);
      downloadCSV(csvContent, filename);

      toast({
        title: "Export Berhasil",
        description: `File ${filename}.csv telah berhasil diunduh`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat mengexport data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value || '');
        return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const BOM = '\uFEFF'; // UTF-8 BOM for proper encoding
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const config = exportConfigs[exportType];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Data Sistem
        </CardTitle>
        <CardDescription>
          Export data sistem ke format CSV untuk analisis lebih lanjut
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="export-type">Jenis Data Export</Label>
            <Select value={exportType} onValueChange={(value: ExportType) => setExportType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis data" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(exportConfigs).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <config.icon className="h-4 w-4" />
                      {config.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {exportType !== 'students' && exportType !== 'all' && (
            <>
              <div>
                <Label htmlFor="start-date">Tanggal Mulai</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Tanggal Selesai</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <config.icon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">{config.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{config.description}</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Mengexport...' : `Export ${config.title}`}
        </Button>
      </CardContent>
    </Card>
  );
};
