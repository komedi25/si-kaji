
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { StudentWithClass } from '@/types/student';

interface ExcelExportProps {
  students: StudentWithClass[];
  filename?: string;
}

export const ExcelExport = ({ students, filename = 'data-siswa' }: ExcelExportProps) => {
  const exportToExcel = () => {
    // Prepare data for export
    const exportData = students.map(student => ({
      'NIS': student.nis,
      'NISN': student.nisn || '',
      'Nama Lengkap': student.full_name,
      'Jenis Kelamin': student.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      'Tempat Lahir': student.birth_place || '',
      'Tanggal Lahir': student.birth_date || '',
      'Agama': student.religion || '',
      'Alamat': student.address || '',
      'Telepon': student.phone || '',
      'Nama Orang Tua': student.parent_name || '',
      'Telepon Orang Tua': student.parent_phone || '',
      'Alamat Orang Tua': student.parent_address || '',
      'Kelas': student.current_class?.name || '',
      'Jurusan': student.current_class?.major?.name || '',
      'Status': student.status,
      'Tanggal Masuk': student.admission_date,
      'Tanggal Lulus': student.graduation_date || ''
    }));

    // Convert to CSV format (simpler than Excel for now)
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row] || '';
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button 
      variant="outline" 
      onClick={exportToExcel}
      disabled={students.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
};
