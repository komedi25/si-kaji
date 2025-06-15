import { useState, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            current += '"';
            j++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', event.target.files);
    
    try {
      setImporting(true);
      setImportResults(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Silakan pilih file CSV');
      }

      const file = event.target.files[0];
      console.log('Selected file:', file.name, file.type, file.size);
      
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('File harus berformat CSV');
      }

      const text = await file.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        throw new Error('File CSV kosong atau format tidak valid');
      }

      console.log('Parsed CSV data:', data);

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

          // Parse date if provided
          let birthDate = null;
          if (row['Tanggal Lahir']) {
            try {
              // Handle various date formats
              const dateStr = row['Tanggal Lahir'];
              if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  // Assume DD/MM/YYYY format
                  birthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
              } else if (dateStr.includes('-')) {
                birthDate = dateStr; // Assume YYYY-MM-DD format
              }
            } catch (e) {
              console.warn(`Invalid date format for row ${index + 2}:`, row['Tanggal Lahir']);
            }
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
              birth_date: birthDate,
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
            console.error('Insert error:', error);
            results.errors.push(`Baris ${index + 2}: ${error.message}`);
          } else {
            results.success++;
          }
        } catch (error) {
          console.error('Row processing error:', error);
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    console.log('Import button clicked');
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={importing}
            style={{ display: 'none' }}
          />
          <Button 
            onClick={handleImportClick}
            disabled={importing}
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing ? 'Mengimport...' : 'Import CSV'}
          </Button>
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
          <li>Format tanggal: DD/MM/YYYY atau YYYY-MM-DD</li>
        </ul>
      </div>
    </div>
  );
};
