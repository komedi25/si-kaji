
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AttendanceData {
  student_name: string;
  class_name: string;
  attendance_date: string;
  status: string;
  notes?: string;
}

interface AttendanceReportExportProps {
  data: AttendanceData[];
  filename?: string;
  disabled?: boolean;
}

export const AttendanceReportExport: React.FC<AttendanceReportExportProps> = ({
  data,
  filename = 'laporan_presensi',
  disabled = false
}) => {
  const { toast } = useToast();

  const exportToExcel = () => {
    try {
      if (!data || data.length === 0) {
        toast({
          title: "Peringatan",
          description: "Tidak ada data untuk diekspor",
          variant: "destructive"
        });
        return;
      }

      // Create CSV content
      const headers = ['Nama Siswa', 'Kelas', 'Tanggal', 'Status', 'Keterangan'];
      const csvContent = [
        headers.join(','),
        ...data.map(row => [
          `"${row.student_name}"`,
          `"${row.class_name}"`,
          `"${row.attendance_date}"`,
          `"${getStatusLabel(row.status)}"`,
          `"${row.notes || '-'}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Berhasil",
        description: "Laporan berhasil diekspor ke Excel"
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Gagal mengekspor laporan",
        variant: "destructive"
      });
    }
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'present': 'Hadir',
      'absent': 'Tidak Hadir',
      'late': 'Terlambat',
      'sick': 'Sakit',
      'permission': 'Izin'
    };
    return statusMap[status] || status;
  };

  return (
    <Button
      onClick={exportToExcel}
      disabled={disabled || !data || data.length === 0}
      variant="outline"
      size="sm"
    >
      <Download className="h-4 w-4 mr-2" />
      Export Excel
    </Button>
  );
};
