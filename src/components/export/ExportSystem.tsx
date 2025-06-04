
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Download, FileText, FileSpreadsheet, Image } from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'image';
  reportType: string;
  dateRange?: DateRange;
  filters: {
    includeCharts: boolean;
    includeRawData: boolean;
    includeAnalysis: boolean;
  };
}

export const ExportSystem = () => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    reportType: '',
    filters: {
      includeCharts: true,
      includeRawData: true,
      includeAnalysis: true
    }
  });
  const [isExporting, setIsExporting] = useState(false);

  const reportTypes = [
    { value: 'student-summary', label: 'Laporan Ringkasan Siswa' },
    { value: 'attendance-report', label: 'Laporan Kehadiran' },
    { value: 'violation-report', label: 'Laporan Pelanggaran' },
    { value: 'achievement-report', label: 'Laporan Prestasi' },
    { value: 'discipline-points', label: 'Laporan Poin Disiplin' },
    { value: 'case-report', label: 'Laporan Kasus BK' },
    { value: 'activity-report', label: 'Laporan Kegiatan' },
    { value: 'comprehensive', label: 'Laporan Komprehensif' }
  ];

  const handleExport = async () => {
    if (!exportOptions.reportType) {
      toast.error('Pilih jenis laporan yang akan diekspor');
      return;
    }

    setIsExporting(true);

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would call API to generate and download file
      const fileName = `${exportOptions.reportType}-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      
      toast.success(`Export berhasil! File ${fileName} akan segera diunduh.`);
      
      // Simulate file download
      const element = document.createElement('a');
      element.href = '#'; // In real implementation, this would be the download URL
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
    } catch (error) {
      toast.error('Export gagal. Silakan coba lagi.');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'excel':
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="report-type">Jenis Laporan</Label>
          <Select
            value={exportOptions.reportType}
            onValueChange={(value) => setExportOptions(prev => ({ ...prev, reportType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis laporan" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Format Export</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(['pdf', 'excel', 'csv', 'image'] as const).map((format) => (
              <Button
                key={format}
                variant={exportOptions.format === format ? 'default' : 'outline'}
                onClick={() => setExportOptions(prev => ({ ...prev, format }))}
                className="flex items-center gap-2"
              >
                {getFormatIcon(format)}
                {format.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="space-y-2">
          <Label>Rentang Tanggal (Opsional)</Label>
          <DatePickerWithRange
            date={exportOptions.dateRange}
            onDateChange={(range) => setExportOptions(prev => ({ ...prev, dateRange: range }))}
          />
        </div>

        {/* Export Filters */}
        <div className="space-y-3">
          <Label>Opsi Export</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-charts"
                checked={exportOptions.filters.includeCharts}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({
                    ...prev,
                    filters: { ...prev.filters, includeCharts: checked as boolean }
                  }))
                }
              />
              <Label htmlFor="include-charts" className="text-sm">
                Sertakan grafik dan visualisasi
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-raw-data"
                checked={exportOptions.filters.includeRawData}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({
                    ...prev,
                    filters: { ...prev.filters, includeRawData: checked as boolean }
                  }))
                }
              />
              <Label htmlFor="include-raw-data" className="text-sm">
                Sertakan data mentah
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-analysis"
                checked={exportOptions.filters.includeAnalysis}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({
                    ...prev,
                    filters: { ...prev.filters, includeAnalysis: checked as boolean }
                  }))
                }
              />
              <Label htmlFor="include-analysis" className="text-sm">
                Sertakan analisis dan insight
              </Label>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <Button 
          onClick={handleExport} 
          disabled={isExporting || !exportOptions.reportType}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export {exportOptions.format.toUpperCase()}
            </>
          )}
        </Button>

        {/* Export Info */}
        <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Informasi Export:</p>
          <ul className="text-xs space-y-1">
            <li>• PDF: Cocok untuk laporan formal dan presentasi</li>
            <li>• Excel: Memungkinkan analisis lebih lanjut</li>
            <li>• CSV: Format universal untuk import ke sistem lain</li>
            <li>• Image: Untuk berbagi visualisasi cepat</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
