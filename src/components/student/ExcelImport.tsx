
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExcelImportProps {
  onImportComplete: () => void;
}

export const ExcelImport = ({ onImportComplete }: ExcelImportProps) => {
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = [
      'NIS,NISN,Nama Lengkap,Jenis Kelamin,Tempat Lahir,Tanggal Lahir,Agama,Alamat,Telepon,Nama Orang Tua,Telepon Orang Tua,Alamat Orang Tua',
      '2024001,1234567890,John Doe,L,Jakarta,2008-01-15,Islam,Jl. Contoh No. 1,08123456789,Jane Doe,08198765432,Jl. Contoh No. 1'
    ].join('\n');

    const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template-import-siswa.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setImporting(true);
      setImportResults(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Silakan pilih file CSV');
      }

      const file = event.target.files[0];
      const text = await file.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        throw new Error('File CSV kosong atau format tidak valid');
      }

      const results = { success: 0, errors: [] as string[] };

      for (const [index, row] of data.entries()) {
        try {
          // Validate required fields
          if (!row['NIS'] || !row['Nama Lengkap']) {
            results.errors.push(`Baris ${index + 2}: NIS dan Nama Lengkap wajib diisi`);
            continue;
          }

          // Check if student already exists
          const { data: existingStudent } = await supabase
            .from('students')
            .select('id')
            .eq('nis', row['NIS'])
            .single();

          if (existingStudent) {
            results.errors.push(`Baris ${index + 2}: NIS ${row['NIS']} sudah ada`);
            continue;
          }

          // Insert new student
          const { error } = await supabase
            .from('students')
            .insert({
              nis: row['NIS'],
              nisn: row['NISN'] || null,
              full_name: row['Nama Lengkap'],
              gender: row['Jenis Kelamin'] === 'L' ? 'L' : 'P',
              birth_place: row['Tempat Lahir'] || null,
              birth_date: row['Tanggal Lahir'] || null,
              religion: row['Agama'] || null,
              address: row['Alamat'] || null,
              phone: row['Telepon'] || null,
              parent_name: row['Nama Orang Tua'] || null,
              parent_phone: row['Telepon Orang Tua'] || null,
              parent_address: row['Alamat Orang Tua'] || null,
              admission_date: new Date().toISOString().split('T')[0],
              status: 'active'
            });

          if (error) {
            results.errors.push(`Baris ${index + 2}: ${error.message}`);
          } else {
            results.success++;
          }
        } catch (error) {
          results.errors.push(`Baris ${index + 2}: ${error instanceof Error ? error.message : 'Error tidak diketahui'}`);
        }
      }

      setImportResults(results);

      if (results.success > 0) {
        toast({
          title: "Import Berhasil",
          description: `${results.success} siswa berhasil diimport`,
        });
        onImportComplete();
      }

      if (results.errors.length > 0) {
        toast({
          title: "Import Selesai dengan Error",
          description: `${results.errors.length} baris gagal diimport`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengimport data",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
        
        <div>
          <Input
            type="file"
            accept=".csv"
            onChange={importData}
            disabled={importing}
            className="hidden"
            id="csv-import"
          />
          <Label htmlFor="csv-import" asChild>
            <Button disabled={importing}>
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Mengimport...' : 'Import CSV'}
            </Button>
          </Label>
        </div>
      </div>

      {importResults && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Hasil Import:</strong></p>
              <p>✅ Berhasil: {importResults.success} siswa</p>
              {importResults.errors.length > 0 && (
                <div>
                  <p>❌ Error: {importResults.errors.length} baris</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer">Detail Error</summary>
                    <ul className="mt-2 space-y-1 text-sm">
                      {importResults.errors.slice(0, 10).map((error, index) => (
                        <li key={index} className="text-red-600">• {error}</li>
                      ))}
                      {importResults.errors.length > 10 && (
                        <li className="text-gray-500">... dan {importResults.errors.length - 10} error lainnya</li>
                      )}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-gray-500">
        <p><strong>Petunjuk:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Download template terlebih dahulu</li>
          <li>Isi data sesuai format template</li>
          <li>Upload file CSV yang sudah diisi</li>
          <li>NIS dan Nama Lengkap wajib diisi</li>
          <li>Jenis Kelamin: L (Laki-laki) atau P (Perempuan)</li>
        </ul>
      </div>
    </div>
  );
};
